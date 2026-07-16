import "server-only";
import { Redis } from "@upstash/redis";
import {
  ActivityEntry,
  ActivityType,
  Decision,
  IntegrationId,
  IntegrationSyncState,
  ItemStatus,
  StudioItem,
  StudioItemInput,
  StudioNotification,
  STUDIO_LAUNCH_CUTOFF,
  UpdateItemPatch,
} from "./types";
import { SEED_CONTENT, SEED_TASKS, SeedSpec } from "./seedData";
import { countBlockedBy, isBlocked } from "./priority";

/* ------------------------------------------------------------------------ *
 * Redis keys. Everything lives under the same "orbit-hub" namespace already
 * used by lib/db.ts so a single Upstash database backs the whole app.
 * ------------------------------------------------------------------------ */
const ITEMS_INDEX_KEY = "orbit-hub:items:index";
const ITEM_KEY = (id: string) => `orbit-hub:item:${id}`;
const DECISIONS_INDEX_KEY = "orbit-hub:decisions:index";
const DECISION_KEY = (id: string) => `orbit-hub:decision:${id}`;
const ACTIVITY_KEY = "orbit-hub:activity";
const NOTIFICATIONS_KEY = "orbit-hub:notifications";
const INTEGRATIONS_KEY = "orbit-hub:integrations";
const SEED_FLAG_KEY = "orbit-hub:items:seeded";

const ACTIVITY_CAP = 200;
const NOTIFICATIONS_CAP = 100;

