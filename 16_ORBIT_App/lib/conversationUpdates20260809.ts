export const CONVERSATION_UPDATE_2026_08_09 =
  "orbit-hub:migrations:conversation-update-2026-08-09";

export const CLIENT_WORKFLOW_2026_08_09 = {
  status: "client_state_machine_and_visual_lock_rules_active",
  commands: [
    "Landing 24March — [numéro]",
    "Workflow 24March — [projet client]",
    "Sourcing 24March — [projet / pièce / visuel]",
  ],
  pipeline: ["DEFINE", "LOCK", "ROUTE", "PRODUCE", "VERIFY"],
  stateTruth: [
    "L’état d’un projet client vient uniquement des artefacts explicites du projet courant.",
    "Tests, failures, KPI, scénarios de régression et historiques ne prouvent jamais l’état courant.",
    "Un Locked_At vide, un lock annulé ou une planche invalide maintiennent le projet à LOCK.",
  ],
  lockGate: [
    "LOCKED exige simultanément un SHOPPING_LIST_BOARD valide, un MOODBOARD_DIRECTION valide et une validation humaine explicite.",
    "Aucune validation textuelle implicite ne remplace les deux planches visuelles.",
    "Sans ces preuves, ne jamais avancer vers ROUTE.",
  ],
  boardPixels: [
    "Une planche est un asset visuel réel contenant des pixels accessibles.",
    "Markdown, tableau, texte ou description ne sont jamais une planche.",
    "Dans Gems, une référence Canva textuelle ne donne pas accès aux pixels.",
    "Pixels acceptés : image attachée, fichier image accessible ou URL directe réellement récupérable.",
    "Sans pixels accessibles : verdict LOCK — ASSET_ACCESS_MISSING.",
  ],
  assetState: [
    "Boogie, Jorari et Knud disposent d’URLs image directes exploitables dans l’état courant.",
    "Kerros ne dispose pas encore d’Asset_URL exploitable.",
    "Kerros ne peut donc pas être considéré comme visuellement vérifié tant que son asset n’est pas accessible.",
  ],
  principle: [
    "Ne jamais confondre état calculé et preuve visuelle.",
    "Ne jamais halluciner une planche à partir de texte.",
    "Ne jamais router un projet dont le lock visuel est incomplet.",
  ],
} as const;

export type StudioUpdateItemKey20260809 =
  | "workflowState"
  | "visualLock"
  | "assetAccess";

export interface ConversationDecisionSeed20260809 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution: string;
  relatedItemKey?: StudioUpdateItemKey20260809;
}

export const CONVERSATION_DECISIONS_2026_08_09: ConversationDecisionSeed20260809[] = [
  {
    question: "Quelle machine d’état pilote désormais les projets clients ?",
    context: "Le workflow client est désormais verrouillé autour de cinq états explicites.",
    options: ["DEFINE → LOCK → ROUTE → PRODUCE → VERIFY", "Cadrage → sourcing → rendu libre"],
    resolution: "DEFINE → LOCK → ROUTE → PRODUCE → VERIFY",
    relatedItemKey: "workflowState",
  },
  {
    question: "Quelle commande lance un projet client ?",
    context: "Les commandes sont désormais séparées par contexte.",
    options: ["Workflow 24March — [projet client]", "Landing 24March — [numéro]"],
    resolution: "Workflow 24March — [projet client]",
    relatedItemKey: "workflowState",
  },
  {
    question: "Quelle commande lance un sourcing ciblé ?",
    context: "Le sourcing dispose désormais de sa propre commande opérationnelle.",
    options: ["Sourcing 24March — [projet / pièce / visuel]", "Workflow 24March — étape suivante"],
    resolution: "Sourcing 24March — [projet / pièce / visuel]",
    relatedItemKey: "workflowState",
  },
  {
    question: "Qu’est-ce qui prouve l’état courant d’un projet client ?",
    context: "Les métriques et scénarios de test ne doivent jamais être confondus avec les artefacts du projet courant.",
    options: ["Les artefacts explicites du projet courant", "Les KPI, tests et failures récents"],
    resolution: "Les artefacts explicites du projet courant",
    relatedItemKey: "workflowState",
  },
  {
    question: "Quelles preuves rendent un projet LOCKED ?",
    aliases: ["Que faut-il valider avant ROUTE ?"],
    context: "Le lock devient une gate visuelle stricte.",
    options: [
      "SHOPPING_LIST_BOARD + MOODBOARD_DIRECTION + validation humaine explicite",
      "Une liste de liens et un statut textuel",
    ],
    resolution: "SHOPPING_LIST_BOARD + MOODBOARD_DIRECTION + validation humaine explicite",
    relatedItemKey: "visualLock",
  },
  {
    question: "Un tableau Markdown peut-il servir de planche ?",
    context: "Le système doit distinguer contenu textuel et asset visuel réel.",
    options: ["Non — pixels accessibles obligatoires", "Oui — si les produits sont listés"],
    resolution: "Non — pixels accessibles obligatoires",
    relatedItemKey: "visualLock",
  },
  {
    question: "Que faire sans pixels accessibles pour une planche ?",
    context: "Une référence textuelle Canva ou une URL non récupérable ne suffit pas.",
    options: ["LOCK — ASSET_ACCESS_MISSING", "Continuer avec une planche reconstruite"],
    resolution: "LOCK — ASSET_ACCESS_MISSING",
    relatedItemKey: "assetAccess",
  },
  {
    question: "Une référence Canva textuelle dans Gems donne-t-elle accès aux pixels ?",
    context: "La présence d’un nom ou lien textuel ne garantit pas l’accès à l’image elle-même.",
    options: ["Non", "Oui"],
    resolution: "Non",
    relatedItemKey: "assetAccess",
  },
  {
    question: "Quel produit reste bloqué par absence d’Asset_URL ?",
    context: "L’état de test courant distingue les assets réellement accessibles.",
    options: ["Kerros", "Boogie", "Jorari", "Knud"],
    resolution: "Kerros",
    relatedItemKey: "assetAccess",
  },
];
