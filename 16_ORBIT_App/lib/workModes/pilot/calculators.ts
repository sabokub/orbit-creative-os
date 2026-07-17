import { StudioItem } from "../../types";
import { MemoryEntry } from "../../agents/contracts";
import { ProgressEntry } from "../../sync/contracts";
import { WorkMode } from "../contracts";
import { ChartSpec, ModeCalculator, ModeInputs, PilotProgress } from "./types";

/* ------------------------------------------------------------------------ *
 * Shared, explicit weighting — NOT a naive average.
 * ------------------------------------------------------------------------ */

const COLOR = {
  done: "#98b85f",
  inProgress: "#bdd8f8",
  blocked: "#f2b8cf",
  backlog: "#e4dfd2",
  approved: "#98b85f",
  draft: "#f5df75",
  rejected: "#e79a9a",
  accent: "#745a45",
};

const MIN_RELIABLE_ITEMS = 3;

/** Impact×urgency (1–25), boosted for launch-critical work. */
export function taskWeight(item: StudioItem): number {
  const base = Math.max(1, item.impact) * Math.max(1, item.urgency);
  return item.launchCritical ? base * 1.5 : base;
}

/** Latest dev-session build/test signal — a feature coded but not tested is NOT fully done. */
export function testsGreen(progress: ProgressEntry[]): boolean {
  const dev = progress.find((p) => p.source === "claude-code" || p.type === "dev-session");
  if (!dev) return false;
  const blob = `${dev.buildStatus ?? ""} ${dev.testsRun ?? ""}`.toLowerCase();
  return /(ok|pass|passed|green|success|175|✓)/.test(blob) && !/fail|error|red|broken/.test(blob);
}

/** Credit given to a task by its real status; "done" only counts fully when tests are green. */
function taskCredit(item: StudioItem, green: boolean): number {
  switch (item.status) {
    case "done":
      return green ? 1 : 0.85;
    case "in_progress":
      return 0.4;
    case "today":
      return 0.2;
    case "blocked":
    case "backlog":
      return 0;
    default:
      return 0;
  }
}

function weightedTaskProgress(items: StudioItem[], green: boolean, method: string): PilotProgress {
  const active = items.filter((i) => i.status !== "archived");
  const den = active.reduce((s, i) => s + taskWeight(i), 0);
  if (den === 0) return { percentage: 0, reliable: false, method };
  const num = active.reduce((s, i) => s + taskWeight(i) * taskCredit(i, green), 0);
  return { percentage: Math.round((num / den) * 100), reliable: active.length >= MIN_RELIABLE_ITEMS, method };
}

function statusSegments(items: StudioItem[], id: string, title: string): ChartSpec {
  const count = (s: StudioItem["status"]) => items.filter((i) => i.status === s).length;
  return {
    id,
    title,
    kind: "segments",
    insufficient: items.length === 0,
    data: [
      { label: "Terminé", value: count("done"), color: COLOR.done },
      { label: "En cours", value: count("in_progress") + count("today"), color: COLOR.inProgress },
      { label: "Bloqué", value: count("blocked"), color: COLOR.blocked },
      { label: "À faire", value: count("backlog"), color: COLOR.backlog },
    ],
  };
}

/** Approval-weighted progress over agent deliverables (approved > draft; rejected excluded). */
function deliverableProgress(memory: MemoryEntry[], roles: string[], method: string): PilotProgress {
  const items = memory.filter((m) => m.type === "deliverable" && (roles.length === 0 || (m.agentRole && roles.includes(m.agentRole))) && m.status !== "superseded" && m.status !== "rejected");
  if (items.length === 0) return { percentage: 0, reliable: false, method };
  const credit = (m: MemoryEntry) => (m.status === "approved" ? 1 : m.status === "reviewed" ? 0.6 : 0.4);
  const pct = Math.round((items.reduce((s, m) => s + credit(m), 0) / items.length) * 100);
  return { percentage: pct, reliable: true, method };
}