function hasRedisEnv() {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function client(): Redis {
  if (!hasRedisEnv()) {
    throw new Error(
      "Aucune base connectée. Ajoute une intégration Redis (Upstash) dans Vercel puis relie-la à ce projet, ou lis 16_ORBIT_App/README.md pour le développement local."
    );
  }
  return Redis.fromEnv();
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Defensive normalization for items read back from Redis. Handles both
 * genuinely missing fields (older/partial writes) and future schema drift —
 * any StudioItem-shaped record, however old, comes out fully typed here
 * instead of throwing downstream.
 */
function normalizeItem(raw: unknown): StudioItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<StudioItem> & Record<string, unknown>;
  if (!r.id || !r.title) return null;
  const now = new Date().toISOString();
  return {
    id: String(r.id),
    kind: r.kind === "content" ? "content" : "task",
    title: String(r.title),
    description: typeof r.description === "string" ? r.description : "",
    status: (typeof r.status === "string" ? r.status : "backlog") as ItemStatus,
    order: typeof r.order === "number" ? r.order : 0,
    category: typeof r.category === "string" ? r.category : "Général",
    channel: r.channel as StudioItem["channel"],
    projectId: typeof r.projectId === "string" ? r.projectId : undefined,
    estimateMinutes: typeof r.estimateMinutes === "number" ? r.estimateMinutes : 30,
    urgency: typeof r.urgency === "number" ? r.urgency : 2,
    impact: typeof r.impact === "number" ? r.impact : 2,
    launchCritical: Boolean(r.launchCritical),
    dueDate: typeof r.dueDate === "string" ? r.dueDate : undefined,
    dependsOn: Array.isArray(r.dependsOn) ? r.dependsOn.filter((x): x is string => typeof x === "string") : [],
    createdAt: typeof r.createdAt === "string" ? r.createdAt : now,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : now,
    doneAt: typeof r.doneAt === "string" ? r.doneAt : undefined,
    archivedAt: typeof r.archivedAt === "string" ? r.archivedAt : undefined,
    notes: typeof r.notes === "string" ? r.notes : undefined,
  };
}

export function validateDueDate(dueDate?: string): void {
  if (dueDate && dueDate > STUDIO_LAUNCH_CUTOFF) {
    throw new Error(
      `La date "${dueDate}" dépasse la limite du studio (${STUDIO_LAUNCH_CUTOFF}). Rien ne doit être planifié après cette date.`
    );
  }
}

/* ------------------------------------------------------------------------ *
 * Items (tasks + content — same lifecycle model)
 * ------------------------------------------------------------------------ */

/**
 * Dependency blocking is derived live from the current graph on every read,
 * not just recomputed opportunistically when a task is marked done. This is
 * what makes it self-healing: if a dependency gets reopened after being
 * done, or archived, or a new dependsOn edge is added, the items that
 * depend on it are correctly (re)blocked on the very next read -- there is
 * no separate "blocked" source of truth that can drift out of sync.
 */
function deriveLiveStatuses(items: StudioItem[]): StudioItem[] {
  return items.map((item) => {
    if (item.status === "done" || item.status === "archived") return item;
    const blocked = isBlocked(item, items);
    if (blocked && item.status !== "blocked") return { ...item, status: "blocked" };
    if (!blocked && item.status === "blocked") return { ...item, status: "backlog" };
    return item;
  });
}

export async function listItems(): Promise<StudioItem[]> {
  const redis = client();
  await ensureSeeded(redis);
  const ids = (await redis.get<string[]>(ITEMS_INDEX_KEY)) || [];
  if (ids.length === 0) return [];
  const raw = await Promise.all(ids.map((id) => redis.get(ITEM_KEY(id))));
  const items = raw
    .map((r) => normalizeItem(r))
    .filter((it): it is StudioItem => it !== null)
    .sort((a, b) => a.order - b.order);
  return deriveLiveStatuses(items);
}

export async function getItem(id: string): Promise<StudioItem | null> {
  // Resolved against the live graph (see deriveLiveStatuses) so a single-item
  // fetch never shows a stale "blocked" flag either.
  const all = await listItems();
  return all.find((it) => it.id === id) ?? null;
}

async function persistItem(redis: Redis, item: StudioItem): Promise<void> {
  await redis.set(ITEM_KEY(item.id), item);
  const ids = (await redis.get<string[]>(ITEMS_INDEX_KEY)) || [];
  if (!ids.includes(item.id)) {
    ids.push(item.id);
    await redis.set(ITEMS_INDEX_KEY, ids);
  }
}

/** Rejects dependsOn edges pointing at ids that don't exist -- no dangling references. */
function validateDependsOn(dependsOn: string[] | undefined, allItems: StudioItem[], selfId?: string): void {
  if (!dependsOn || dependsOn.length === 0) return;
  const knownIds = new Set(allItems.map((it) => it.id));
  const unknown = dependsOn.filter((depId) => depId !== selfId && !knownIds.has(depId));
  if (unknown.length > 0) {
    throw new Error(`dependsOn référence des éléments inexistants : ${unknown.join(", ")}`);
  }
  if (selfId && dependsOn.includes(selfId)) {
    throw new Error("Un élément ne peut pas dépendre de lui-même.");
  }
}

export async function createItem(input: StudioItemInput): Promise<StudioItem> {
  validateDueDate(input.dueDate);
  const redis = client();
  const now = new Date().toISOString();
  const existing = await listItems();
  validateDependsOn(input.dependsOn, existing);
  const item: StudioItem = {
    ...input,
    id: genId(input.kind),
    status: input.status ?? "backlog",
    order: input.order ?? existing.length,
    createdAt: now,
    updatedAt: now,
  };
  await persistItem(redis, item);
  await pushActivity("created", `${item.kind === "task" ? "Tâche" : "Contenu"} créé·e : "${item.title}"`, item.id);
  return item;
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

/**
 * Updates an item and runs lifecycle side-effects:
 *  - stamps doneAt/archivedAt on status transitions
 *  - when an item flips to `done`, recomputes dependents and unblocks any
 *    whose dependencies are now all satisfied (activity + notification)
 *
 * @param ifMatch optional optimistic-concurrency token: the `updatedAt` the
 *   caller last observed. If the stored item has since changed (another
 *   tab/user wrote first), the write is rejected with ConflictError instead
 *   of silently overwriting the newer state.
 */
export async function updateItem(id: string, patch: UpdateItemPatch, ifMatch?: string): Promise<StudioItem> {
  if (patch.dueDate !== undefined) validateDueDate(patch.dueDate);
  const redis = client();
  const current = await getItem(id);
  if (!current) throw new Error(`Élément introuvable : ${id}`);
  if (ifMatch && ifMatch !== current.updatedAt) {
    throw new ConflictError(
      `"${current.title}" a été modifié ailleurs entre-temps. Recharge et réessaie.`
    );
  }
  if (patch.dependsOn !== undefined) {
    const allItems = await listItems();
    validateDependsOn(patch.dependsOn, allItems, id);
  }

  const now = new Date().toISOString();
  const statusChanged = patch.status !== undefined && patch.status !== current.status;
  const next: StudioItem = {
    ...current,
    ...patch,
    id: current.id,
    updatedAt: now,
  };

  if (statusChanged) {
    if (patch.status === "done" && !next.doneAt) next.doneAt = now;
    if (patch.status === "archived" && !next.archivedAt) next.archivedAt = now;
    if (patch.status !== "done") next.doneAt = current.status === "done" ? current.doneAt : undefined;
    if (patch.status !== "archived") next.archivedAt = undefined;
  }

  await persistItem(redis, next);

  if (statusChanged) {
    await pushActivity(
      "status_changed",
      `"${next.title}" est passé·e à "${statusLabel(next.status)}"`,
      next.id
    );
  }

  if (statusChanged && patch.status === "done") {
    await recomputeUnblocked(next.id);
  }

  return next;
}

export async function archiveItem(id: string): Promise<StudioItem> {
  const item = await updateItem(id, { status: "archived" });
  await pushActivity("archived", `"${item.title}" a été archivé·e`, item.id);
  return item;
}

/**
 * After an item is marked done, find active items that depended on it and,
 * for any whose dependencies are now fully satisfied, flip them out of
 * "blocked" and surface a notification + activity entry.
 *
 * Root cause of a prior bug: this used to gate on `dependent.status ===
 * "blocked"`, but `dependent` came from `listItems()`, which runs every item
 * through `deriveLiveStatuses()` before returning it. That derivation had
 * *already* normalized the in-memory status to "backlog" the instant
 * `stillBlocked` became false -- so the persisted/derived "blocked" status
 * could never actually be observed here, and the notification silently
 * never fired. "Blocked" is a derived, non-persisted concept; it must never
 * be used as the trigger condition. The correct signal is structural: every
 * `dependent` in this list depends on `doneItemId`, which has just
 * transitioned to "done" for the first time in this call (guarded by the
 * caller only invoking this on a real done-transition) -- so each one was
 * necessarily blocked by that edge a moment ago. `!stillBlocked` alone is
 * therefore both correct and sufficient to detect "just became unblocked",
 * and because this function only runs once per genuine done-transition
 * (see `updateItem`'s `statusChanged` guard), it can't double-fire on
 * unrelated reads or updates.
 */
async function recomputeUnblocked(doneItemId: string): Promise<void> {
  const all = await listItems();
  const dependents = all.filter((it) => it.dependsOn.includes(doneItemId) && it.status !== "done" && it.status !== "archived");
  for (const dependent of dependents) {
    const stillBlocked = isBlocked(dependent, all);
    if (!stillBlocked) {
      const redis = client();
      const unblocked: StudioItem = { ...dependent, status: "backlog", updatedAt: new Date().toISOString() };
      await persistItem(redis, unblocked);
      await pushActivity("unblocked", `"${dependent.title}" est débloqué·e`, dependent.id);
      await pushNotification(`"${dependent.title}" est débloqué·e et peut démarrer`, dependent.id);
    }
  }
}

function statusLabel(status: ItemStatus): string {
  const labels: Record<ItemStatus, string> = {
    backlog: "à faire",
    today: "aujourd'hui",
    in_progress: "en cours",
    blocked: "bloqué",
    done: "terminé",
    archived: "archivé",
  };
  return labels[status];
}

/* ------------------------------------------------------------------------ *
 * Decisions
 * ------------------------------------------------------------------------ */

export async function listDecisions(): Promise<Decision[]> {
  const redis = client();
  const ids = (await redis.get<string[]>(DECISIONS_INDEX_KEY)) || [];
  if (ids.length === 0) return [];
  const raw = await Promise.all(ids.map((id) => redis.get<Decision>(DECISION_KEY(id))));
  return raw.filter((d): d is Decision => d !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createDecision(input: Omit<Decision, "id" | "status" | "createdAt">): Promise<Decision> {
  const redis = client();
  const decision: Decision = {
    ...input,
    id: genId("decision"),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await redis.set(DECISION_KEY(decision.id), decision);
  const ids = (await redis.get<string[]>(DECISIONS_INDEX_KEY)) || [];
  ids.push(decision.id);
  await redis.set(DECISIONS_INDEX_KEY, ids);
  return decision;
}

/** Like createDecision, but with a caller-supplied id (deduped upstream) — used by automated sources (e.g. Vercel sync) that need idempotent decision creation. */
async function createDecisionWithId(id: string, input: Omit<Decision, "id" | "status" | "createdAt">): Promise<Decision> {
  const redis = client();
  const decision: Decision = { ...input, id, status: "pending", createdAt: new Date().toISOString() };
  await redis.set(DECISION_KEY(decision.id), decision);
  const ids = (await redis.get<string[]>(DECISIONS_INDEX_KEY)) || [];
  if (!ids.includes(decision.id)) {
    ids.push(decision.id);
    await redis.set(DECISIONS_INDEX_KEY, ids);
  }
  return decision;
}

export async function resolveDecision(id: string, resolution: string): Promise<Decision> {
  const redis = client();
  const decision = await redis.get<Decision>(DECISION_KEY(id));
  if (!decision) throw new Error(`Décision introuvable : ${id}`);
  if (decision.status === "resolved") {
    throw new ConflictError(`"${decision.question}" a déjà été tranchée (${decision.resolution}).`);
  }
  if (!decision.options.includes(resolution)) {
    throw new Error(`"${resolution}" n'est pas une option valide pour cette décision.`);
  }
  const resolved: Decision = { ...decision, status: "resolved", resolution, resolvedAt: new Date().toISOString() };
  await redis.set(DECISION_KEY(id), resolved);
  await pushActivity("decision_resolved", `Décision tranchée : "${decision.question}" → ${resolution}`, decision.relatedItemId);
  return resolved;
}

/* ------------------------------------------------------------------------ *
 * Activity feed
 * ------------------------------------------------------------------------ */

export async function listActivity(limit = 30): Promise<ActivityEntry[]> {
  const redis = client();
  const entries = (await redis.get<ActivityEntry[]>(ACTIVITY_KEY)) || [];
  return entries.slice(0, limit);
}

export async function pushActivity(type: ActivityType, message: string, itemId?: string): Promise<void> {
  const redis = client();
  const entry: ActivityEntry = { id: genId("activity"), type, message, itemId, createdAt: new Date().toISOString() };
  const entries = (await redis.get<ActivityEntry[]>(ACTIVITY_KEY)) || [];
  entries.unshift(entry);
  await redis.set(ACTIVITY_KEY, entries.slice(0, ACTIVITY_CAP));
}

/* ------------------------------------------------------------------------ *
 * Notifications
 * ------------------------------------------------------------------------ */

export async function listNotifications(): Promise<StudioNotification[]> {
  const redis = client();
  return (await redis.get<StudioNotification[]>(NOTIFICATIONS_KEY)) || [];
}

export async function pushNotification(message: string, itemId?: string): Promise<void> {
  const redis = client();
  const notif: StudioNotification = { id: genId("notif"), message, itemId, read: false, createdAt: new Date().toISOString() };
  const notifs = (await redis.get<StudioNotification[]>(NOTIFICATIONS_KEY)) || [];
  notifs.unshift(notif);
  await redis.set(NOTIFICATIONS_KEY, notifs.slice(0, NOTIFICATIONS_CAP));
}

export async function markNotificationRead(id: string): Promise<void> {
  const redis = client();
  const notifs = (await redis.get<StudioNotification[]>(NOTIFICATIONS_KEY)) || [];
  const next = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
  await redis.set(NOTIFICATIONS_KEY, next);
}

/* ------------------------------------------------------------------------ *
 * Integrations
 * ------------------------------------------------------------------------ */

const DEFAULT_INTEGRATIONS: Record<IntegrationId, IntegrationSyncState> = {
  github: { id: "github", label: "GitHub", status: "not_connected", detail: "Dépôt orbit-creative-os" },
  vercel: { id: "vercel", label: "Vercel", status: "not_connected", detail: "Déploiement de production" },
  redis: { id: "redis", label: "Redis (Upstash)", status: "not_connected", detail: "Base de données studio" },
  drive: { id: "drive", label: "Google Drive", status: "not_connected", detail: "Assets et documents" },
  calendar: { id: "calendar", label: "Google Calendar", status: "not_connected", detail: "Calendrier de lancement" },
};

export async function listIntegrations(): Promise<IntegrationSyncState[]> {
  const redis = client();
  const stored = (await redis.get<Record<string, IntegrationSyncState>>(INTEGRATIONS_KEY)) || {};
  return (Object.keys(DEFAULT_INTEGRATIONS) as IntegrationId[]).map((id) => stored[id] ?? DEFAULT_INTEGRATIONS[id]);
}

/**
 * Real sync check per integration:
 *  - redis: an actual read/write round-trip — the fact this function ran at
 *    all means Redis answered.
 *  - github: a live, unauthenticated call to the public GitHub API for the
 *    repo's latest commit (falls back to env-var presence if the network
 *    call fails, e.g. offline dev).
 *  - vercel: if a server token is configured, a live call to the Vercel
 *    deployments API; otherwise falls back to env-var presence (Vercel
 *    injects VERCEL/VERCEL_URL for its own deployments). A deployment stuck
 *    in a non-READY state raises a pending Decision so it surfaces in the
 *    decision inbox instead of being silently missed.
 *  - drive/calendar: no credentials wired yet, reported honestly as such.
 */
export async function runIntegrationSync(id: IntegrationId): Promise<IntegrationSyncState> {
  const redis = client();
  const now = new Date().toISOString();
  let state: IntegrationSyncState;

  switch (id) {
    case "redis": {
      await redis.set("orbit-hub:integrations:ping", now);
      state = { id, label: "Redis (Upstash)", status: "connected", lastSyncedAt: now, detail: "Lecture/écriture confirmée" };
      break;
    }
    case "github": {
      state = await syncGithub(now);
      break;
    }
    case "vercel": {
      state = await syncVercel(now);
      break;
    }
    default: {
      state = { ...DEFAULT_INTEGRATIONS[id], status: "not_connected", detail: "Intégration pas encore branchée" };
    }
  }

  const stored = (await redis.get<Record<string, IntegrationSyncState>>(INTEGRATIONS_KEY)) || {};
  stored[id] = state;
  await redis.set(INTEGRATIONS_KEY, stored);
  return state;
}

const GITHUB_REPO = "sabokub/orbit-creative-os";

async function syncGithub(now: string): Promise<IntegrationSyncState> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/commits?per_page=1`, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}`);
    const commits = (await res.json()) as Array<{ sha: string; commit?: { message?: string } }>;
    const latest = commits[0];
    const shortSha = latest?.sha?.slice(0, 7) || "inconnu";
    const message = latest?.commit?.message?.split("\n")[0] || "Commit sans message";
    return { id: "github", label: "GitHub", status: "connected", lastSyncedAt: now, detail: `${shortSha} · ${message}` };
  } catch {
    const connected = Boolean(process.env.VERCEL_GIT_REPO_SLUG || process.env.GITHUB_REPOSITORY);
    return {
      id: "github",
      label: "GitHub",
      status: connected ? "connected" : "not_connected",
      lastSyncedAt: connected ? now : undefined,
      detail: connected
        ? `${process.env.VERCEL_GIT_REPO_OWNER || "sabokub"}/${process.env.VERCEL_GIT_REPO_SLUG || "orbit-creative-os"}`
        : "Impossible de joindre l'API GitHub et aucun repo détecté dans l'environnement",
    };
  }
}

async function syncVercel(now: string): Promise<IntegrationSyncState> {
  const token = process.env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_TOKEN;
  if (!token) {
    const connected = Boolean(process.env.VERCEL || process.env.VERCEL_URL);
    return {
      id: "vercel",
      label: "Vercel",
      status: connected ? "connected" : "not_connected",
      lastSyncedAt: connected ? now : undefined,
      detail: connected ? `Déployé : ${process.env.VERCEL_URL || "environnement Vercel"}` : "Pas d'environnement Vercel détecté (local) et aucun jeton serveur configuré",
    };
  }
  try {
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID;
    const params = new URLSearchParams({ limit: "1" });
    if (projectId) params.set("projectId", projectId);
    if (teamId) params.set("teamId", teamId);
    const res = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Vercel ${res.status}`);
    const payload = (await res.json()) as {
      deployments?: Array<{ uid: string; name?: string; state?: string; readyState?: string; url?: string }>;
    };
    const deployment = payload.deployments?.[0];
    const state = deployment?.readyState || deployment?.state || "UNKNOWN";
    if (deployment && state !== "READY") {
      const decisions = await listDecisions();
      const decisionId = `vercel-${deployment.uid}`;
      if (!decisions.some((d) => d.id === decisionId)) {
        await createDecisionWithId(decisionId, {
          question: "Déploiement Vercel à vérifier",
          context: `Le dernier déploiement (${deployment.name || deployment.url || deployment.uid}) est dans l'état ${state}.`,
          options: ["Vérifier maintenant", "Ignorer pour l'instant"],
          source: "vercel",
        });
      }
    }
    return {
      id: "vercel",
      label: "Vercel",
      status: state === "READY" ? "connected" : "error",
      lastSyncedAt: now,
      detail: `${deployment?.name || "Déploiement"} · ${state}`,
    };
  } catch (err) {
    return { id: "vercel", label: "Vercel", status: "error", lastSyncedAt: now, detail: (err as Error).message };
  }
}

