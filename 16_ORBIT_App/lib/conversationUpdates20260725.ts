import type { Decision } from "./types";

export const CONVERSATION_UPDATE_2026_07_25 =
  "orbit-hub:migrations:conversation-update-2026-07-25";

export const VALIDATED_LANDING_PAGE_2026_07_25 = {
  status: "validated",
  sections: [
    "Hero immersif",
    "Positionnement",
    "Choix de la pièce",
    "Ce que tu reçois",
    "Quand tout s’aligne",
    "Méthode du studio",
    "Les Cool People",
    "FAQ courte",
    "CTA final",
  ],
  hero: [
    "24MARCH STUDIO",
    "Cool people live here.",
    "Des gens cools vivent ici.",
    "Studio digital d’intérieur.",
    "Des intérieurs avec du caractère. Pensés pour être vécus.",
    "Direction créative. Sélection de mobilier et d’objets. Visualisation 3D.",
    "Pièce par pièce.",
    "Donner une direction à ma pièce",
    "Pour les gens qui pensent en images.",
  ],
  positioning: [
    "Pas juste de la déco. Une vraie direction pour ton espace.",
    "Tes goûts, tes références et ta façon de vivre deviennent une direction claire.",
    "Couleurs, mobilier, objets, lumière. Tout est pensé ensemble.",
    "Pour donner une identité à ton appartement. Pas seulement un style.",
  ],
  featuredRooms: [
    { name: "Salon", price: 349, promise: "Plus vivant. Plus accueillant." },
    { name: "Chambre adulte", price: 349, promise: "Plus douce. Plus enveloppante." },
    { name: "Bureau", price: 349, promise: "Plus inspirant. Plus fonctionnel." },
    { name: "Salle de bain", price: 349, promise: "Plus soignée. Plus singulière." },
    { name: "Balcon / terrasse", price: 249, promise: "Plus agréable. Mieux exploité." },
  ],
  roomPrices: [
    { name: "Entrée", price: 249 },
    { name: "WC", price: 249 },
    { name: "Cellier / buanderie", price: 249 },
    { name: "Balcon / terrasse", price: 249 },
    { name: "Chambre bébé", price: 299 },
    { name: "Chambre enfant", price: 299 },
    { name: "Chambre ado", price: 299 },
    { name: "Dressing", price: 299 },
    { name: "Chambre adulte", price: 349 },
    { name: "Bureau", price: 349 },
    { name: "Salle à manger", price: 349 },
    { name: "Salle de bain", price: 349 },
    { name: "Salon", price: 349 },
    { name: "Cuisine", price: 349 },
    { name: "Pièce de vie", price: 379 },
    { name: "Suite parentale", price: 399 },
  ],
  receive: [
    "Pas une liste d’idées. Une direction prête à suivre.",
    "Direction créative.",
    "Palette de couleurs.",
    "Mobilier et objets sélectionnés.",
    "Plan d’aménagement.",
    "Visualisations 3D.",
    "Détails de mise en place.",
    "Tu sais quoi choisir. Où le placer. Et pourquoi ça fonctionne.",
  ],
  transformation: [
    "Quand tout s’aligne",
    "Tu ne collectionnes plus des idées séparées.",
    "Chaque couleur répond à une autre.",
    "Chaque meuble trouve sa vraie place.",
    "La pièce devient plus fluide. Plus cohérente. Plus personnelle.",
    "Ton univers prend forme. Sans perdre son caractère.",
  ],
  method: [
    {
      title: "01 — Montre ton univers",
      copy: "Photos de la pièce. Mesures principales. Inspirations enregistrées. Habitudes et contraintes.",
    },
    {
      title: "02 — La direction prend forme",
      copy: "Volumes, couleurs et lumière. Mobilier, objets et matières. Tout commence à s’aligner.",
    },
    {
      title: "03 — Tu peux avancer",
      copy: "Tu visualises le résultat. Tu retrouves chaque référence. Tu sais quoi faire ensuite.",
    },
  ],
  coolPeople: {
    intro: [
      "Des intérieurs qui ressemblent à ceux qui y vivent.",
      "Des objets qui comptent.",
      "Des détails jamais choisis au hasard.",
      "Des espaces personnels. Pensés pour le quotidien.",
    ],
    profiles: [
      { name: "Maya", archetype: "Le chaos maîtrisé", copy: "Objets, couleurs, souvenirs." },
      { name: "Noé", archetype: "Le calme qui marque", copy: "Peu de pièces. Des choix forts." },
      { name: "Alma", archetype: "Le passé remixé", copy: "Vintage. Actuel. Jamais figé." },
      { name: "Sacha", archetype: "La pièce à tout faire", copy: "Travailler. Créer. Recevoir." },
      { name: "Lou", archetype: "Le décor signature", copy: "Mode, image, culture." },
    ],
  },
  faq: [
    {
      question: "Tout se fait à distance ?",
      answer: "Oui. Brief, échanges et rendus. Tout se passe en ligne.",
    },
    {
      question: "Faut-il tout remplacer ?",
      answer: "Non. Ce qui compte reste. Le reste s’ajuste autour.",
    },
    {
      question: "Et sans style précis ?",
      answer:
        "On t’aide à le trouver. Plusieurs inspirations te sont proposées. Tu repères ce qui te plaît. La direction se construit autour.",
    },
    {
      question: "Peut-on commencer petit ?",
      answer: "Oui. Une seule pièce suffit. Tu peux ensuite en ajouter plusieurs.",
    },
    {
      question: "Les travaux sont-ils suivis ?",
      answer: "Non. Le studio dirige l’espace. Pas le chantier.",
    },
    {
      question: "Des ajustements sont-ils inclus ?",
      answer:
        "Oui. Une phase d’ajustements est incluse. Tous tes retours sont regroupés et appliqués ensemble. Les ajustements concernent la direction proposée, pas une nouvelle direction complète.",
    },
  ],
  finalCta: [
    "Ton intérieur mérite une vraie direction.",
    "Commence par la pièce qui te ressemble le moins.",
    "Donner une direction à ma pièce",
  ],
} as const;

