export const CONVERSATION_UPDATE_2026_08_06 =
  "orbit-hub:migrations:conversation-update-2026-08-06";

export const STUDIO_DIRECTION_2026_08_06 = {
  status: "homepage_structure_validated_visual_production_in_progress_workflow_locked",
  positioning: [
    "24March Studio reste une direction artistique d’intérieur digitale B2C pour particuliers créatifs.",
    "Promesse : un intérieur vraiment personnel, fort à vivre et fort en image.",
    "Signature : Cool people live here.",
    "Refuser toute présentation B2B, agence 3D, studio IA ou architecture classique.",
  ],
  visualIdentityCorrections: [
    "Le teal n’a jamais été validé et doit être retiré de toute source de vérité présentée comme finale.",
    "Ne jamais réintroduire une palette, une typographie ou une maquette rejetée au prétexte qu’elle existait dans une version antérieure.",
    "Quand deux directions se contredisent, la validation la plus récente gagne.",
    "Les références visuelles et documents validés du Drive restent prioritaires sur toute improvisation.",
  ],
  homepage: [
    "Hero plein cadre, immédiatement identifiable à la marque.",
    "Accroche de positionnement : Pas une déco Pinterest.",
    "Sélecteur de pièces avec six capsules verticales identiques.",
    "Bandeau : Ta pièce, mais en mieux.",
    "Sections conservées : Ce que tu reçois, Notre méthode en six étapes, Les Cool People, CTA final.",
    "Supprimer Projets récents, avis clients et témoignages.",
    "Présenter cinq Cool People via des cartes homogènes, non étirées, avec un symbole distinct par profil.",
  ],
  capsuleSystem: [
    "Capsules validées après comparaison avec les superellipses.",
    "Arches rejetées car jugées dépassées.",
    "Six capsules strictement identiques et alignées.",
    "Implémentation : border-radius 9999px, overflow hidden, object-fit cover, aspect-ratio 3/5.",
  ],
  pricing: [
    "Tarifs affichés depuis la source de données, jamais recopiés en dur dans la page.",
    "Salon 229 €, Chambre 229 €, Bureau 229 €, Cuisine 259 €, Salle à manger 229 €, Suite parentale 289 €.",
    "Stripe reste intact.",
    "Ignorer les anciens prix de maquette contradictoires.",
  ],
  visualProduction: [
    "Avant chaque rendu : produire et valider une shopping list puis un moodboard.",
    "Construire ensuite le prompt depuis les références validées, sans partir d’une génération libre.",
    "Chaque image finale doit être réaliste, en 2K HD, sans artefact ni hallucination visible.",
    "La photo au flash direct et grand-angle est une direction de nuit, pas l’unique direction photographique du site.",
    "Les scènes de jour gardent une lumière naturelle ou éditoriale cohérente avec le concept.",
    "Mesurer le temps de préparation, génération, correction et validation pour protéger la rentabilité.",
    "Limiter les variations inutiles : une hypothèse à la fois, critères de rejet explicites, version validée archivée.",
  ],
  landingVisualOrder: [
    "01 Hero",
    "02 Image polaroïd",
    "03 Capsule Salon",
    "04 Capsule Chambre",
    "05 Capsule Bureau",
    "06 Capsule Cuisine",
    "07 Capsule Salle à manger",
    "08 Capsule Suite parentale",
    "09 Bandeau Ta pièce, mais en mieux",
    "10 Cool People 1",
    "11 Cool People 2",
    "12 Cool People 3",
    "13 Cool People 4",
    "14 Cool People 5",
    "15 Lifestyle final sans témoignage",
  ],
  deployment: [
    "Domaine principal choisi : 24marchstudio.fr.",
    "Hébergement et déploiement via Vercel.",
    "La page /waitlist ne montre ni menu ni navigation du site.",
    "Le fond de la waitlist est flouté.",
  ],
  currentState: [
    "Structure de homepage refaite selon la maquette validée.",
    "Capsules, hiérarchie des sections, Cool People et prix sont verrouillés.",
    "Les visuels finaux restent le principal chantier en cours.",
    "Le workflow de production doit désormais être documenté, reproductible et chiffré.",
    "La conformité AI Act n’invalide pas le workflow ; prévoir les mentions de transparence requises lors de la publication.",
  ],
} as const;

export type StudioUpdateItemKey20260806 =
  | "homepage"
  | "capsules"
  | "visuals"
  | "workflow"
  | "deployment";

export interface ConversationDecisionSeed20260806 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution: string;
  relatedItemKey?: StudioUpdateItemKey20260806;
}

