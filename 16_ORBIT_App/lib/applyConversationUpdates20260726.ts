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
  CONVERSATION_DECISIONS_2026_07_26,
  CONVERSATION_UPDATE_2026_07_26,
  LANDING_PAGE_DIRECTION_2026_07_26,
} from "./conversationUpdates20260726";
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
  spec: (typeof CONVERSATION_DECISIONS_2026_07_26)[number],
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
  const direction = LANDING_PAGE_DIRECTION_2026_07_26;
  return [
    "BRIEF, COPYWRITING ET DIRECTION ARTISTIQUE VALIDÉS — maquette finale complète encore à produire.",
    `Positionnement : ${direction.positioning.join(" ")}`,
    `Direction visuelle : ${direction.visualDirection.join(" ")}`,
    `Typographie : ${direction.typography.join(" ")}`,
    `Hero : ${direction.hero.join(" ")}`,
    `Système de page : ${direction.pageSystem.join(" ")}`,
    `État actuel : ${direction.currentState.join(" ")}`,
    "À faire : reconstruire une maquette finale fidèle à cette DA, valider l’ensemble, intégrer la landing page et brancher les animations.",
  ].join("\n");
}

function artDirectionDescription(): string {
  const direction = LANDING_PAGE_DIRECTION_2026_07_26;
  return [
    "Direction artistique web verrouillée.",
    ...direction.positioning,
    ...direction.visualDirection,
    ...direction.typography,
    "Référence impérative : préserver la présence éditoriale et la composition horizontale des maquettes validées. Refuser tout retour vers une UI SaaS, une esthétique B2B ou un site d’agence beige classique.",
  ].join("\n");
}

function glassDescription(): string {
  return [
    "Carte glass destinée au hero.",
    "Principe validé : la carte chevauche une zone sombre de l’image principale pour rendre la transparence visible.",
    "Ne pas conserver l’image de démonstration derrière la carte dans l’asset final.",
    "Finaliser l’animation, vérifier la lisibilité du texte et préparer une intégration responsive sans perdre l’effet de profondeur.",
  ].join("\n");
}

function visualsDescription(): string {
  const direction = LANDING_PAGE_DIRECTION_2026_07_26;
  return [
    "Objectif global : seize images de pièces, produites par batches de huit.",
    ...direction.visualAssets,
    "État : premier batch généré mais encore en phase de nettoyage et validation ; second batch restant.",
  ].join("\n");
}

export async function applyConversationUpdates20260726(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_07_26)) {
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
  const relatedItemIds = new Map<"homepage" | "artDirection" | "glass" | "visuals", string>();
  let createdItems = 0;
  let updatedItems = 0;

  const homepage = findByTitle(items, [
    "Finaliser la homepage",
    "Intégrer la homepage validée",
    "Intégrer la landing page validée",
    "Construire la landing page finale validée",
  ]);
  if (homepage) {
    const updated = await updateItem(homepage.id, {
      title: "Construire la landing page finale validée",
      description: homepageDescription(),
      status: "in_progress",
      estimateMinutes: 360,
      urgency: 5,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("homepage", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Construire la landing page finale validée",
      description: homepageDescription(),
      category: "Site web",
      estimateMinutes: 360,
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
  ]);
  if (artDirection) {
    const updated = await updateItem(artDirection.id, {
      title: "Direction artistique de la landing page verrouillée",
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
      title: "Direction artistique de la landing page verrouillée",
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
  const glass = findByTitle(items, [
    "Créer la carte glass du hero",
    "Finaliser la carte glass animée du hero",
  ]);
  if (glass) {
    const updated = await updateItem(glass.id, {
      title: "Finaliser la carte glass animée du hero",
      description: glassDescription(),
      status: "in_progress",
      estimateMinutes: 90,
      urgency: 4,
      impact: 4,
      launchCritical: true,
    });
    relatedItemIds.set("glass", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Finaliser la carte glass animée du hero",
      description: glassDescription(),
      category: "Site web",
      estimateMinutes: 90,
      urgency: 4,
      impact: 4,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    });
    relatedItemIds.set("glass", created.id);
    createdItems += 1;
  }

  items = await listItems();
  const visuals = findByTitle(items, [
    "Générer les images des pièces",
    "Créer les 16 images des pièces",
    "Finaliser les visuels éditoriaux des pièces",
  ]);
  if (visuals) {
    const updated = await updateItem(visuals.id, {
      title: "Finaliser les visuels éditoriaux des pièces",
      description: visualsDescription(),
      status: "in_progress",
      estimateMinutes: 300,
      urgency: 4,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("visuals", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Finaliser les visuels éditoriaux des pièces",
      description: visualsDescription(),
      category: "Images",
      estimateMinutes: 300,
      urgency: 4,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    });
    relatedItemIds.set("visuals", created.id);
    createdItems += 1;
  }

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;
  for (const spec of CONVERSATION_DECISIONS_2026_07_26) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? relatedItemIds.get(spec.relatedItemKey) : undefined
    );
    if (result === "created") createdDecisions += 1;
    else updatedDecisions += 1;
  }

  await redis.set(CONVERSATION_UPDATE_2026_07_26, true);
  await pushActivity(
    "note",
    `Mise à jour du 26 juillet appliquée : positionnement B2C et DA web verrouillés, hero horizontal validé, image principale sélectionnée, carte glass et visuels en cours, maquette finale encore à produire (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
