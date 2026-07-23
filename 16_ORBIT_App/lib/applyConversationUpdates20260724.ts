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
  CONVERSATION_DECISIONS_2026_07_24,
  CONVERSATION_UPDATE_2026_07_24,
  VALIDATED_HOMEPAGE_2026_07_24,
} from "./conversationUpdates20260724";
import type { StudioItem } from "./types";

function hasRedisEnv(): boolean {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function findByTitle(items: StudioItem[], titles: string[]): StudioItem | undefined {
  return items.find((item) => titles.includes(item.title));
}

export async function applyConversationUpdates20260724(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_07_24)) {
    return { applied: false, createdItems: 0, updatedItems: 0, createdDecisions: 0, reason: "already_applied" };
  }

  let items = await listItems();
  const relatedItemIds = new Map<"homepage" | "nfinite" | "income" | "pricing", string>();
  let createdItems = 0;
  let updatedItems = 0;

  const homepage = findByTitle(items, ["Finaliser la homepage", "Intégrer la homepage validée"]);
  const homepageDescription = [
    `Structure validée : ${VALIDATED_HOMEPAGE_2026_07_24.sections.join(" → ")}.`,
    `Hero validé : ${VALIDATED_HOMEPAGE_2026_07_24.hero.join(" / ")}`,
    `Transformation : « ${VALIDATED_HOMEPAGE_2026_07_24.transformationTitle} ».`,
    `Méthode : ${VALIDATED_HOMEPAGE_2026_07_24.methodEdit}`,
    `Les Cool People : ${VALIDATED_HOMEPAGE_2026_07_24.coolPeople.join(" ")}`,
  ].join("\n");

  if (homepage) {
    const updated = await updateItem(homepage.id, {
      title: "Intégrer la homepage validée",
      description: homepageDescription,
      status: "in_progress",
      urgency: 5,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("homepage", updated.id);
    updatedItems += 1;
  } else {
    const created = await createItem({
      kind: "task",
      title: "Intégrer la homepage validée",
      description: homepageDescription,
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
  const nfiniteTask = findByTitle(items, [
    "Clarifier l’autorisation Nfinite pour relancer 24March Studio",
    "Clarifier l'autorisation Nfinite pour relancer 24March Studio",
  ]);
  if (nfiniteTask) {
    relatedItemIds.set("nfinite", nfiniteTask.id);
  } else {
    const created = await createItem({
      kind: "task",
      title: "Clarifier l’autorisation Nfinite pour relancer 24March Studio",
      description:
        "Faire confirmer par écrit si l’autorisation existante couvre la nouvelle micro-entreprise 2026. Conserver le plan conditionnel : refus → départ en janvier ; accord → discussion de non-concurrence au moment d’annoncer le départ.",
      category: "Administratif",
      estimateMinutes: 90,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "today",
      dependsOn: [],
    });
    relatedItemIds.set("nfinite", created.id);
    createdItems += 1;
  }

  items = await listItems();
  const incomeTask = findByTitle(items, ["Suivre le seuil de sortie du CDI"]);
  if (incomeTask) {
    relatedItemIds.set("income", incomeTask.id);
  } else {
    const created = await createItem({
      kind: "task",
      title: "Suivre le seuil de sortie du CDI",
      description:
        "Construire un suivi mensuel du revenu réellement disponible du studio. Le départ ne devient envisageable qu’à partir de 2 195 € net avant impôts, avec optimisation fiscale pensée sur le long terme.",
      category: "Pilotage",
      estimateMinutes: 120,
      urgency: 3,
      impact: 5,
      launchCritical: false,
      status: "backlog",
      dependsOn: [],
    });
    relatedItemIds.set("income", created.id);
    createdItems += 1;
  }

  items = await listItems();
  const pricing = findByTitle(items, ["Verrouiller la grille tarifaire"]);
  if (pricing) {
    const updated = await updateItem(pricing.id, {
      description:
        "Valider la grille avant publication. Proposition discutée mais non confirmée : 399 € / 549 € / 699 € / 899 € TTC, avec 549 € comme offre centrale.",
      urgency: 4,
      impact: 5,
      launchCritical: true,
    });
    relatedItemIds.set("pricing", updated.id);
    updatedItems += 1;
  }

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  for (const spec of CONVERSATION_DECISIONS_2026_07_24) {
    if (existingDecisions.some((decision) => decision.question === spec.question)) continue;
    const decision = await createDecision({
      question: spec.question,
      context: spec.context,
      options: spec.options,
      source: "conversation",
      relatedItemId: spec.relatedItemKey ? relatedItemIds.get(spec.relatedItemKey) : undefined,
    });
    if (spec.resolution) await resolveDecision(decision.id, spec.resolution);
    createdDecisions += 1;
  }

  await redis.set(CONVERSATION_UPDATE_2026_07_24, true);
  await pushActivity(
    "note",
    `Conversations du 24 juillet synchronisées : ${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) ajoutée(s).`
  );

  return { applied: true, createdItems, updatedItems, createdDecisions };
}
