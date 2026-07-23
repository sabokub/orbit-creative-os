import type { Decision } from "./types";

export const CONVERSATION_UPDATE_2026_07_24 = "orbit-hub:migrations:conversation-update-2026-07-24";

export const VALIDATED_HOMEPAGE_2026_07_24 = {
  sections: [
    "Hero immersif",
    "Positionnement",
    "Choix de la pièce",
    "Ce que tu reçois",
    "Transformation du projet",
    "Méthode du studio",
    "Les Cool People",
    "FAQ courte",
    "Présenter mon projet",
    "CTA final",
  ],
  hero: [
    "24MARCH STUDIO",
    "Cool people live here.",
    "Des gens cools vivent ici.",
    "Studio digital d’intérieur.",
    "Des intérieurs avec du caractère.",
    "Pensés pour être vécus.",
    "Direction créative.",
    "Sélection de mobilier et d’objets.",
    "Visualisation 3D.",
    "Pièce par pièce.",
    "Choisir ma pièce",
    "Présenter mon projet",
    "Pour les gens qui pensent en images.",
  ],
  transformationTitle: "Quand tout s’aligne",
  methodEdit: "Retirer uniquement « pas un chantier sans fin ».",
  coolPeople: [
    "Des intérieurs qui ressemblent à ceux qui y vivent.",
    "Des objets qui comptent.",
    "Des détails jamais choisis au hasard.",
    "Des espaces personnels.",
  ],
} as const;

export interface ConversationDecisionSeed {
  question: string;
  context: string;
  options: string[];
  resolution?: string;
  relatedItemKey?: "homepage" | "nfinite" | "income" | "pricing";
}

export const CONVERSATION_DECISIONS_2026_07_24: ConversationDecisionSeed[] = [
  {
    question: "Quelle structure doit suivre la homepage 24March Studio ?",
    context: `Ordre validé : ${VALIDATED_HOMEPAGE_2026_07_24.sections.join(" → ")}.`,
    options: [VALIDATED_HOMEPAGE_2026_07_24.sections.join(" → "), "Revoir la structure"],
    resolution: VALIDATED_HOMEPAGE_2026_07_24.sections.join(" → "),
    relatedItemKey: "homepage",
  },
  {
    question: "Quel texte doit être utilisé dans le hero de la homepage ?",
    context: VALIDATED_HOMEPAGE_2026_07_24.hero.join(" / "),
    options: [VALIDATED_HOMEPAGE_2026_07_24.hero.join(" / "), "Revoir le hero"],
    resolution: VALIDATED_HOMEPAGE_2026_07_24.hero.join(" / "),
    relatedItemKey: "homepage",
  },
  {
    question: "Quel titre conserver pour la transformation du projet ?",
    context: "Le titre a été explicitement conservé pendant la reprise du copywriting.",
    options: ["Quand tout s’aligne", "Revoir le titre"],
    resolution: "Quand tout s’aligne",
    relatedItemKey: "homepage",
  },
  {
    question: "Quelle modification appliquer à la section Méthode du studio ?",
    context: "La section reste en place ; une seule formulation doit disparaître.",
    options: ["Retirer uniquement « pas un chantier sans fin »", "Réécrire toute la section"],
    resolution: "Retirer uniquement « pas un chantier sans fin »",
    relatedItemKey: "homepage",
  },
  {
    question: "Quel texte conserver pour Les Cool People ?",
    context: VALIDATED_HOMEPAGE_2026_07_24.coolPeople.join(" "),
    options: [VALIDATED_HOMEPAGE_2026_07_24.coolPeople.join(" "), "Revoir la section"],
    resolution: VALIDATED_HOMEPAGE_2026_07_24.coolPeople.join(" "),
    relatedItemKey: "homepage",
  },
  {
    question: "Quel seuil doit déclencher la sortie du CDI ?",
    context: "Le salaire actuel annoncé est de 2 195 € net avant impôts. La sortie ne doit pas réduire le revenu personnel sous ce niveau.",
    options: ["Quitter seulement quand le studio génère au moins 2 195 € net avant impôts", "Quitter avant ce seuil"],
    resolution: "Quitter seulement quand le studio génère au moins 2 195 € net avant impôts",
    relatedItemKey: "income",
  },
  {
    question: "Quelle stratégie suivre selon la réponse de Nfinite ?",
    context: "Plan conditionnel confirmé : attendre janvier en cas de refus ; en cas d’accord, ne pas ouvrir immédiatement la discussion de non-concurrence.",
    options: [
      "Refus : attendre janvier. Accord : négocier la non-concurrence au moment d’annoncer le départ",
      "Revoir ce plan",
    ],
    resolution: "Refus : attendre janvier. Accord : négocier la non-concurrence au moment d’annoncer le départ",
    relatedItemKey: "nfinite",
  },
  {
    question: "Quelle grille tarifaire publier ?",
    context: "Une proposition 399 € / 549 € / 699 € / 899 € TTC a été discutée, mais elle n’a pas encore été validée par l’utilisatrice.",
    options: ["Valider 399 € / 549 € / 699 € / 899 € TTC", "Recalculer la grille", "Conserver les prix actuels"],
    relatedItemKey: "pricing",
  },
];

export type ConversationDecisionInput = Omit<Decision, "id" | "status" | "createdAt" | "resolvedAt">;