export interface ConversationDecisionSeed20260725 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution?: string;
  relatedItemKey?: "homepage" | "nfinite" | "pricing";
}

const landing = VALIDATED_LANDING_PAGE_2026_07_25;
const structureResolution = landing.sections.join(" → ");
const heroResolution = landing.hero.join(" / ");
const coolPeopleResolution = [
  ...landing.coolPeople.intro,
  ...landing.coolPeople.profiles.map(
    (profile) => `${profile.name} — ${profile.archetype} — ${profile.copy}`
  ),
].join(" ");
const pricingResolution =
  "Prix fixes par pièce : 249 € / 299 € / 349 €, pièce de vie 379 €, suite parentale 399 €";

export const CONVERSATION_DECISIONS_2026_07_25: ConversationDecisionSeed20260725[] = [
  {
    question: "Quelle structure doit suivre la homepage 24March Studio ?",
    context: `Ordre final validé : ${structureResolution}. L’encart « Présenter mon projet » est supprimé.`,
    options: [structureResolution, "Revoir la structure"],
    resolution: structureResolution,
    relatedItemKey: "homepage",
  },
  {
    question: "Quel texte doit être utilisé dans le hero de la homepage ?",
    context:
      "Le hero conserve un seul parcours vers les pièces. Les anciens boutons « Choisir ma pièce » et « Présenter mon projet » sont remplacés.",
    options: [heroResolution, "Revoir le hero"],
    resolution: heroResolution,
    relatedItemKey: "homepage",
  },
  {
    question: "Quel titre conserver pour la transformation du projet ?",
    context: "Le titre est définitivement conservé dans la landing page finale.",
    options: ["Quand tout s’aligne", "Revoir le titre"],
    resolution: "Quand tout s’aligne",
    relatedItemKey: "homepage",
  },
  {
    question: "Quelle modification appliquer à la section Méthode du studio ?",
    context:
      "La méthode reste en trois étapes. Seule la phrase « pas un chantier sans fin » doit rester supprimée.",
    options: ["Retirer uniquement « pas un chantier sans fin »", "Réécrire toute la section"],
    resolution: "Retirer uniquement « pas un chantier sans fin »",
    relatedItemKey: "homepage",
  },
  {
    question: "Quel texte conserver pour Les Cool People ?",
    context:
      "La homepage présente cinq profils en quelques mots. Les développements détaillés pourront vivre sur une page séparée.",
    options: [coolPeopleResolution, "Revoir la section"],
    resolution: coolPeopleResolution,
    relatedItemKey: "homepage",
  },
  {
    question: "La landing page 24March Studio est-elle définitivement validée ?",
    context:
      "Le copywriting, la structure, les cinq pièces mises en avant, la FAQ et le CTA final ont reçu une validation explicite.",
    options: ["Oui, passer à l’intégration", "Reprendre le copywriting"],
    resolution: "Oui, passer à l’intégration",
    relatedItemKey: "homepage",
  },
  {
    question: "Quel parcours doit utiliser la landing page pour les pièces ?",
    context:
      "La homepage reste éditoriale : cinq pièces représentatives, puis un lien vers les seize pièces. Aucun configurateur de seize cartes sur la landing page.",
    options: [
      "Afficher cinq pièces puis « Voir les 16 pièces »",
      "Afficher les seize pièces directement",
    ],
    resolution: "Afficher cinq pièces puis « Voir les 16 pièces »",
    relatedItemKey: "homepage",
  },
  {
    question: "Quelle grille tarifaire publier ?",
    aliases: ["Quelle grille tarifaire de lancement est définitivement validée ?"],
    context:
      "Tarifs de lancement fixes par type de pièce, jamais calculés selon la surface du client. Les catégories restent internes ; le site affiche le prix de chaque pièce.",
    options: [pricingResolution, "Recalculer la grille"],
    resolution: pricingResolution,
    relatedItemKey: "pricing",
  },
  {
    question: "Quelle est la prochaine action concernant Nfinite ?",
    context:
      "Le mail demandant confirmation de la réactivation de 24March Studio a été envoyé. L’autorisation de 2022 et l’historique sans difficulté jusqu’à la fermeture en 2025 soutiennent la demande.",
    options: [
      "Attendre la réponse ; accord → lancer en septembre, refus → décaler l’ouverture et préparer une sortie en janvier",
      "Relancer immédiatement",
    ],
    resolution:
      "Attendre la réponse ; accord → lancer en septembre, refus → décaler l’ouverture et préparer une sortie en janvier",
    relatedItemKey: "nfinite",
  },
];

export type ConversationDecisionInput20260725 = Omit<
  Decision,
  "id" | "status" | "createdAt" | "resolvedAt"
>;
