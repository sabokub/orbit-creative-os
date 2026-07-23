import type { ContentChannel, ItemKind, ItemStatus } from "./types";

export const CONVERSATION_UPDATE_2026_07_23 = "orbit-hub:migrations:conversation-update-2026-07-23";

export interface ConversationTaskSpec {
  key: string;
  id: string;
  kind: ItemKind;
  title: string;
  description: string;
  category: string;
  channel?: ContentChannel;
  estimateMinutes: number;
  urgency: number;
  impact: number;
  launchCritical: boolean;
  status: ItemStatus;
  dependsOnKeys?: string[];
}

/**
 * Actionable items extracted from the latest 24March Studio conversations.
 * No due dates are invented here: priority comes from urgency/impact and the
 * real dependency graph, while the user keeps control of scheduling.
 */
export const CONVERSATION_TASKS_2026_07_23: ConversationTaskSpec[] = [
  {
    key: "client-input-contract",
    id: "task-conv-20260723-client-input-contract",
    kind: "task",
    title: "Structurer les entrées du projet client",
    description:
      "Définir le contrat de données : brief + images d’inspiration pour le moodboard et la shopping list ; photos + plan client pour l’implantation et la modélisation.",
    category: "Produit client",
    estimateMinutes: 120,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "backlog",
    dependsOnKeys: ["client-workflow"],
  },
  {
    key: "pro-review-panel",
    id: "task-conv-20260723-pro-review-panel",
    kind: "task",
    title: "Créer la revue pro moodboard + shopping list",
    description:
      "Afficher automatiquement moodboard et shopping list dans l’espace pro, avec correction, validation, historique et provenance des éléments client.",
    category: "Plateforme client",
    estimateMinutes: 240,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "backlog",
    dependsOnKeys: ["client-input-contract"],
  },
  {
    key: "shopping-validation-gate",
    id: "task-conv-20260723-shopping-validation-gate",
    kind: "task",
    title: "Bloquer la modélisation avant validation shopping list",
    description:
      "Ajouter un garde-fou explicite : aucune implantation ou modélisation ne démarre tant que la shopping list n’est pas validée côté pro.",
    category: "Plateforme client",
    estimateMinutes: 120,
    urgency: 5,
    impact: 5,
    launchCritical: true,
    status: "backlog",
    dependsOnKeys: ["pro-review-panel"],
  },
  {
    key: "correction-propagation",
    id: "task-conv-20260723-correction-propagation",
    kind: "task",
    title: "Propager automatiquement les corrections pro",
    description:
      "Définir quelles corrections du moodboard et de la shopping list mettent à jour le concept, l’implantation, les matériaux, la modélisation et les rendus sans créer de versions incohérentes.",
    category: "Automatisation",
    estimateMinutes: 240,
    urgency: 4,
    impact: 5,
    launchCritical: true,
    status: "backlog",
    dependsOnKeys: ["pro-review-panel"],
  },
  {
    key: "concept-image-stage",
    id: "task-conv-20260723-concept-image-stage",
    kind: "task",
    title: "Prototyper l’image concept avant modélisation",
    description:
      "Tester une image IA générée depuis moodboard + shopping list pour verrouiller l’implantation, les matériaux muraux et l’ambiance avant la phase 3D.",
    category: "Création",
    estimateMinutes: 180,
    urgency: 4,
    impact: 5,
    launchCritical: true,
    status: "blocked",
    dependsOnKeys: ["pro-review-panel"],
  },
  {
    key: "modeling-inputs",
    id: "task-conv-20260723-modeling-inputs",
    kind: "task",
    title: "Brancher photos + plan client vers la modélisation",
    description:
      "Normaliser les photos, dimensions et plans clients afin que Claude puisse produire une implantation cohérente et préparer la scène de modélisation.",
    category: "3D & IA",
    estimateMinutes: 240,
    urgency: 4,
    impact: 5,
    launchCritical: true,
    status: "blocked",
    dependsOnKeys: ["client-input-contract", "shopping-validation-gate"],
  },
  {
    key: "camera-selection",
    id: "task-conv-20260723-camera-selection",
    kind: "task",
    title: "Définir la sélection automatique des meilleures caméras",
    description:
      "Créer des règles de placement et de scoring pour choisir quatre vues complémentaires : lecture globale, circulation, point focal et détail matière, sans angles redondants.",
    category: "3D & IA",
    estimateMinutes: 180,
    urgency: 4,
    impact: 4,
    launchCritical: true,
    status: "blocked",
    dependsOnKeys: ["modeling-inputs"],
  },
  {
    key: "four-views-360",
    id: "task-conv-20260723-four-views-360",
    kind: "task",
    title: "Livrer 4 vues + expérience 360°",
    description:
      "Industrialiser quatre rendus statiques par pièce et un export 360° depuis la même modélisation, avec contrôle de cohérence entre toutes les vues.",
    category: "Livrables client",
    estimateMinutes: 240,
    urgency: 4,
    impact: 5,
    launchCritical: true,
    status: "blocked",
    dependsOnKeys: ["camera-selection", "modeling-inputs"],
  },
  {
    key: "domain-story-content",
    id: "content-conv-20260723-domain-story",
    kind: "content",
    title: "Vidéo — On m’a pris le .com",
    description:
      "Raconter l’attente du domaine, son rachat par un revendeur, puis demander l’avis de la communauté sur le .fr et le dépôt de marque.",
    category: "Reels",
    channel: "Reels",
    estimateMinutes: 75,
    urgency: 4,
    impact: 4,
    launchCritical: true,
    status: "backlog",
  },
];

