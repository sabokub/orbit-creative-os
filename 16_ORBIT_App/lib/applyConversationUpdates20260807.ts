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
  CONVERSATION_DECISIONS_2026_08_07,
  CONVERSATION_UPDATE_2026_08_07,
  VISUAL_SYSTEM_2026_08_07,
  type StudioUpdateItemKey20260807,
} from "./conversationUpdates20260807";
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
  spec: (typeof CONVERSATION_DECISIONS_2026_08_07)[number],
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

function workflowDescription(): string {
  const system = VISUAL_SYSTEM_2026_08_07;
  return [
    "WORKFLOW VISUEL V1 APPROUVÉ — source de vérité opérationnelle.",
    ...system.authority,
    ...system.core,
    ...system.economics,
    ...system.sourcing,
    ...system.workflow,
    ...system.modularSkills,
    ...system.generationRules,
    ...system.audit,
  ].join("\n");
}

function heroPilotDescription(): string {
  const system = VISUAL_SYSTEM_2026_08_07;
  return [
    "Cas pilote officiel du système visuel.",
    ...system.heroPilot,
    "Appliquer toutes les gates : rentabilité, cadrage, sourcing, moodboard, prompt, génération, audits et archivage.",
  ].join("\n");
}

function visualsDescription(): string {
  const system = VISUAL_SYSTEM_2026_08_07;
  return [
    "Production de série après validation du Hero pilote.",
    ...system.landing,
    ...system.core,
    "Chaque visuel reprend le workflow approuvé sans sauter de gate.",
  ].join("\n");
}

function clientBriefDescription(): string {
  const system = VISUAL_SYSTEM_2026_08_07;
  return [
    "CLIENT BRIEF SYSTEM V1.1 APPROUVÉ.",
    ...system.clientBrief,
    "Le budget réel, les usages et les contraintes pratiques restent séparés du profil esthétique et toujours prioritaires pour la faisabilité.",
  ].join("\n");
}

export async function applyConversationUpdates20260807(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_08_07)) {
    return {
      applied: false,
      createdItems: 0,
      updatedItems: 0,
      createdDecisions: 0,
      updatedDecisions: 0,
      reason: "already_applied",
    };
  }

  const itemIds = new Map<StudioUpdateItemKey20260807, string>();
  let createdItems = 0;
  let updatedItems = 0;

  const workflow = await upsertTask(
    ["Industrialiser le workflow visuel rentable", "Créer le workflow de génération visuelle", "Documenter la production d’images"],
    {
      title: "Workflow visuel v1 approuvé",
      description: workflowDescription(),
      category: "Automatisation",
      estimateMinutes: 0,
      urgency: 4,
      impact: 5,
      launchCritical: true,
      status: "done",
    }
  );
  itemIds.set("workflow", workflow.item.id);
  workflow.created ? (createdItems += 1) : (updatedItems += 1);

  const heroPilot = await upsertTask(
    ["Tester le workflow sur le Hero", "Produire le Hero pilote"],
    {
      title: "Valider le Hero pilote avec le workflow v1",
      description: heroPilotDescription(),
      category: "Images",
      estimateMinutes: 85,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [workflow.item.id],
    }
  );
  itemIds.set("heroPilot", heroPilot.item.id);
  heroPilot.created ? (createdItems += 1) : (updatedItems += 1);

  const visuals = await upsertTask(
    ["Produire les visuels 2K de la landing page", "Finaliser les visuels éditoriaux des pièces", "Créer les 16 images des pièces"],
    {
      title: "Produire la série visuelle 2K de la landing",
      description: visualsDescription(),
      category: "Images",
      estimateMinutes: 1190,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "blocked",
      dependsOn: [heroPilot.item.id],
    }
  );
  itemIds.set("visuals", visuals.item.id);
  visuals.created ? (createdItems += 1) : (updatedItems += 1);

  const clientBrief = await upsertTask(
    ["Structurer le brief client", "Finaliser le Client Brief System"],
    {
      title: "Client Brief System v1.1 verrouillé",
      description: clientBriefDescription(),
      category: "Méthode client",
      estimateMinutes: 0,
      urgency: 3,
      impact: 5,
      launchCritical: true,
      status: "done",
    }
  );
  itemIds.set("clientBrief", clientBrief.item.id);
  clientBrief.created ? (createdItems += 1) : (updatedItems += 1);

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;

  for (const spec of CONVERSATION_DECISIONS_2026_08_07) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? itemIds.get(spec.relatedItemKey) : undefined
    );
    result === "created" ? (createdDecisions += 1) : (updatedDecisions += 1);
  }

  await redis.set(CONVERSATION_UPDATE_2026_08_07, true);
  await pushActivity(
    "note",
    `Mise à jour du 7 août appliquée : workflow visuel v1 approuvé, gate rentabilité et orchestrateur modulaire enregistrés, Hero défini comme pilote, série landing bloquée jusqu’à validation du pilote et Client Brief System v1.1 verrouillé (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
