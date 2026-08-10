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
  BOARD_PRODUCTION_2026_08_10,
  CONVERSATION_DECISIONS_2026_08_10,
  CONVERSATION_UPDATE_2026_08_10,
  type StudioUpdateItemKey20260810,
} from "./conversationUpdates20260810";
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
  spec: (typeof CONVERSATION_DECISIONS_2026_08_10)[number],
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

function boardPipelineDescription(): string {
  return [
    "PIPELINE DE PLANCHES EXACTES ACTIF.",
    ...BOARD_PRODUCTION_2026_08_10.productionTooling,
    ...BOARD_PRODUCTION_2026_08_10.lockConsequences,
  ].join("\n");
}

function shoppingListDescription(): string {
  return [
    "SHOPPING LIST — PRÉSENTATION VALIDÉE.",
    ...BOARD_PRODUCTION_2026_08_10.shoppingListPresentation,
  ].join("\n");
}

function completenessDescription(): string {
  return [
    "TRAÇABILITÉ ACHATS — RÈGLE ACTIVE.",
    ...BOARD_PRODUCTION_2026_08_10.completeness,
    ...BOARD_PRODUCTION_2026_08_10.lockConsequences,
  ].join("\n");
}

export async function applyConversationUpdates20260810(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_08_10)) {
    return {
      applied: false,
      createdItems: 0,
      updatedItems: 0,
      createdDecisions: 0,
      updatedDecisions: 0,
      reason: "already_applied",
    };
  }

  const itemIds = new Map<StudioUpdateItemKey20260810, string>();
  let createdItems = 0;
  let updatedItems = 0;

  const boardPipeline = await upsertTask(
    ["Verrouiller LOCK sur deux planches visuelles réelles", "Créer la planche de sélection produits"],
    {
      title: "Produire les planches exactes via Apps Script + Slides",
      description: boardPipelineDescription(),
      category: "Workflow client",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    }
  );
  itemIds.set("boardPipeline", boardPipeline.item.id);
  boardPipeline.created ? (createdItems += 1) : (updatedItems += 1);

  const shoppingListUi = await upsertTask(
    ["Maquetter la shopping list client", "Refondre la shopping list"],
    {
      title: "Shopping list : slides horizontales par catégories",
      description: shoppingListDescription(),
      category: "Plateforme client",
      estimateMinutes: 0,
      urgency: 5,
      impact: 4,
      launchCritical: true,
      status: "done",
      dependsOn: [boardPipeline.item.id],
    }
  );
  itemIds.set("shoppingListUi", shoppingListUi.item.id);
  shoppingListUi.created ? (createdItems += 1) : (updatedItems += 1);

  const purchaseCompleteness = await upsertTask(
    ["Afficher 100 % des achats", "Aligner shopping list et résumé financier"],
    {
      title: "Garantir 100 % des achats visibles et traçables",
      description: completenessDescription(),
      category: "Workflow client",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "done",
      dependsOn: [boardPipeline.item.id],
    }
  );
  itemIds.set("purchaseCompleteness", purchaseCompleteness.item.id);
  purchaseCompleteness.created ? (createdItems += 1) : (updatedItems += 1);

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;

  for (const spec of CONVERSATION_DECISIONS_2026_08_10) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? itemIds.get(spec.relatedItemKey) : undefined
    );
    result === "created" ? (createdDecisions += 1) : (updatedDecisions += 1);
  }

  await redis.set(CONVERSATION_UPDATE_2026_08_10, true);
  await pushActivity(
    "note",
    `Mise à jour du 10 août appliquée : Gemini/Gems écarté pour les planches finales exactes, route Google Apps Script + Google Slides verrouillée, shopping list horizontale par catégories, accent lime conservé et 100 % des achats rendus visibles avec packshot, nom, prix et catégorie (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
