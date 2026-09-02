import "server-only";

import { Redis } from "@upstash/redis";
import { createItem, listItems, pushActivity, updateItem } from "./studioBrain";
import type { ItemStatus, StudioItem } from "./types";

const MARKER = "orbit-hub:migrations:launch-recovery-2026-09-02-v1";

const FOUNDATION_TITLES = [
  "Brand Brain : positionnement B2C créatif verrouillé",
  "Domaine officiel : 24march.fr",
  "Grille tarifaire : prix codés et plafond 399 €",
  "Paiement en ligne : Stripe branché",
  "Client Brief System v1.1 verrouillé",
] as const;

const STALE_TITLES = new Set([
  "Finaliser la homepage 24March Studio",
  "Grille tarifaire de lancement verrouillée",
  "Finaliser le déploiement 24marchstudio.fr",
  "Direction artistique de la landing page verrouillée",
]);

interface SprintSpec {
  title: string;
  aliases?: string[];
  description: string;
  category: string;
  estimateMinutes: number;
  dueDate: string;
  status: ItemStatus;
  order: number;
}

const SPRINT: SprintSpec[] = [
  {
    title: "Produire les visuels landing finaux",
    aliases: ["Produire les 15 visuels landing en direct"],
    description:
      "P0 — 2–3 septembre. Arrêter la R&D infinie : utiliser la meilleure direction disponible, produire uniquement les visuels nécessaires au site, sélectionner, exporter en HD et avancer. Le benchmark STYLE_DIRECTION continue après lancement s’il n’est pas strictement nécessaire à une image finale.",
    category: "Images",
    estimateMinutes: 360,
    dueDate: "2026-09-03",
    status: "today",
    order: 0,
  },
  {
    title: "Finaliser homepage et responsive",
    aliases: ["Finaliser la homepage au niveau Awwwards visé"],
    description:
      "P0 — 4–5 septembre. Corriger le cinquième Cool People, rendre le Kit créatif lisible et interactif, stabiliser la navbar, intégrer les visuels HD, finir le responsive. Pas de nouvelle direction artistique tant que ces défauts restent ouverts.",
    category: "Site web",
    estimateMinutes: 360,
    dueDate: "2026-09-05",
    status: "in_progress",
    order: 1,
  },
  {
    title: "Vérifier waitlist et capture",
    aliases: ["Vérifier la readiness de /waitlist"],
    description:
      "P0 — 6 septembre. Tester le parcours réel /waitlist, capture, confirmation et retour utilisateur. Corriger uniquement les défauts bloquants.",
    category: "Growth",
    estimateMinutes: 60,
    dueDate: "2026-09-06",
    status: "backlog",
    order: 2,
  },
  {
    title: "Finaliser guide client minimum viable",
    aliases: ["Valider le guide client"],
    description:
      "P0 — 6 septembre. Livrer uniquement le guide nécessaire au premier client. Le workflow complet peut rester semi-manuel au lancement.",
    category: "Produit",
    estimateMinutes: 180,
    dueDate: "2026-09-06",
    status: "backlog",
    order: 3,
  },
  {
    title: "Finaliser mentions légales et CGV",
    aliases: ["Rédiger les mentions légales & CGV"],
    description:
      "P0 — 6 septembre. Finaliser les pages légales indispensables à l’ouverture des ventes. Aucun polish secondaire avant ce bloc.",
    category: "Juridique",
    estimateMinutes: 90,
    dueDate: "2026-09-06",
    status: "backlog",
    order: 4,
  },
  {
    title: "Préparer kit lancement minimum viable",
    description:
      "P0 — 7–8 septembre. Préparer seulement trois actifs : un email d’ouverture, un Reel/TikTok d’annonce et un carousel offre. Réutiliser les mêmes visuels et messages. Tout autre contenu passe après lancement.",
    category: "Lancement",
    estimateMinutes: 180,
    dueDate: "2026-09-08",
    status: "backlog",
    order: 5,
  },
  {
    title: "Revue pré-production complète",
    description:
      "P0 — 9 septembre. Smoke test domaine, homepage, mobile, waitlist, Stripe, pages légales et onboarding. Corriger seulement les bugs empêchant compréhension, conversion ou paiement.",
    category: "Lancement",
    estimateMinutes: 120,
    dueDate: "2026-09-09",
    status: "blocked",
    order: 6,
  },
];

function findExisting(items: StudioItem[], spec: SprintSpec): StudioItem | undefined {
  const names = new Set([spec.title, ...(spec.aliases ?? [])]);
  return items.find((item) => names.has(item.title));
}

