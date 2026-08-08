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
  CONVERSATION_DECISIONS_2026_08_08,
  CONVERSATION_UPDATE_2026_08_08,
  PROJECT_DIRECTIVE_2026_08_08,
  type StudioUpdateItemKey20260808,
} from "./conversationUpdates20260808";
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
  spec: (typeof CONVERSATION_DECISIONS_2026_08_08)[number],
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
  const directive = PROJECT_DIRECTIVE_2026_08_08;
  return [
    "WORKFLOW CLIENT V1 ACTIF — LANDING EXCLUE.",
    ...directive.authority,
    ...directive.clientWorkflow,
    "Le workflow client conserve ses gates et sa logique de traçabilité uniquement pour les projets clients.",
  ].join("\n");
}

function landingDirectDescription(): string {
  const directive = PROJECT_DIRECTIVE_2026_08_08;
  return [
    "00_PROJECT_DIRECTIVE MASTER / ACTIVE.",
    ...directive.landing,
    ...directive.landingVisualCriteria,
    "Cette décision remplace le gate Hero pilote et toute dépendance landing au workflow client enregistrés le 7 août.",
  ].join("\n");
}

function visualsDescription(): string {
  const directive = PROJECT_DIRECTIVE_2026_08_08;
  return [
    "Série landing en production directe.",
    ...directive.landing,
    ...directive.landingVisualCriteria,
    "Ordre : Hero → polaroïd → six capsules → bandeau Ta pièce → cinq Cool People → lifestyle final.",
    "Aucune dépendance au Hero pilote. Chaque commande produit directement son image.",
  ].join("\n");
}

function clientExperienceDescription(): string {
  return [
    "Reconcevoir le brief client comme expérience visuelle immersive.",
    ...PROJECT_DIRECTIVE_2026_08_08.clientExperience,
    "Le parcours doit rester compréhensible sans culture décoration préalable.",
  ].join("\n");
}

function sourcingVisualDescription(): string {
  return [
    "Fiabiliser la sélection produits des projets clients.",
    ...PROJECT_DIRECTIVE_2026_08_08.sourcingExperience,
    "La validation humaine doit porter sur une sélection visible, pas sur une suite de liens abstraits.",
  ].join("\n");
}

function engineMatrixDescription(): string {
  return [
    "Débloquer le routage F2 sans halluciner les capacités moteur.",
    ...PROJECT_DIRECTIVE_2026_08_08.routing,
  ].join("\n");
}

export async function applyConversationUpdates20260808(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_08_08)) {
    return {
      applied: false,
      createdItems: 0,
      updatedItems: 0,
      createdDecisions: 0,
      updatedDecisions: 0,
      reason: "already_applied",
    };
  }

  const itemIds = new Map<StudioUpdateItemKey20260808, string>();
  let createdItems = 0;
  let updatedItems = 0;

  const workflow = await upsertTask(
    ["Workflow visuel v1 approuvé", "Industrialiser le workflow visuel rentable", "Créer le workflow de génération visuelle"],
    {
      title: "Workflow client v1 — landing exclue",
      description: workflowDescription(),
      category: "Méthode client",
      estimateMinutes: 0,
      urgency: 4,
      impact: 5,
      launchCritical: true,
      status: "done",
      dependsOn: [],
    }
  );
  itemIds.set("workflow", workflow.item.id);
  workflow.created ? (createdItems += 1) : (updatedItems += 1);

  const landingDirect = await upsertTask(
    ["Valider le Hero pilote avec le workflow v1", "Tester le workflow sur le Hero", "Produire le Hero pilote"],
    {
      title: "Landing : production directe activée",
      description: landingDirectDescription(),
      category: "Images",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "done",
      dependsOn: [],
    }
  );
  itemIds.set("landingDirect", landingDirect.item.id);
  landingDirect.created ? (createdItems += 1) : (updatedItems += 1);

  const visuals = await upsertTask(
    ["Produire la série visuelle 2K de la landing", "Produire les visuels 2K de la landing page", "Finaliser les visuels éditoriaux des pièces"],
    {
      title: "Produire les 15 visuels landing en direct",
      description: visualsDescription(),
      category: "Images",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    }
  );
  itemIds.set("visuals", visuals.item.id);
  visuals.created ? (createdItems += 1) : (updatedItems += 1);

  const clientExperience = await upsertTask(
    ["Revoir le parcours client", "Refondre le questionnaire client"],
    {
      title: "Transformer le brief client en parcours immersif",
      description: clientExperienceDescription(),
      category: "Plateforme client",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    }
  );
  itemIds.set("clientExperience", clientExperience.item.id);
  clientExperience.created ? (createdItems += 1) : (updatedItems += 1);

  const sourcingVisual = await upsertTask(
    ["Fiabiliser le sourcing client", "Créer la planche de sélection produits"],
    {
      title: "Afficher une sélection produits visuelle et fraîche",
      description: sourcingVisualDescription(),
      category: "Workflow client",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    }
  );
  itemIds.set("sourcingVisual", sourcingVisual.item.id);
  sourcingVisual.created ? (createdItems += 1) : (updatedItems += 1);

  const engineMatrix = await upsertTask(
    ["Tester puis enregistrer moteur F2", "Compléter Engine Matrix F2"],
    {
      title: "Tester et enregistrer un moteur F2",
      description: engineMatrixDescription(),
      category: "Automatisation",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "today",
      dependsOn: [],
    }
  );
  itemIds.set("engineMatrix", engineMatrix.item.id);
  engineMatrix.created ? (createdItems += 1) : (updatedItems += 1);

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;

  for (const spec of CONVERSATION_DECISIONS_2026_08_08) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? itemIds.get(spec.relatedItemKey) : undefined
    );
    result === "created" ? (createdDecisions += 1) : (updatedDecisions += 1);
  }

  await redis.set(CONVERSATION_UPDATE_2026_08_08, true);
  await pushActivity(
    "note",
    `Mise à jour du 8 août appliquée : directive master active, landing séparée du workflow client et débloquée, gate Hero supprimé, série de 15 visuels repassée en production directe, parcours client immersif et planche de sourcing visuelle ajoutés, test moteur F2 priorisé (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
