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
  CONVERSATION_DECISIONS_2026_08_06,
  CONVERSATION_UPDATE_2026_08_06,
  STUDIO_DIRECTION_2026_08_06,
  type StudioUpdateItemKey20260806,
} from "./conversationUpdates20260806";
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
  spec: (typeof CONVERSATION_DECISIONS_2026_08_06)[number],
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

function homepageDescription(): string {
  const direction = STUDIO_DIRECTION_2026_08_06;
  return [
    "STRUCTURE VALIDÉE ET REFAITE — finition visuelle encore en cours.",
    ...direction.positioning,
    ...direction.visualIdentityCorrections,
    ...direction.homepage,
    ...direction.pricing,
    "Prochaine étape : intégrer les visuels finaux validés, contrôler le responsive puis effectuer la revue pré-production.",
  ].join("\n");
}

function capsuleDescription(): string {
  const direction = STUDIO_DIRECTION_2026_08_06;
  return [
    "Système visuel verrouillé.",
    ...direction.capsuleSystem,
    "Les cinq cartes Cool People doivent rester homogènes et garder leurs proportions naturelles.",
  ].join("\n");
}

function visualsDescription(): string {
  const direction = STUDIO_DIRECTION_2026_08_06;
  return [
    "Production prioritaire de la landing page.",
    ...direction.visualProduction,
    "Ordre de production :",
    ...direction.landingVisualOrder,
    "État : hero prioritaire, capsules et lifestyle à produire ou remplacer progressivement dans la page.",
  ].join("\n");
}

function workflowDescription(): string {
  const direction = STUDIO_DIRECTION_2026_08_06;
  return [
    "Transformer la production visuelle en méthode répétable pour Sab et les futurs employés.",
    "Séquence obligatoire : brief → références Drive → shopping list → moodboard → prompt maître → test contrôlé → QC → export → archivage.",
    ...direction.visualProduction,
    "Documenter les durées cibles, le nombre maximal d’essais et les critères d’arrêt pour chaque phase.",
  ].join("\n");
}

function deploymentDescription(): string {
  const direction = STUDIO_DIRECTION_2026_08_06;
  return [
    "Infrastructure web actualisée.",
    ...direction.deployment,
    "Reste à publier la homepage complète après validation des visuels et contrôle des parcours Stripe.",
  ].join("\n");
}

export async function applyConversationUpdates20260806(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_08_06)) {
    return {
      applied: false,
      createdItems: 0,
      updatedItems: 0,
      createdDecisions: 0,
      updatedDecisions: 0,
      reason: "already_applied",
    };
  }

  const itemIds = new Map<StudioUpdateItemKey20260806, string>();
  let createdItems = 0;
  let updatedItems = 0;

  const homepage = await upsertTask(
    [
      "Finaliser la homepage",
      "Intégrer la homepage validée",
      "Intégrer la landing page validée",
      "Construire la landing page finale validée",
    ],
    {
      title: "Finaliser la homepage 24March Studio",
      description: homepageDescription(),
      category: "Site web",
      estimateMinutes: 360,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
    }
  );
  itemIds.set("homepage", homepage.item.id);
  homepage.created ? (createdItems += 1) : (updatedItems += 1);

  const capsules = await upsertTask(
    ["Valider les formes de cartes", "Finaliser les cartes Cool People"],
    {
      title: "Capsules et Cool People verrouillés",
      description: capsuleDescription(),
      category: "Brand",
      estimateMinutes: 0,
      urgency: 3,
      impact: 5,
      launchCritical: true,
      status: "done",
    }
  );
  itemIds.set("capsules", capsules.item.id);
  capsules.created ? (createdItems += 1) : (updatedItems += 1);

  const visuals = await upsertTask(
    [
      "Générer les images des pièces",
      "Créer les 16 images des pièces",
      "Finaliser les visuels éditoriaux des pièces",
    ],
    {
      title: "Produire les visuels 2K de la landing page",
      description: visualsDescription(),
      category: "Images",
      estimateMinutes: 720,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
    }
  );
  itemIds.set("visuals", visuals.item.id);
  visuals.created ? (createdItems += 1) : (updatedItems += 1);

  const workflow = await upsertTask(
    ["Créer le workflow de génération visuelle", "Documenter la production d’images"],
    {
      title: "Industrialiser le workflow visuel rentable",
      description: workflowDescription(),
      category: "Automatisation",
      estimateMinutes: 300,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
    }
  );
  itemIds.set("workflow", workflow.item.id);
  workflow.created ? (createdItems += 1) : (updatedItems += 1);

  const deployment = await upsertTask(
    ["Mettre le site en ligne", "Configurer le domaine 24March Studio"],
    {
      title: "Finaliser le déploiement 24marchstudio.fr",
      description: deploymentDescription(),
      category: "Site web",
      estimateMinutes: 120,
      urgency: 4,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
    }
  );
  itemIds.set("deployment", deployment.item.id);
  deployment.created ? (createdItems += 1) : (updatedItems += 1);

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;

  for (const spec of CONVERSATION_DECISIONS_2026_08_06) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? itemIds.get(spec.relatedItemKey) : undefined
    );
    result === "created" ? (createdDecisions += 1) : (updatedDecisions += 1);
  }

  await redis.set(CONVERSATION_UPDATE_2026_08_06, true);
  await pushActivity(
    "note",
    `Mise à jour du 6 août appliquée : homepage restructurée, capsules et Cool People verrouillés, teal retiré des validations, prix synchronisés, waitlist corrigée et workflow visuel rentable lancé (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
