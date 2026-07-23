import "server-only";

import { Redis } from "@upstash/redis";
import {
  createDecision,
  createItem,
  listDecisions,
  listItems,
  pushActivity,
  resolveDecision,
  updateItem,
} from "./studioBrain";
import {
  CONVERSATION_DECISIONS_2026_07_23,
  CONVERSATION_TASKS_2026_07_23,
  CONVERSATION_UPDATE_2026_07_23,
} from "./conversationUpdates";
import { StudioItem } from "./types";

function hasRedisEnv(): boolean {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function findItem(items: StudioItem[], titles: string[]): StudioItem | undefined {
  return items.find((item) => titles.includes(item.title));
}

/**
 * One-time, idempotent import of decisions and tasks extracted from the latest
 * 24March Studio conversations. The payload is fixed in source control: this
 * endpoint never accepts arbitrary user data.
 */
export async function applyLatestConversationUpdates(): Promise<{
  applied: boolean;
  createdItems: number;
  updatedItems: number;
  createdDecisions: number;
  reason?: string;
}> {
  if (!hasRedisEnv()) {
    return { applied: false, createdItems: 0, updatedItems: 0, createdDecisions: 0, reason: "redis_unavailable" };
  }

  const redis = Redis.fromEnv();
  const alreadyApplied = await redis.get<boolean>(CONVERSATION_UPDATE_2026_07_23);
  if (alreadyApplied) {
    return { applied: false, createdItems: 0, updatedItems: 0, createdDecisions: 0, reason: "already_applied" };
  }

  let items = await listItems();
  const keyToId = new Map<string, string>();
  let createdItems = 0;
  let updatedItems = 0;

  const clientWorkflow = findItem(items, [
    "Écrire le parcours d'onboarding client",
    "Formaliser le parcours client automatisé",
  ]);
  if (clientWorkflow) {
    const updated = await updateItem(clientWorkflow.id, {
      title: "Formaliser le parcours client automatisé",
      description:
        "Orchestrer brief + inspirations → moodboard + shopping list → validation pro → concept/implantation → modélisation → 4 vues + 360°, avec corrections traçables.",
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: clientWorkflow.status === "done" ? "in_progress" : clientWorkflow.status,
      dependsOn: [],
    });
    keyToId.set("client-workflow", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Formaliser le parcours client automatisé",
      description:
        "Orchestrer brief + inspirations → moodboard + shopping list → validation pro → concept/implantation → modélisation → 4 vues + 360°, avec corrections traçables.",
      category: "Produit client",
      estimateMinutes: 180,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    });
    keyToId.set("client-workflow", created.id);
    createdItems += 1;
  }

  items = await listItems();
  const domainTask = findItem(items, ["Connexion du domaine", "Résoudre le domaine officiel"]);
  if (domainTask) {
    const updated = await updateItem(domainTask.id, {
      title: "Résoudre le domaine officiel",
      description:
        "24marchstudio.com a été racheté par un revendeur. Choisir et sécuriser le domaine officiel, puis trancher la stratégie de dépôt de marque avant lancement.",
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "today",
      dependsOn: [],
    });
    keyToId.set("domain-resolution", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Résoudre le domaine officiel",
      description:
        "24marchstudio.com a été racheté par un revendeur. Choisir et sécuriser le domaine officiel, puis trancher la stratégie de dépôt de marque avant lancement.",
      category: "Site web",
      estimateMinutes: 90,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "today",
      dependsOn: [],
    });
    keyToId.set("domain-resolution", created.id);
    createdItems += 1;
  }

  items = await listItems();
  for (const spec of CONVERSATION_TASKS_2026_07_23) {
    const existing = items.find((item) => item.id === spec.id || item.title === spec.title);
    if (existing) {
      keyToId.set(spec.key, existing.id);
      continue;
    }

    const dependsOn = (spec.dependsOnKeys || [])
      .map((key) => keyToId.get(key))
      .filter((id): id is string => Boolean(id));
    const created = await createItem({
      kind: spec.kind,
      title: spec.title,
      description: spec.description,
      category: spec.category,
      channel: spec.channel,
      estimateMinutes: spec.estimateMinutes,
      urgency: spec.urgency,
      impact: spec.impact,
      launchCritical: spec.launchCritical,
      status: spec.status,
      dependsOn,
    });
    keyToId.set(spec.key, created.id);
    items.push(created);
    createdItems += 1;
  }

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  for (const spec of CONVERSATION_DECISIONS_2026_07_23) {
    if (existingDecisions.some((decision) => decision.question === spec.question)) continue;
    const decision = await createDecision({
      question: spec.question,
      context: spec.context,
      options: spec.options,
      source: "conversation",
      relatedItemId: spec.relatedTaskKey ? keyToId.get(spec.relatedTaskKey) : undefined,
    });
    if (spec.resolution) await resolveDecision(decision.id, spec.resolution);
    createdDecisions += 1;
  }

  await redis.set(CONVERSATION_UPDATE_2026_07_23, true);
  await pushActivity(
    "note",
    `Dernières conversations synchronisées : ${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) ajoutée(s).`
  );

  return { applied: true, createdItems, updatedItems, createdDecisions };
}