async function upsertSprintItem(items: StudioItem[], spec: SprintSpec): Promise<StudioItem> {
  const existing = findExisting(items, spec);
  if (existing) {
    return updateItem(existing.id, {
      title: spec.title,
      description: spec.description,
      category: spec.category,
      estimateMinutes: spec.estimateMinutes,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      dueDate: spec.dueDate,
      status: spec.status,
      order: spec.order,
      dependsOn: [],
    });
  }

  return createItem({
    kind: "task",
    title: spec.title,
    description: spec.description,
    category: spec.category,
    estimateMinutes: spec.estimateMinutes,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    dueDate: spec.dueDate,
    status: spec.status,
    order: spec.order,
    dependsOn: [],
  });
}

export async function applyLaunchRecovery20260902() {
  const redis = Redis.fromEnv();
  if (await redis.get<boolean>(MARKER)) {
    return { applied: false, reason: "already_applied" };
  }

  let items = await listItems();

  // Reset launch scope. Orbit launch progress must represent only the recovery MVP.
  for (const item of items) {
    if (item.launchCritical && item.status !== "archived") {
      await updateItem(item.id, { launchCritical: false });
    }
  }

  items = await listItems();

  // Archive stale duplicates and superseded truths.
  for (const item of items) {
    if (STALE_TITLES.has(item.title) && item.status !== "archived") {
      await updateItem(item.id, { status: "archived", launchCritical: false });
    }
  }

  items = await listItems();

  // Completed foundations stay visible in the launch denominator.
  for (const title of FOUNDATION_TITLES) {
    const item = items.find((candidate) => candidate.title === title);
    if (item) {
      await updateItem(item.id, { launchCritical: true, dependsOn: [] });
    }
  }

  items = await listItems();
  const sprintItems: StudioItem[] = [];
  for (const spec of SPRINT) {
    const item = await upsertSprintItem(items, spec);
    sprintItems.push(item);
    items = await listItems();
  }

  const byTitle = new Map(sprintItems.map((item) => [item.title, item.id]));
  const review = sprintItems.find((item) => item.title === "Revue pré-production complète");
  if (review) {
    await updateItem(review.id, {
      dependsOn: [
        "Produire les visuels landing finaux",
        "Finaliser homepage et responsive",
        "Vérifier waitlist et capture",
        "Finaliser guide client minimum viable",
        "Finaliser mentions légales et CGV",
        "Préparer kit lancement minimum viable",
      ]
        .map((title) => byTitle.get(title))
        .filter((id): id is string => Boolean(id)),
    });
  }

  items = await listItems();
  const launch = items.find((item) => item.title === "Relance full digital — septembre 2026");
  if (launch) {
    await updateItem(launch.id, {
      title: "Lancement public — 10 septembre 2026",
      description:
        "Nouvelle deadline interne : jeudi 10 septembre 2026 à 18 h. Scope gelé sur le MVP vendable. Les automatisations avancées, le press kit, la R&D benchmark, le 360°, F2 et les contenus secondaires passent après lancement.",
      dueDate: "2026-09-10",
      status: "blocked",
      launchCritical: false,
      dependsOn: review ? [review.id] : [],
    });
  }

  // Explicitly de-prioritize the main time sinks that are not required to sell and fulfill manually.
  const postLaunchPrefixes = [
    "Benchmark visuel :",
    "Finaliser ORBIT Automation Hub",
    "Connecter les intégrations studio",
    "Créer la revue pro moodboard",
    "Bloquer la modélisation",
    "Propager automatiquement",
    "Prototyper l’image concept",
    "Brancher photos + plan client",
    "Définir la sélection automatique",
    "Livrer 4 vues + expérience 360",
    "Transformer le brief client",
    "Produire les planches exactes",
    "Tester et enregistrer un moteur F2",
    "Rendre Kerros accessible",
    "Préparer le press kit",
    "Rédiger la page À propos",
    "Finaliser la carte glass animée",
  ];

  items = await listItems();
  for (const item of items) {
    if (postLaunchPrefixes.some((prefix) => item.title.startsWith(prefix))) {
      await updateItem(item.id, { launchCritical: false });
    }
    if (item.kind === "content") {
      await updateItem(item.id, { launchCritical: false });
    }
  }

  await redis.set(MARKER, true);
  await pushActivity(
    "note",
    "Recovery sprint activé : deadline déplacée au 10 septembre. Scope lancement réduit au MVP vendable, dépendances non essentielles retirées, R&D/automatisation/contenus secondaires repoussés après lancement."
  );

  return {
    applied: true,
    target: "2026-09-10T18:00:00+02:00",
    sprintItems: sprintItems.map((item) => item.title),
  };
}