export interface ConversationDecisionSpec {
  id: string;
  question: string;
  context: string;
  options: string[];
  resolution?: string;
  relatedTaskKey?: string;
}

export const CONVERSATION_DECISIONS_2026_07_23: ConversationDecisionSpec[] = [
  {
    id: "decision-conv-20260723-shopping-gate",
    question: "La shopping list doit-elle être validée avant la modélisation ?",
    context: "La validation pro est un garde-fou obligatoire avant toute implantation ou scène 3D.",
    options: ["Oui, validation obligatoire", "Non"],
    resolution: "Oui, validation obligatoire",
    relatedTaskKey: "shopping-validation-gate",
  },
  {
    id: "decision-conv-20260723-output-set",
    question: "Quels rendus doivent être livrés par pièce ?",
    context: "La modélisation permet de produire plusieurs vues sans coût créatif majeur supplémentaire et le 360° apporte une valeur client claire.",
    options: ["4 vues + 360°", "4 vues seulement", "360° seulement"],
    resolution: "4 vues + 360°",
    relatedTaskKey: "four-views-360",
  },
  {
    id: "decision-conv-20260723-client-sources",
    question: "Quelles sources alimentent chaque étape du projet client ?",
    context: "Le moodboard et la shopping list utilisent le brief et les inspirations ; la modélisation utilise aussi les photos et le plan client.",
    options: [
      "Brief + inspirations, puis photos + plan pour la modélisation",
      "Brief uniquement",
      "Traitement manuel au cas par cas",
    ],
    resolution: "Brief + inspirations, puis photos + plan pour la modélisation",
    relatedTaskKey: "client-input-contract",
  },
  {
    id: "decision-conv-20260723-correction-propagation",
    question: "Les corrections pro doivent-elles se propager aux étapes suivantes ?",
    context: "Les corrections du moodboard et de la shopping list doivent modifier automatiquement les éléments dépendants tout en conservant l’historique.",
    options: ["Oui, avec propagation contrôlée", "Non, mise à jour manuelle"],
    resolution: "Oui, avec propagation contrôlée",
    relatedTaskKey: "correction-propagation",
  },
  {
    id: "decision-conv-20260723-plan-engine",
    question: "Quel moteur doit produire le plan aménagé ?",
    context: "Le choix reste ouvert entre précision géométrique SketchUp, génération IA ou workflow hybride.",
    options: ["SketchUp", "Plateforme IA", "Hybride : géométrie SketchUp + rendu IA"],
    relatedTaskKey: "modeling-inputs",
  },
  {
    id: "decision-conv-20260723-concept-stage",
    question: "Faut-il imposer une image concept IA avant la modélisation ?",
    context: "Cette étape pourrait verrouiller implantation et matériaux avant de lancer la 3D, mais son caractère obligatoire reste à trancher.",
    options: ["Toujours", "Seulement si implantation ou matériaux sont ambigus", "Non"],
    relatedTaskKey: "concept-image-stage",
  },
  {
    id: "decision-conv-20260723-domain-strategy",
    question: "Quelle stratégie de domaine adopter après la perte du .com ?",
    context: "24marchstudio.com a été racheté par un revendeur de domaines ; le domaine officiel doit être sécurisé avant le lancement.",
    options: ["Utiliser le .fr", "Choisir un nouveau .com", "Négocier le rachat du .com"],
    relatedTaskKey: "domain-resolution",
  },
  {
    id: "decision-conv-20260723-trademark",
    question: "Faut-il déposer la marque 24March Studio maintenant ?",
    context: "La perte du domaine a révélé le besoin de sécuriser le nom et les actifs de marque.",
    options: ["Déposer maintenant", "Faire une vérification juridique puis déposer", "Attendre"],
    relatedTaskKey: "domain-resolution",
  },
];
