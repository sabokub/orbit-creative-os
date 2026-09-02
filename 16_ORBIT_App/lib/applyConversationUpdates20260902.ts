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
  CONVERSATION_DECISIONS_2026_09_02,
  CONVERSATION_UPDATE_2026_09_02,
  STUDIO_STATE_2026_09_02,
  type StudioUpdateItemKey20260902,
} from "./conversationUpdates20260902";
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
  spec: (typeof CONVERSATION_DECISIONS_2026_09_02)[number],
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

function description(title: string, lines: readonly string[]): string {
  return [title, ...lines].join("\n");
}

export async function applyConversationUpdates20260902(): Promise<{
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
  if (await redis.get<boolean>(CONVERSATION_UPDATE_2026_09_02)) {
    return {
      applied: false,
      createdItems: 0,
      updatedItems: 0,
      createdDecisions: 0,
      updatedDecisions: 0,
      reason: "already_applied",
    };
  }

  const itemIds = new Map<StudioUpdateItemKey20260902, string>();
  let createdItems = 0;
  let updatedItems = 0;

  const register = async (
    key: StudioUpdateItemKey20260902,
    aliases: string[],
    spec: TaskSpec
  ) => {
    const result = await upsertTask(aliases, spec);
    itemIds.set(key, result.item.id);
    result.created ? (createdItems += 1) : (updatedItems += 1);
    return result.item;
  };

  await register("brandBrain", ["Verrouiller le Brand Brain"], {
    title: "Brand Brain : positionnement B2C créatif verrouillé",
    description: description("POSITIONNEMENT 24MARCH — ACTIF.", STUDIO_STATE_2026_09_02.positioning),
    category: "Marque",
    estimateMinutes: 0,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "done",
  });

  await register("landingGovernance", ["Landing 24March : production directe"], {
    title: "Landing : production directe séparée du workflow client",
    description: description("LANDING — GOUVERNANCE ACTIVE.", STUDIO_STATE_2026_09_02.landingGovernance),
    category: "Images",
    estimateMinutes: 0,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "done",
  });

  await register(
    "visualBenchmark",
    ["Terminer les 50 tests du baseline V1 sans modifier les règles", "Benchmark visuel V1", "Tester les 50 prompts"],
    {
      title: "Benchmark visuel : STYLE_DIRECTION_36 sur V03 / R023",
      description: description("BENCHMARK VISUEL — ÉTAT COURANT.", STUDIO_STATE_2026_09_02.visualBenchmark),
      category: "Images",
      estimateMinutes: 0,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      status: "in_progress",
    }
  );

  await register("homepage", ["Finaliser la homepage"], {
    title: "Finaliser la homepage au niveau Awwwards visé",
    description: description("SITE — POLISH PRIORITAIRE.", STUDIO_STATE_2026_09_02.website),
    category: "Site web",
    estimateMinutes: 240,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "in_progress",
  });

  await register("domain", ["Connexion du domaine", "Résoudre le domaine officiel"], {
    title: "Domaine officiel : 24march.fr",
    description: "24march.fr est le domaine officiel validé et hébergé chez Infomaniak.",
    category: "Site web",
    estimateMinutes: 0,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "done",
  });

  await register("pricing", ["Verrouiller la grille tarifaire"], {
    title: "Grille tarifaire : prix codés et plafond 399 €",
    description: description("COMMERCE — PRIX ACTIFS.", STUDIO_STATE_2026_09_02.commerce.slice(2, 4)),
    category: "Produit",
    estimateMinutes: 0,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "done",
  });

  await register("payment", ["Brancher le paiement en ligne"], {
    title: "Paiement en ligne : Stripe branché",
    description: "Stripe est intégré au site ; le branchement paiement n’est plus un blocker.",
    category: "Site web",
    estimateMinutes: 0,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "done",
  });

  await register("waitlist", ["Construire la waitlist"], {
    title: "Vérifier la readiness de /waitlist",
    description: "La page /waitlist existe. Vérifier le parcours complet, la capture et l’état prêt-au-lancement avant ouverture publique.",
    category: "Growth",
    estimateMinutes: 60,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "in_progress",
  });

  await register("launch", ["Lancement public 24March Studio"], {
    title: "Relance full digital — septembre 2026",
    description: description("RELAUNCH — ÉTAT COURANT.", STUDIO_STATE_2026_09_02.relaunch),
    category: "Lancement",
    estimateMinutes: 0,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "in_progress",
  });

  const existingDecisions = await listDecisions();
  let createdDecisions = 0;
  let updatedDecisions = 0;

  for (const spec of CONVERSATION_DECISIONS_2026_09_02) {
    const result = await replaceOrCreateDecision(
      redis,
      existingDecisions,
      spec,
      spec.relatedItemKey ? itemIds.get(spec.relatedItemKey) : undefined
    );
    result === "created" ? (createdDecisions += 1) : (updatedDecisions += 1);
  }

  await redis.set(CONVERSATION_UPDATE_2026_09_02, true);
  await pushActivity(
    "note",
    `Mise à jour du 2 septembre appliquée : positionnement B2C créatif, gouvernance landing directe, benchmark V03/T04/R023 jusqu’à STYLE_DIRECTION_36, polish homepage, domaine 24march.fr, pricing, Stripe, waitlist et relance septembre synchronisés (${createdItems} élément(s) créé(s), ${updatedItems} mis à jour, ${createdDecisions} décision(s) créée(s), ${updatedDecisions} actualisée(s)).`
  );

  return {
    applied: true,
    createdItems,
    updatedItems,
    createdDecisions,
    updatedDecisions,
  };
}
