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
  CONVERSATION_DECISIONS_2026_08_12,
  CONVERSATION_UPDATE_2026_08_12,
  VISUAL_QA_2026_08_12,
  type StudioUpdateItemKey20260812,
} from "./conversationUpdates20260812";
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
  spec: (typeof CONVERSATION_DECISIONS_2026_08_12)[number],
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

  const replacement: Decision = {
    ...existing,
    question: spec.question,
    context: spec.context,
    options: [...spec.options],
    source: "conversation",
    relatedItemId,
    status: "resolved",
    resolution: spec.resolution,
    resolvedAt: new Date().toISOString(),
  };

  await redis.set(`orbit-hub:decision:${existing.id}`, replacement);
  return "updated";
}

function visualQaDescription(): string {
  return [
    "VISUAL QA V1 — RESPONSABILITÉS VERROUILLÉES.",
    ...VISUAL_QA_2026_08_12.ownership,
    ...VISUAL_QA_2026_08_12.glossary,
  ].join("\n");
}

function benchmarkDescription(): string {
  return [
    "BENCHMARK VISUEL V1 — BASELINE ACTIF.",
    ...VISUAL_QA_2026_08_12.firstPass,
    ...VISUAL_QA_2026_08_12.benchmarkProtocol,
  ].join("\n");
}

function contentToneDescription(): string {
  return [
    "CONTENU SOCIAL — RÈGLES DE NARRATION.",
    ...VISUAL_QA_2026_08_12.socialContent,
  ].join("\n");
}

export async function applyConversationUpdates20260812(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_08_12)) {
    return {
      applied: false,
      createdItems: 0,
      updatedItems: 0,
      createdDecisions: 0,
      updatedDecisions: 0,
      reason: "already_applied",
    };
  }

  const itemIds = new Map<StudioUpdateItemKey20260812, string>();
  let createdItems = 0;
  let updatedItems = 0;

  const visualQa = await upsertTask(
    ["Mettre en place le Visual QA", "Créer 11_VISUAL_QA_SYSTEM"],
    {
      title: "Visual QA : règles séparées des résultats",
      description: visualQaDescription(),
      category: "Images",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "done",
      dependsOn: [],
    }
  );
  itemIds.set("visualQa", visualQa.item.id);
  visualQa.created ? (createdItems += 1) : (updatedItems += 1);

  const benchmark = await upsertTask(
    ["Tester les 50 prompts", "Benchmark visuel V1", "Analyser le first-pass"],
    {
      title: "Terminer les 50 tests du baseline V1 sans modifier les règles",
      description: benchmarkDescription(),
      category: "Images",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [visualQa.item.id],
    }
  );
  itemIds.set("benchmark", benchmark.item.id);
  benchmark.created ? (createdItems += 1) : (updatedItems += 1);

  const contentTone = await upsertTask(
    ["Ajuster le ton social 24March", "Revoir le script de série"],
    {
      title: "Contenu social : vendre l’aventure sans posture anti-Pinterest",
      description: contentToneDescription(),
      category: "Contenu",
      estimateMinutes: 0,
      urgency: 4,
      impact: 4,
      launchCritical: false,
      status: "in_progress",
      dependsOn: [],
    }
  );
  itemIds.set("contentTone", contentTone.item.id);
  contentTone.created ? (createdItems += 1) : (updatedItems += 1);

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;

  for (const spec of CONVERSATION_DECISIONS_2026_08_12) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? itemIds.get(spec.relatedItemKey) : undefined
    );
    result === "created" ? (createdDecisions += 1) : (updatedDecisions += 1);
  }

  await redis.set(CONVERSATION_UPDATE_2026_08_12, true);
  await pushActivity(
    "note",
    `Mise à jour du 12 août appliquée : Visual QA séparé des résultats, first-pass défini comme génération initiale sans correction, PASS réservé aux images conformes au brief + DA et publiables telles quelles, baseline V1 de 50 tests à terminer sans modifier les règles, puis rerun identique après correction ; règles de narration sociale anti-exclusion et Pinterest en mieux enregistrées (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
