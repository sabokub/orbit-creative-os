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
  CONVERSATION_DECISIONS_2026_07_25,
  CONVERSATION_UPDATE_2026_07_25,
  VALIDATED_LANDING_PAGE_2026_07_25,
} from "./conversationUpdates20260725";
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

function roomPriceSummary(): string {
  return VALIDATED_LANDING_PAGE_2026_07_25.roomPrices
    .map((room) => `${room.name} ${room.price} €`)
    .join(" · ");
}

function homepageDescription(): string {
  const landing = VALIDATED_LANDING_PAGE_2026_07_25;
  return [
    "COPYWRITING VALIDÉ — reste uniquement l’intégration visuelle et technique.",
    `Structure : ${landing.sections.join(" → ")}.`,
    `Hero : ${landing.hero.join(" / ")}`,
    `Positionnement : ${landing.positioning.join(" ")}`,
    `Pièces mises en avant : ${landing.featuredRooms
      .map((room) => `${room.name} — ${room.price} € — ${room.promise}`)
      .join(" / ")}`,
    "Mention tarifs : « Tarifs de lancement. Dès 249 €. »",
    `Ce que tu reçois : ${landing.receive.join(" ")}`,
    `Transformation : ${landing.transformation.join(" ")}`,
    `Méthode : ${landing.method.map((step) => `${step.title} — ${step.copy}`).join(" / ")}`,
    `Les Cool People : ${landing.coolPeople.intro.join(" ")} Profils : ${landing.coolPeople.profiles
      .map((profile) => `${profile.name} — ${profile.archetype} — ${profile.copy}`)
      .join(" / ")}`,
    `FAQ : ${landing.faq.map((entry) => `${entry.question} ${entry.answer}`).join(" / ")}`,
    `CTA final : ${landing.finalCta.join(" / ")}`,
  ].join("\n");
}

async function replaceOrCreateDecision(
  redis: Redis,
  existingDecisions: Decision[],
  spec: (typeof CONVERSATION_DECISIONS_2026_07_25)[number],
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

export async function applyConversationUpdates20260725(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_07_25)) {
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
  const relatedItemIds = new Map<"homepage" | "nfinite" | "pricing", string>();
  let createdItems = 0;
  let updatedItems = 0;

  const homepage = findByTitle(items, [
    "Finaliser la homepage",
    "Intégrer la homepage validée",
    "Intégrer la landing page validée",
  ]);
  if (homepage) {
    const updated = await updateItem(homepage.id, {
      title: "Intégrer la landing page validée",
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
      title: "Intégrer la landing page validée",
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
  const pricing = findByTitle(items, [
    "Verrouiller la grille tarifaire",
    "Grille tarifaire de lancement verrouillée",
  ]);
  const pricingDescription = [
    "Grille de lancement validée. Prix fixes par pièce, jamais calculés selon la surface du client.",
    "Catégories internes : 249 € / 299 € / 349 €. Exceptions : pièce de vie 379 € ; suite parentale 399 €.",
    roomPriceSummary(),
    "Affichage public : chaque pièce montre directement son prix. La homepage affiche seulement cinq pièces et « Tarifs de lancement. Dès 249 €. »",
  ].join("\n");

  if (pricing) {
    const updated = await updateItem(pricing.id, {
      title: "Grille tarifaire de lancement verrouillée",
      description: pricingDescription,
      status: "done",
      urgency: 3,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("pricing", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Grille tarifaire de lancement verrouillée",
      description: pricingDescription,
      category: "Business",
      estimateMinutes: 0,
      urgency: 3,
      impact: 5,
      launchCritical: true,
      status: "done",
      dependsOn: [],
    });
    relatedItemIds.set("pricing", created.id);
    createdItems += 1;
  }

  items = await listItems();
  const nfiniteTask = findByTitle(items, [
    "Clarifier l’autorisation Nfinite pour relancer 24March Studio",
    "Clarifier l'autorisation Nfinite pour relancer 24March Studio",
    "Suivre la réponse de Nfinite pour 24March Studio",
  ]);
  const nfiniteDescription = [
    "Mail envoyé pour demander confirmation de la réactivation de 24March Studio.",
    "Base solide : autorisation écrite donnée en 2022, activité conservée sans difficulté jusqu’à sa fermeture en 2025.",
    "Attendre la réponse. Accord : lancement en septembre et discussion de la non-concurrence au moment d’annoncer le départ. Refus : décaler l’ouverture, préserver la fin d’année et préparer une sortie en janvier.",
  ].join("\n");

  if (nfiniteTask) {
    const updated = await updateItem(nfiniteTask.id, {
      title: "Suivre la réponse de Nfinite pour 24March Studio",
      description: nfiniteDescription,
      status: "in_progress",
      urgency: 5,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("nfinite", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Suivre la réponse de Nfinite pour 24March Studio",
      description: nfiniteDescription,
      category: "Administratif",
      estimateMinutes: 30,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
      dependsOn: [],
    });
    relatedItemIds.set("nfinite", created.id);
    createdItems += 1;
  }

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;
  for (const spec of CONVERSATION_DECISIONS_2026_07_25) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? relatedItemIds.get(spec.relatedItemKey) : undefined
    );
    if (result === "created") createdDecisions += 1;
    else updatedDecisions += 1;
  }

  await redis.set(CONVERSATION_UPDATE_2026_07_25, true);
  await pushActivity(
    "note",
    `Mise à jour du 25 juillet appliquée : landing page validée, tarifs verrouillés, réponse Nfinite en attente (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