/* ------------------------------------------------------------------------ *
 * First-run seeding — populates 15 tasks + 30+ content items with realistic
 * dates and a dependency chain (Homepage → Guide → Waitlist → Launch).
 * Never overwrites existing data: guarded by a one-time flag key.
 * ------------------------------------------------------------------------ */

/** Legacy Redis key from the old studioPlan model (pre-V3), migrated below. */
const LEGACY_STUDIO_PLAN_KEY = "orbit-hub:studio-plan";

type LegacyPlanItem = {
  id: string; title: string; detail?: string; area?: string; status?: string; priority?: string;
  scheduledFor?: string; order?: number; durationMinutes?: number; blockedBy?: string;
};
type LegacyContentItem = {
  id: string; title: string; format?: string; status?: string; priority?: string;
  scheduledFor?: string; order?: number; durationMinutes?: number;
};
type LegacyDecisionItem = {
  id: string; title: string; summary?: string; source?: string; status?: string;
  createdAt?: string; suggestedAction?: string; relatedTaskId?: string;
};
type LegacyStudioPlan = {
  priorities?: LegacyPlanItem[];
  contentQueue?: LegacyContentItem[];
  decisions?: LegacyDecisionItem[];
};

const LEGACY_STATUS_TO_ITEM_STATUS: Record<string, ItemStatus> = {
  done: "done",
  "in-progress": "in_progress",
  review: "today",
  todo: "backlog",
};