function criticScore(memory: MemoryEntry[]): number | null {
  const critic = memory.find((m) => m.agentRole === "orbit-critic" && m.status !== "superseded");
  const score = critic?.data?.overallScore;
  return typeof score === "number" ? score : null;
}

/* ------------------------------------------------------------------------ *
 * Per-mode calculators
 * ------------------------------------------------------------------------ */

const build: ModeCalculator = {
  progress(i) {
    const tasks = i.studioItems.filter((it) => it.kind === "task");
    return weightedTaskProgress(tasks, testsGreen(i.progress), "Tâches pondérées (impact×urgence, launch-critical ×1.5), crédit réduit si non testé.");
  },
  charts(i) {
    const tasks = i.studioItems.filter((it) => it.kind === "task");
    const green = testsGreen(i.progress);
    const dev = i.progress.find((p) => p.source === "claude-code" || p.type === "dev-session");
    const systemVal = (blob: string | undefined) => (blob && /(ok|pass|green|success)/i.test(blob) ? 100 : blob ? 40 : 0);
    return [
      statusSegments(tasks, "build-status", "Terminé / en cours / bloqué"),
      {
        id: "build-systems",
        title: "Systèmes critiques",
        kind: "bars",
        insufficient: !dev,
        note: dev ? undefined : "Aucun rapport Claude Code encore reçu.",
        data: [
          { label: "Tests", value: green ? 100 : systemVal(dev?.testsRun), color: green ? COLOR.done : COLOR.draft },
          { label: "Build", value: systemVal(dev?.buildStatus), color: COLOR.inProgress },
        ],
      },
    ];
  },
  emptyState(i) {
    if (i.studioItems.some((it) => it.kind === "task")) return null;
    return { message: "Aucune tâche technique.", actionLabel: "Créer une tâche", actionHref: "/studio" };
  },
};

const creation: ModeCalculator = {
  progress(i) {
    return deliverableProgress(i.memory, ["creative-director", "prompt-intelligence"], "Livrables créatifs pondérés par validation (approuvé > à revoir > brouillon).");
  },
  charts(i) {
    const creative = i.memory.filter((m) => m.type === "deliverable" && ["creative-director", "prompt-intelligence"].includes(m.agentRole ?? ""));
    const seg = (s: string) => creative.filter((m) => m.status === s).length;
    const score = criticScore(i.memory);
    return [
      {
        id: "creation-approval",
        title: "Approuvé / à revoir / rejeté",
        kind: "segments",
        insufficient: creative.length === 0,
        data: [
          { label: "Approuvé", value: seg("approved"), color: COLOR.approved },
          { label: "À revoir", value: seg("reviewed") + seg("draft"), color: COLOR.draft },
          { label: "Rejeté", value: creative.filter((m) => m.status === "rejected").length, color: COLOR.rejected },
        ],
      },
      {
        id: "creation-critic",
        title: "Score Orbit Critic",
        kind: "meter",
        insufficient: score === null,
        note: score === null ? "Lance Orbit Critic pour obtenir un score." : undefined,
        data: [{ label: "Score", value: score ?? 0, color: COLOR.accent }],
      },
    ];
  },
  emptyState(i) {
    if (!i.hasProjectContext) return { message: "Aucun projet créatif actif.", actionLabel: "Ouvrir un projet", actionHref: "/projects" };
    if (i.memory.some((m) => m.agentRole === "creative-director")) return null;
    return { message: "Aucune direction artistique générée.", actionLabel: "Lancer le Creative Director", actionHref: "/projects" };
  },
};

const content: ModeCalculator = {
  progress(i) {
    const items = i.studioItems.filter((it) => it.kind === "content");
    return weightedTaskProgress(items, true, "Pipeline éditorial pondéré par impact×urgence et statut réel.");
  },
  charts(i) {
    const items = i.studioItems.filter((it) => it.kind === "content");
    const byChannel = new Map<string, number>();
    for (const it of items) byChannel.set(it.category, (byChannel.get(it.category) ?? 0) + 1);
    return [
      statusSegments(items, "content-pipeline", "Pipeline éditorial"),
      {
        id: "content-platforms",
        title: "Répartition par plateforme",
        kind: "bars",
        insufficient: byChannel.size === 0,
        data: [...byChannel.entries()].slice(0, 6).map(([label, value]) => ({ label, value, color: COLOR.inProgress })),
      },
    ];
  },
  emptyState(i) {
    if (i.studioItems.some((it) => it.kind === "content")) return null;
    return { message: "Aucun contenu prévu.", actionLabel: "Créer un contenu", actionHref: "/studio/content" };
  },
};