export const CONVERSATION_DECISIONS_2026_08_06: ConversationDecisionSeed20260806[] = [
  {
    question: "Le teal appartient-il à la palette finale validée ?",
    aliases: [
      "Quelle est la palette principale de la landing page ?",
      "Quelle direction artistique doit suivre la landing page ?",
    ],
    context:
      "Une ancienne synthèse présentait le teal comme validé. Cette information a été explicitement corrigée ensuite.",
    options: [
      "Non — le teal n’a jamais été validé ; suivre les références récentes",
      "Oui — conserver le teal comme couleur principale",
    ],
    resolution: "Non — le teal n’a jamais été validé ; suivre les références récentes",
    relatedItemKey: "homepage",
  },
  {
    question: "Quel hero doit utiliser la homepage actuelle ?",
    aliases: ["Quel format doit utiliser le hero de la landing page ?"],
    context:
      "La homepage a depuis été reconstruite autour d’un hero plein cadre. Cette validation remplace le précédent montage horizontal en trois zones.",
    options: [
      "Hero plein cadre, immédiatement identifiable à 24March Studio",
      "Montage horizontal texte / intérieur / lifestyle",
    ],
    resolution: "Hero plein cadre, immédiatement identifiable à 24March Studio",
    relatedItemKey: "homepage",
  },
  {
    question: "Quelle structure doit suivre la homepage 24March Studio ?",
    aliases: ["Quel système de page est validé pour la landing page ?"],
    context:
      "La version actuelle a été recentrée sur le hero, le positionnement, les pièces, les livrables, la méthode, les Cool People et le CTA final.",
    options: [
      "Hero, Pas une déco Pinterest, six capsules, Ta pièce mais en mieux, Ce que tu reçois, méthode 6 étapes, cinq Cool People, CTA final",
      "Ancienne structure 10 sections avec méthode 5 étapes",
    ],
    resolution:
      "Hero, Pas une déco Pinterest, six capsules, Ta pièce mais en mieux, Ce que tu reçois, méthode 6 étapes, cinq Cool People, CTA final",
    relatedItemKey: "homepage",
  },
  {
    question: "Quel est l’état actuel de la homepage ?",
    aliases: ["La maquette visuelle finale de la landing page est-elle validée ?"],
    context:
      "La structure a été refaite sur la maquette retenue. Le chantier restant concerne surtout les images finales, le responsive et la revue pré-production.",
    options: [
      "Structure validée et implémentée ; visuels finaux encore en production",
      "Aucune structure validée",
      "Page totalement terminée et prête à lancer",
    ],
    resolution: "Structure validée et implémentée ; visuels finaux encore en production",
    relatedItemKey: "homepage",
  },
  {
    question: "Quelle forme utiliser pour les images du sélecteur de pièces ?",
    context:
      "Les arches ont été rejetées. Les capsules et superellipses ont été comparées sur des maquettes distinctes.",
    options: ["Capsules verticales", "Superellipses", "Arches"],
    resolution: "Capsules verticales",
    relatedItemKey: "capsules",
  },
  {
    question: "Quelles sections retirer de la homepage ?",
    context:
      "La page ne doit pas se diluer dans une structure d’agence classique ni inventer de preuve sociale non disponible.",
    options: [
      "Retirer Projets récents, avis clients et témoignages",
      "Conserver toutes les sections historiques",
    ],
    resolution: "Retirer Projets récents, avis clients et témoignages",
    relatedItemKey: "homepage",
  },
  {
    question: "Comment présenter les Cool People ?",
    context:
      "Cinq mascottes ont été validées. Les cartes précédentes paraissaient trop grandes et écrasées.",
    options: [
      "Cinq cartes homogènes, proportions naturelles, un symbole distinct par profil",
      "Une grille de grandes cartes étirées",
    ],
    resolution: "Cinq cartes homogènes, proportions naturelles, un symbole distinct par profil",
    relatedItemKey: "capsules",
  },
  {
    question: "Le flash direct grand-angle définit-il toutes les images du site ?",
    context:
      "Cette esthétique fonctionne pour les scènes nocturnes, mais ne doit pas uniformiser artificiellement les scènes de jour.",
    options: [
      "Non — direction réservée principalement aux images de nuit",
      "Oui — direction unique pour toute la banque d’images",
    ],
    resolution: "Non — direction réservée principalement aux images de nuit",
    relatedItemKey: "visuals",
  },
  {
    question: "Que faut-il valider avant toute génération finale ?",
    context:
      "Les tâtonnements visuels ont coûté du temps et éloigné les rendus des références approuvées.",
    options: [
      "Shopping list puis moodboard, avant rédaction du prompt final",
      "Générer immédiatement puis choisir après",
    ],
    resolution: "Shopping list puis moodboard, avant rédaction du prompt final",
    relatedItemKey: "workflow",
  },
  {
    question: "Quel niveau de qualité exiger pour les visuels du site ?",
    context:
      "Les images sont destinées à une intégration directe sur la landing page et doivent ressembler à de vraies photographies.",
    options: [
      "2K HD, photoréalisme, aucun artefact ni hallucination visible",
      "Images de travail avec défauts secondaires acceptés",
    ],
    resolution: "2K HD, photoréalisme, aucun artefact ni hallucination visible",
    relatedItemKey: "visuals",
  },
  {
    question: "Quels prix afficher sur les six capsules principales ?",
    context:
      "Les prix de certaines maquettes contredisaient la source utilisée par Stripe. La donnée du site fait foi.",
    options: [
      "229 / 229 / 229 / 259 / 229 / 289 € via getServiceBySlug et formatPrice",
      "299 / 249 / 399 € recopiés depuis les maquettes",
    ],
    resolution: "229 / 229 / 229 / 259 / 229 / 289 € via getServiceBySlug et formatPrice",
    relatedItemKey: "homepage",
  },
  {
    question: "Comment doit fonctionner la page waitlist ?",
    context:
      "Les visiteurs de la waitlist ne doivent pas accéder au reste du site depuis cette page.",
    options: [
      "Sans navigation, avec fond flouté",
      "Avec menu principal et fond net",
    ],
    resolution: "Sans navigation, avec fond flouté",
    relatedItemKey: "deployment",
  },
  {
    question: "Comment protéger la rentabilité de la production visuelle ?",
    context:
      "Les générations, tests et corrections doivent rester compatibles avec le temps facturable de chaque projet.",
    options: [
      "Chronométrer chaque phase, limiter les variations et archiver les recettes validées",
      "Multiplier les essais jusqu’à obtenir un résultat sans limite définie",
    ],
    resolution: "Chronométrer chaque phase, limiter les variations et archiver les recettes validées",
    relatedItemKey: "workflow",
  },
];
