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
  CLIENT_DIRECTION_SYSTEM_2026_08_05,
  CONVERSATION_DECISIONS_2026_08_05,
  CONVERSATION_UPDATE_2026_08_05,
  WEBSITE_DIRECTION_2026_08_05,
} from "./conversationUpdates20260805";
import type { Decision, StudioItem } from "./types";

function hasRedisEnv(): boolean {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function findByTitle(items: StudioItem[], titles: string[]): StudioItem | undefined {
  return items.find((item) => titles.includes(item.title));
}

async function replaceOrCreateDecision(
  redis: Redis,
  existingDecisions: Decision[],
  spec: (typeof CONVERSATION_DECISIONS_2026_08_05)[number],
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
    if (spec.resolution) await resolveDecision(created.id, spec.resolution);
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
    status: spec.resolution ? "resolved" : "pending",
    resolution: spec.resolution,
    resolvedAt: spec.resolution ? now : undefined,
  };

  await redis.set(`orbit-hub:decision:${existing.id}`, replacement);
  return "updated";
}

function homepageDescription(): string {
  const direction = WEBSITE_DIRECTION_2026_08_05;
  return [
    "LANDING PAGE IMPLÉMENTÉE — remplacement et validation finale des visuels encore en cours.",
    ...direction.currentImplementation,
    ...direction.capsules,
    "Prix actuels centralisés : 229 / 229 / 229 / 259 / 229 / 289 € dans l’ordre des six capsules.",
    "À faire : intégrer chaque visuel 2K validé, vérifier le responsive, relancer TypeScript et le build, puis contrôler le paiement sans modifier Stripe.",
  ].join("\n");
}

function artDirectionDescription(): string {
  const direction = WEBSITE_DIRECTION_2026_08_05;
  return [
    "Direction artistique web mise à jour et verrouillée.",
    ...direction.positioning,
    ...direction.capsules,
    ...direction.photography,
    "Règle majeure : ne pas transformer le flash direct grand-angle en recette unique. La nuit peut être plus brute et flashée; le jour doit rester crédible, lumineux et adapté au profil.",
  ].join("\n");
}

function visualsDescription(): string {
  const direction = WEBSITE_DIRECTION_2026_08_05;
  return [
    "Produire et intégrer les visuels finaux de la landing page, un par un, en 2K HD.",
    "Ordre de production :",
    ...direction.visualSequence.map((item, index) => `${index + 1}. ${item}`),
    ...direction.photography,
    "État : génération et remplacement en cours. Chaque image doit ressembler à une vraie photographie et rester cohérente avec sa scène de jour ou de nuit.",
  ].join("\n");
}

function questionnaireDescription(): string {
  const system = CLIENT_DIRECTION_SYSTEM_2026_08_05;
  return [
    "Mettre à jour le brief client pour produire des indicateurs directement exploitables par la direction artistique.",
    ...system.principles,
    "À faire : définir les facteurs, leur échelle, les règles de combinaison et la sortie synthétique utilisée par Studio Brain.",
  ].join("\n");
}

export async function applyConversationUpdates20260805(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_08_05)) {
    return {
      applied: false,
      createdItems: 0,
      updatedItems: 0,
      createdDecisions: 0,
      updatedDecisions: 0,
      reason: "already_applied",
    };
  }

  let items = await listItems();
  const relatedItemIds = new Map<
    "homepage" | "artDirection" | "visuals" | "questionnaire",
    string
  >();
  let createdItems = 0;
  let updatedItems = 0;

  const homepage = findByTitle(items, [
    "Finaliser la homepage",
    "Intégrer la homepage validée",
    "Intégrer la landing page validée",
    "Construire la landing page finale validée",
    "Finaliser la landing page avec les visuels 2K",
  ]);
  if (homepage) {
    const updated = await updateItem(homepage.id, {
      title: "Finaliser la landing page avec les visuels 2K",
      description: homepageDescription(),
      status: "in_progress",
      estimateMinutes: 240,
      urgency: 5,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("homepage", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Finaliser la landing page avec les visuels 2K",
      description: homepageDescription(),
      category: "Site web",
      estimateMinutes: 240,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    });
    relatedItemIds.set("homepage", created.id);
    createdItems += 1;
  }

  items = await listItems();
  const artDirection = findByTitle(items, [
    "Valider la direction artistique du site",
    "Valider la direction artistique de la landing page",
    "Direction artistique de la landing page verrouillée",
    "Direction photo jour/nuit et capsules verrouillée",
  ]);
  if (artDirection) {
    const updated = await updateItem(artDirection.id, {
      title: "Direction photo jour/nuit et capsules verrouillée",
      description: artDirectionDescription(),
      status: "done",
      estimateMinutes: 0,
      urgency: 3,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("artDirection", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Direction photo jour/nuit et capsules verrouillée",
      description: artDirectionDescription(),
      category: "Brand",
      estimateMinutes: 0,
      urgency: 3,
      impact: 5,
      launchCritical: true,
      status: "done",
      dependsOn: [],
    });
    relatedItemIds.set("artDirection", created.id);
    createdItems += 1;
  }

  items = await listItems();
  const visuals = findByTitle(items, [
    "Générer les images des pièces",
    "Créer les 16 images des pièces",
    "Finaliser les visuels éditoriaux des pièces",
    "Produire les 15 visuels 2K de la landing page",
  ]);
  if (visuals) {
    const updated = await updateItem(visuals.id, {
      title: "Produire les 15 visuels 2K de la landing page",
      description: visualsDescription(),
      status: "in_progress",
      estimateMinutes: 360,
      urgency: 5,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("visuals", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Produire les 15 visuels 2K de la landing page",
      description: visualsDescription(),
      category: "Images",
      estimateMinutes: 360,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    });
    relatedItemIds.set("visuals", created.id);
    createdItems += 1;
  }

  items = await listItems();
  const questionnaire = findByTitle(items, [
    "Finaliser le questionnaire client",
    "Créer les indicateurs du brief client",
    "Mettre à jour le questionnaire client par facteurs",
  ]);
  if (questionnaire) {
    const updated = await updateItem(questionnaire.id, {
      title: "Mettre à jour le questionnaire client par facteurs",
      description: questionnaireDescription(),
      status: "in_progress",
      estimateMinutes: 180,
      urgency: 4,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("questionnaire", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Mettre à jour le questionnaire client par facteurs",
      description: questionnaireDescription(),
      category: "Client",
      estimateMinutes: 180,
      urgency: 4,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    });
    relatedItemIds.set("questionnaire", created.id);
    createdItems += 1;
  }

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;
  for (const spec of CONVERSATION_DECISIONS_2026_08_05) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? relatedItemIds.get(spec.relatedItemKey) : undefined
    );
    if (result === "created") createdDecisions += 1;
    else updatedDecisions += 1;
  }

  await redis.set(CONVERSATION_UPDATE_2026_08_05, true);
  await pushActivity(
    "note",
    `Mise à jour du 5 août appliquée : landing page implémentée, capsules validées, flash direct réservé principalement aux scènes de nuit, checklist de 15 visuels 2K créée et questionnaire client orienté facteurs ajouté (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