const client: ModeCalculator = {
  progress(i) {
    return deliverableProgress(i.memory, [], "Livrables client pondérés par statut de validation.");
  },
  charts(i) {
    const deliverables = i.memory.filter((m) => m.type === "deliverable" && m.status !== "superseded");
    const seg = (s: string) => deliverables.filter((m) => m.status === s).length;
    const validations = i.memory.filter((m) => m.type === "validation" || (m.type === "deliverable" && m.status === "reviewed"));
    return [
      {
        id: "client-deliverables",
        title: "Livrables par statut",
        kind: "segments",
        insufficient: deliverables.length === 0,
        data: [
          { label: "Approuvé", value: seg("approved"), color: COLOR.approved },
          { label: "En revue", value: seg("reviewed"), color: COLOR.draft },
          { label: "Brouillon", value: seg("draft"), color: COLOR.backlog },
          { label: "Rejeté", value: deliverables.filter((m) => m.status === "rejected").length, color: COLOR.rejected },
        ],
      },
      {
        id: "client-validations",
        title: "Validations en attente",
        kind: "meter",
        insufficient: !i.hasProjectContext,
        data: [{ label: "En attente", value: validations.length, color: COLOR.accent }],
      },
    ];
  },
  emptyState(i) {
    if (!i.hasProjectContext) return { message: "Aucun projet client actif.", actionLabel: "Créer un projet client", actionHref: "/projects/new" };
    return null;
  },
};

const steering: ModeCalculator = {
  progress(i) {
    const launch = i.studioItems.filter((it) => it.launchCritical);
    if (launch.length === 0) return { percentage: 0, reliable: false, method: "Progression de lancement (tâches launch-critical)." };
    return weightedTaskProgress(launch, testsGreen(i.progress), "Progression de lancement : tâches launch-critical pondérées.");
  },
  charts(i) {
    const launch = i.studioItems.filter((it) => it.launchCritical);
    const risks = i.progress.flatMap((p) => p.blockers).length + i.memory.filter((m) => m.type === "feedback" && m.agentRole === "orbit-critic").length;
    const loadByCategory = new Map<string, number>();
    for (const it of i.studioItems.filter((x) => x.status !== "done" && x.status !== "archived")) {
      loadByCategory.set(it.category, (loadByCategory.get(it.category) ?? 0) + it.estimateMinutes);
    }
    return [
      statusSegments(launch, "steering-launch", "Progression du lancement"),
      {
        id: "steering-risks",
        title: "Risques ouverts",
        kind: "meter",
        insufficient: i.progress.length === 0 && i.memory.length === 0,
        data: [{ label: "Risques", value: risks, color: COLOR.rejected }],
      },
      {
        id: "steering-load",
        title: "Charge par domaine (min)",
        kind: "bars",
        insufficient: loadByCategory.size === 0,
        data: [...loadByCategory.entries()].slice(0, 6).map(([label, value]) => ({ label, value, color: COLOR.inProgress })),
      },
      {
        id: "steering-finance",
        title: "Revenus vs dépenses",
        kind: "bars",
        insufficient: true, // no financial data source wired — never invented
        note: "Données insuffisantes : aucune donnée financière renseignée.",
        data: [],
      },
    ];
  },
  emptyState(i) {
    if (i.studioItems.length > 0) return null;
    return { message: "Aucune donnée de pilotage.", actionLabel: "Ouvrir le Studio", actionHref: "/studio" };
  },
};

const CALCULATORS: Record<WorkMode, ModeCalculator> = { build, creation, content, client, steering };

export function getModeCalculator(mode: WorkMode): ModeCalculator {
  return CALCULATORS[mode];
}