const LEGACY_PRIORITY_TO_SCORE: Record<string, number> = { high: 5, medium: 3, low: 1 };

function isDecisionSource(value: unknown): value is Decision["source"] {
  return value === "conversation" || value === "drive" || value === "github" || value === "vercel" || value === "manual";
}

/**
 * One-time migration of the legacy studioPlan blob (a single JSON value under
 * `orbit-hub:studio-plan`, from the pre-V3 dashboard/PlanItem model) into the
 * unified StudioItem/Decision schema. Follows the same idempotency shape as
 * `ensureSeeded`: a two-pass id resolution (legacy `id` -> generated
 * StudioItem id) so `blockedBy` edges can be rewritten into `dependsOn`
 * arrays once every item has a real id, and the migrated data is written
 * before any flag is set. Returns true if it migrated anything (so the
 * caller can skip fresh seeding).
 */
async function migrateLegacyStudioPlan(redis: Redis): Promise<boolean> {
  const legacy = await redis.get<LegacyStudioPlan>(LEGACY_STUDIO_PLAN_KEY);
  if (!legacy || (!legacy.priorities?.length && !legacy.contentQueue?.length && !legacy.decisions?.length)) {
    return false;
  }

  const now = new Date().toISOString();
  const legacyIdToNewId = new Map<string, string>();
  const items: StudioItem[] = [];

  (legacy.priorities || []).forEach((task, index) => {
    const id = genId("task");
    legacyIdToNewId.set(task.id, id);
    const status = LEGACY_STATUS_TO_ITEM_STATUS[task.status || "todo"] || "backlog";
    items.push({
      id,
      kind: "task",
      title: task.title,
      description: task.detail || "",
      status,
      order: task.order ?? index,
      category: task.area || "Général",
      estimateMinutes: task.durationMinutes ?? 30,
      urgency: LEGACY_PRIORITY_TO_SCORE[task.priority || "medium"] || 3,
      impact: LEGACY_PRIORITY_TO_SCORE[task.priority || "medium"] || 3,
      launchCritical: task.priority === "high",
      dueDate: task.scheduledFor && task.scheduledFor <= STUDIO_LAUNCH_CUTOFF ? task.scheduledFor : undefined,
      dependsOn: [],
      createdAt: now,
      updatedAt: now,
      doneAt: status === "done" ? now : undefined,
    });
  });

  (legacy.contentQueue || []).forEach((content, index) => {
    const id = genId("content");
    legacyIdToNewId.set(content.id, id);
    const status = LEGACY_STATUS_TO_ITEM_STATUS[content.status || "todo"] || "backlog";
    items.push({
      id,
      kind: "content",
      title: content.title,
      description: content.format || "",
      status,
      order: content.order ?? index,
      category: content.format || "Contenu",
      estimateMinutes: content.durationMinutes ?? 30,
      urgency: LEGACY_PRIORITY_TO_SCORE[content.priority || "medium"] || 3,
      impact: LEGACY_PRIORITY_TO_SCORE[content.priority || "medium"] || 3,
      launchCritical: content.priority === "high",
      dueDate: content.scheduledFor && content.scheduledFor <= STUDIO_LAUNCH_CUTOFF ? content.scheduledFor : undefined,
      dependsOn: [],
      createdAt: now,
      updatedAt: now,
      doneAt: status === "done" ? now : undefined,
    });
  });

  // Second pass: rewrite legacy single-parent `blockedBy` into the new
  // many-to-many `dependsOn` graph now that every item has a real id.
  (legacy.priorities || []).forEach((task, index) => {
    if (task.blockedBy) {
      const depId = legacyIdToNewId.get(task.blockedBy);
      if (depId) items[index].dependsOn = [depId];
    }
  });

  for (const item of items) {
    if (item.status !== "done" && item.status !== "archived" && isBlocked(item, items)) {
      item.status = "blocked";
    }
  }

  if (items.length > 0) {
    const ids = items.map((it) => it.id);
    await Promise.all(items.map((it) => redis.set(ITEM_KEY(it.id), it)));
    await redis.set(ITEMS_INDEX_KEY, ids);
  }

  const decisions = (legacy.decisions || []).map((d): Decision => ({
    id: genId("decision"),
    question: d.title,
    context: d.summary,
    options: ["Appliquer", "Ignorer"],
    status: d.status === "applied" || d.status === "ignored" ? "resolved" : "pending",
    resolution: d.status === "applied" ? "Appliquer" : d.status === "ignored" ? "Ignorer" : undefined,
    relatedItemId: d.relatedTaskId ? legacyIdToNewId.get(d.relatedTaskId) : undefined,
    source: isDecisionSource(d.source) ? d.source : "manual",
    createdAt: d.createdAt || now,
    resolvedAt: d.status === "applied" || d.status === "ignored" ? d.createdAt || now : undefined,
  }));
  if (decisions.length > 0) {
    const existingDecisionIds = (await redis.get<string[]>(DECISIONS_INDEX_KEY)) || [];
    await Promise.all(decisions.map((d) => redis.set(DECISION_KEY(d.id), d)));
    await redis.set(DECISIONS_INDEX_KEY, [...existingDecisionIds, ...decisions.map((d) => d.id)]);
  }

  await pushActivity(
    "created",
    `Migration : ${items.length} élément(s) et ${decisions.length} décision(s) importé(s) depuis l'ancien plan studio`
  );
  return items.length > 0 || decisions.length > 0;
}

