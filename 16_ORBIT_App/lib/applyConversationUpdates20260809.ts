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
  CLIENT_WORKFLOW_2026_08_09,
  CONVERSATION_DECISIONS_2026_08_09,
  CONVERSATION_UPDATE_2026_08_09,
  type StudioUpdateItemKey20260809,
} from "./conversationUpdates20260809";
import type { Decision, ItemStatus, StudioItem } from "./types";

function hasRedisEnv(): boolean {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

interface TaskSpec {
  title: string;
  description: string;
  category: string;
  estimateMinutes: number;
  urgency: number;
  impact: number;
  launchCritical: boolean;
  status: ItemStatus;
  dependsOn?: string[];
}

async function upsertTask(
  aliases: string[],
  spec: TaskSpec
): Promise<{ item: StudioItem; created: boolean }> {
  const items = await listItems();
  const acceptedTitles = new Set([spec.title, ...aliases]);
  const existing = items.find((item) => acceptedTitles.has(item.title));

  if (existing) {
    const item = await updateItem(existing.id, {
      title: spec.title,
      description: spec.description,
      category: spec.category,
      estimateMinutes: spec.estimateMinutes,
      urgency: spec.urgency,
      impact: spec.impact,
      launchCritical: spec.launchCritical,
      status: spec.status,
      dependsOn: spec.dependsOn ?? existing.dependsOn,
    });
    return { item, created: false };
  }

  const item = await createItem({
    kind: "task",
    title: spec.title,
    description: spec.description,
    category: spec.category,
    estimateMinutes: spec.estimateMinutes,
    urgency: spec.urgency,
    impact: spec.impact,
    launchCritical: spec.launchCritical,
    status: spec.status,
    dependsOn: spec.dependsOn ?? [],
  });
  return { item, created: true };
}

async function replaceOrCreateDecision(
  redis: Redis,
  existingDecisions: Decision[],
  spec: (typeof CONVERSATION_DECISIONS_2026_08_09)[number],
  relatedItemId?: string
): Promise<"created" | "updated"> {
  const acceptedQuestions = new Set([spec.question, ...(spec.aliases ?? [])]);
  const existing = existingDecisions.find((decision) => acceptedQuestions.has(decision.question));

  if (!existing) {
    const created = await createDecision({
      question: spec.question,
      context: spec.context,
      options: [...spec.options],
      source: "conversation",
      relatedItemId,
    });
    await resolveDecision(created.id, spec.resolution);
    return "created";
  }

  const now = new Date().toISOString();
  const replacement: Decision = {
    ...existing,
    question: spec.question,
    context: spec.context,
    options: [...spec.options],
    source: "conversation",
    relatedItemId,
    status: "resolved",
    resolution: spec.resolution,
    resolvedAt: now,
  };

  await redis.set(`orbit-hub:decision:${existing.id}`, replacement);
  return "updated";
}

function workflowStateDescription(): string {
  const system = CLIENT_WORKFLOW_2026_08_09;
  return [
    "MACHINE D’ÉTAT CLIENT ACTIVE.",
    `Pipeline : ${system.pipeline.join(" → ")}.`,
    ...system.commands,
    ...system.stateTruth,
    ...system.principle,
  ].join("\n");
}

function visualLockDescription(): string {
  const system = CLIENT_WORKFLOW_2026_08_09;
  return [
    "LOCK VISUEL STRICT.",
    ...system.lockGate,
    ...system.boardPixels,
    "Le passage à ROUTE est interdit tant que le lock visuel n’est pas complet.",
  ].join("\n");
}

function assetAccessDescription(): string {
  const system = CLIENT_WORKFLOW_2026_08_09;
  return [
    "ACCÈS AUX ASSETS — ÉTAT COURANT.",
    ...system.assetState,
    ...system.boardPixels,
  ].join("\n");
}

export async function applyConversationUpdates20260809(): Promise<{
  applied: boolean;
  createdItems: number;
  updatedItems: number;
  createdDecisions: number;
  updatedDecisions: number;
  reason?: string;
}> {
  if (!hasRedisEnv()) {
    return {
      applied: false,
      createdItems: 0,
      updatedItems: 0,
      createdDecisions: 0,
      updatedDecisions: 0,
      reason: "redis_unavailable",
    };
  }

  const redis = Redis.fromEnv();
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_08_09)) {
    return {
      applied: false,
      createdItems: 0,
      updatedItems: 0,
      createdDecisions: 0,
      updatedDecisions: 0,
      reason: "already_applied",
    };
  }

  const itemIds = new Map<StudioUpdateItemKey20260809, string>();
  let createdItems = 0;
  let updatedItems = 0;

  const workflowState = await upsertTask(
    ["Workflow client v1 — landing exclue", "Formaliser les états du workflow client"],
    {
      title: "Workflow client : DEFINE → LOCK → ROUTE → PRODUCE → VERIFY",
      description: workflowStateDescription(),
      category: "Workflow client",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "done",
      dependsOn: [],
    }
  );
  itemIds.set("workflowState", workflowState.item.id);
  workflowState.created ? (createdItems += 1) : (updatedItems += 1);

  const visualLock = await upsertTask(
    ["Afficher une sélection produits visuelle et fraîche", "Créer la planche de sélection produits", "Fiabiliser le sourcing client"],
    {
      title: "Verrouiller LOCK sur deux planches visuelles réelles",
      description: visualLockDescription(),
      category: "Workflow client",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "done",
      dependsOn: [workflowState.item.id],
    }
  );
  itemIds.set("visualLock", visualLock.item.id);
  visualLock.created ? (createdItems += 1) : (updatedItems += 1);

  const assetAccess = await upsertTask(
    ["Récupérer les packshots réels", "Corriger l’accès aux assets de planche"],
    {
      title: "Rendre Kerros accessible par Asset_URL",
      description: assetAccessDescription(),
      category: "Sourcing",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "blocked",
      dependsOn: [visualLock.item.id],
    }
  );
  itemIds.set("assetAccess", assetAccess.item.id);
  assetAccess.created ? (createdItems += 1) : (updatedItems += 1);

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;

  for (const spec of CONVERSATION_DECISIONS_2026_08_09) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? itemIds.get(spec.relatedItemKey) : undefined
    );
    result === "created" ? (createdDecisions += 1) : (updatedDecisions += 1);
  }

  await redis.set(CONVERSATION_UPDATE_2026_08_09, true);
  await pushActivity(
    "note",
    `Mise à jour du 9 août appliquée : commandes 24March séparées, machine d’état DEFINE → LOCK → ROUTE → PRODUCE → VERIFY verrouillée, état courant limité aux artefacts explicites, LOCK exige SHOPPING_LIST_BOARD + MOODBOARD_DIRECTION + validation humaine, pixels réels obligatoires et Kerros bloqué jusqu’à Asset_URL (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
