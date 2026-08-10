export const CONVERSATION_UPDATE_2026_08_10 =
  "orbit-hub:migrations:conversation-update-2026-08-10";

export const BOARD_PRODUCTION_2026_08_10 = {
  status: "exact_packshot_board_pipeline_locked",
  productionTooling: [
    "Gemini/Gems ne sont pas retenus comme moteur de production des planches finales avec packshots exacts.",
    "Une référence Canva textuelle ne suffit pas : elle n’expose pas les pixels nécessaires au workflow automatisé.",
    "La route gratuite validée pour assembler des planches exactes est Google Apps Script + Google Slides avec insertion des packshots fournisseurs réels.",
    "Aucune planche ne doit reconstruire, redessiner ou halluciner un produit quand le packshot exact est attendu.",
  ],
  shoppingListPresentation: [
    "La shopping list utilise des slides horizontales.",
    "Chaque produit est présenté comme une carte graphique.",
    "Titres volontairement surdimensionnés ; texte limité aux informations essentielles.",
    "Accent lime validé.",
    "Supprimer la forme décorative en haut à gauche.",
    "Paginer par catégories quand la quantité de produits l’exige.",
  ],
  completeness: [
    "La shopping list doit afficher 100 % des achats proposés.",
    "Le récapitulatif financier doit afficher les mêmes achats, sans élément invisible ni achat fantôme.",
    "Chaque achat affiche au minimum : packshot, nom, prix et catégorie.",
    "Le total financier doit être traçable jusqu’aux produits visibles.",
  ],
  lockConsequences: [
    "Une planche visuelle incomplète ne valide pas LOCK.",
    "Un produit absent de la planche mais présent dans le budget est une incohérence bloquante.",
    "Un produit visible sans ligne financière correspondante est une incohérence bloquante.",
  ],
} as const;

export type StudioUpdateItemKey20260810 =
  | "boardPipeline"
  | "shoppingListUi"
  | "purchaseCompleteness";

export interface ConversationDecisionSeed20260810 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution: string;
  relatedItemKey?: StudioUpdateItemKey20260810;
}

export const CONVERSATION_DECISIONS_2026_08_10: ConversationDecisionSeed20260810[] = [
  {
    question: "Quel outil produit les planches exactes avec packshots ?",
    context: "Les essais Gemini/Gems et les références Canva textuelles ne garantissent pas les pixels produits exacts.",
    options: [
      "Google Apps Script + Google Slides",
      "Gemini/Gems seul",
      "Canva textuel seul",
    ],
    resolution: "Google Apps Script + Google Slides",
    relatedItemKey: "boardPipeline",
  },
  {
    question: "Gemini/Gems est-il retenu pour produire les planches finales exactes ?",
    context: "Le besoin est une composition réelle utilisant les packshots exacts, pas une reconstruction générative.",
    options: ["Non", "Oui"],
    resolution: "Non",
    relatedItemKey: "boardPipeline",
  },
  {
    question: "Comment présenter la shopping list ?",
    context: "La présentation validée privilégie une lecture très visuelle et rapide.",
    options: [
      "Slides horizontales, cartes produits graphiques, gros titres, texte essentiel",
      "Tableau vertical dense",
    ],
    resolution: "Slides horizontales, cartes produits graphiques, gros titres, texte essentiel",
    relatedItemKey: "shoppingListUi",
  },
  {
    question: "Quel accent graphique conserver sur la shopping list ?",
    context: "La maquette validée conserve un accent couleur identifiable.",
    options: ["Lime", "Bleu", "Aucun accent"],
    resolution: "Lime",
    relatedItemKey: "shoppingListUi",
  },
  {
    question: "Que doit montrer chaque achat dans la shopping list ?",
    context: "Aucun achat ne doit être abstrait ou invisible dans le livrable client.",
    options: ["Packshot + nom + prix + catégorie", "Nom + lien seulement"],
    resolution: "Packshot + nom + prix + catégorie",
    relatedItemKey: "purchaseCompleteness",
  },
  {
    question: "Quelle proportion des achats doit apparaître dans la shopping list ?",
    context: "Le livrable et le récapitulatif financier doivent rester parfaitement traçables.",
    options: ["100 %", "Uniquement les achats majeurs"],
    resolution: "100 %",
    relatedItemKey: "purchaseCompleteness",
  },
  {
    question: "Comment traiter beaucoup de produits ?",
    context: "La lisibilité prévaut sur la compression de tous les achats dans une seule page.",
    options: ["Paginer par catégories", "Réduire les cartes jusqu’à tout faire tenir"],
    resolution: "Paginer par catégories",
    relatedItemKey: "shoppingListUi",
  },
  {
    question: "Un achat peut-il exister dans le budget sans apparaître sur la planche ?",
    context: "Les achats fantômes empêchent une validation visuelle fiable.",
    options: ["Non", "Oui"],
    resolution: "Non",
    relatedItemKey: "purchaseCompleteness",
  },
];