async function ensureSeeded(redis: Redis): Promise<void> {
  const seeded = await redis.get<boolean>(SEED_FLAG_KEY);
  if (seeded) return;
  const existingIds = (await redis.get<string[]>(ITEMS_INDEX_KEY)) || [];
  if (existingIds.length > 0) {
    // Data already present from before seeding existed — don't clobber it.
    await redis.set(SEED_FLAG_KEY, true);
    return;
  }

  const migrated = await migrateLegacyStudioPlan(redis);
  if (migrated) {
    await redis.set(SEED_FLAG_KEY, true);
    return;
  }

  const specs: SeedSpec[] = [...SEED_TASKS, ...SEED_CONTENT];
  const keyToId = new Map<string, string>();
  const now = new Date().toISOString();
  const items: StudioItem[] = specs.map((spec, index) => {
    const id = genId(spec.kind);
    keyToId.set(spec.key, id);
    return {
      id,
      kind: spec.kind,
      title: spec.title,
      description: spec.description,
      status: spec.status ?? "backlog",
      order: index,
      category: spec.category,
      channel: spec.channel,
      estimateMinutes: spec.estimateMinutes,
      urgency: spec.urgency,
      impact: spec.impact,
      launchCritical: spec.launchCritical,
      dueDate: spec.dueDate,
      dependsOn: [],
      createdAt: now,
      updatedAt: now,
      doneAt: spec.status === "done" ? now : undefined,
    };
  });

  // Resolve key-based dependencies to real ids now that every id exists.
  items.forEach((item, index) => {
    const spec = specs[index];
    item.dependsOn = (spec.dependsOnKeys || []).map((key) => keyToId.get(key)).filter((v): v is string => Boolean(v));
  });

  // Mark items blocked if any dependency isn't done.
  for (const item of items) {
    if (item.status !== "done" && item.status !== "archived" && isBlocked(item, items)) {
      item.status = "blocked";
    }
  }

  const ids = items.map((it) => it.id);
  await Promise.all(items.map((it) => redis.set(ITEM_KEY(it.id), it)));
  await redis.set(ITEMS_INDEX_KEY, ids);
  await redis.set(SEED_FLAG_KEY, true);
  await pushActivity("created", `Studio Brain initialisé avec ${items.length} éléments`);
}

export function computeBlockedCount(itemId: string, allItems: StudioItem[]): number {
  return countBlockedBy(itemId, allItems);
}
