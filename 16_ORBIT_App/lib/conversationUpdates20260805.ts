export const CONVERSATION_UPDATE_2026_08_05 =
  "orbit-hub:migrations:conversation-update-2026-08-05";

export const WEBSITE_DIRECTION_2026_08_05 = {
  status: "landing_page_implemented_visual_assets_in_progress",
  positioning: [
    "24March Studio reste une direction artistique d’intérieur digitale B2C pour particuliers créatifs.",
    "Promesse : un intérieur personnel, audacieux mais maîtrisé, fort à vivre et fort en image.",
    "Signature : Cool people live here.",
    "Refuser les codes d’agence beige, le rendu Pinterest générique, le luxe froid et les intérieurs lisses sans personnalité.",
  ],
  currentImplementation: [
    "Homepage reconstruite sur la maquette validée avec hero plein cadre.",
    "Sections intégrées : hero, sélecteur de pièces, bandeau « Ta pièce, mais en mieux », ce que tu reçois, méthode en six étapes, Cool People et CTA final.",
    "Les sections projets récents, avis client et témoignages inventés restent supprimées.",
    "Les cinq Cool People utilisent des cartes homogènes, une ligne discontinue et un symbole par profil.",
    "Les prix proviennent uniquement de getServiceBySlug() et formatPrice(); Stripe reste inchangé.",
    "TypeScript et build ont été validés avant le remplacement final des visuels.",
  ],
  capsules: [
    "Forme finale : capsules verticales strictement identiques.",
    "Technique : border-radius 9999px, overflow hidden, object-fit cover, aspect-ratio 3/5.",
    "Les arches sont rejetées car datées. Les superellipses ne sont pas retenues.",
    "Ordre : Salon, Chambre, Bureau, Cuisine, Salle à manger, Suite parentale.",
  ],
  photography: [
    "Le flash direct et le grand-angle constituent la direction principale des scènes nocturnes, pas une règle universelle.",
    "Les scènes de jour privilégient une lumière naturelle ou éditoriale crédible, adaptée à l’espace et au profil client.",
    "Le rendu doit rester photographique, sophistiqué, audacieux mais contrôlé.",
    "Aucun artefact IA, objet halluciné, texte illisible, mobilier déformé ou architecture incohérente.",
    "Les images finales doivent être produites en 2K HD et conserver exactement leur cadrage et leur ratio d’intégration.",
  ],
  visualSequence: [
    "Hero",
    "Image polaroïd",
    "Capsule Salon",
    "Capsule Chambre",
    "Capsule Bureau",
    "Capsule Cuisine",
    "Capsule Salle à manger",
    "Capsule Suite parentale",
    "Bandeau « Ta pièce, mais en mieux »",
    "Cool People 1",
    "Cool People 2",
    "Cool People 3",
    "Cool People 4",
    "Cool People 5",
    "Visuel lifestyle final sans faux témoignage",
  ],
} as const;

export const CLIENT_DIRECTION_SYSTEM_2026_08_05 = {
  principles: [
    "Ne pas enfermer les clients dans la palette observée sur les références du site.",
    "Construire quatre grandes directions créatives adaptables, puis les moduler selon les facteurs du profil client.",
    "Le questionnaire final doit produire un indicateur pour chaque facteur utile à la direction artistique.",
    "Les facteurs doivent guider intensité, couleur, contraste, matière, audace, densité visuelle et rapport image/usage.",
    "Pour les foyers multi-personnes, une réponse principale suffit : ne pas obliger chaque membre du foyer à remplir le questionnaire.",
    "Le répondant principal précise les usages, contraintes et éventuels désaccords du foyer.",
    "Amazon rejoint la liste des sources produits possibles, sans devenir la référence esthétique principale.",
  ],
} as const;

export interface ConversationDecisionSeed20260805 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution?: string;
  relatedItemKey?: "homepage" | "artDirection" | "visuals" | "questionnaire";
}

export const CONVERSATION_DECISIONS_2026_08_05: ConversationDecisionSeed20260805[] = [
  {
    question: "Quelle direction artistique finale doit suivre la landing page ?",
    aliases: ["Quelle direction artistique doit suivre la landing page ?"],
    context:
      "La direction la plus récente remplace les anciennes palettes figées : plateforme éditoriale playful maîtrisée, intérieurs sophistiqués et audacieux, capsules verticales et photographie adaptée au jour ou à la nuit.",
    options: [
      "Éditoriale, interactive, audacieuse mais maîtrisée; couleurs par touches; photo jour/nuit adaptée",
      "Palette bordeaux/teal imposée à toutes les scènes",
      "Site d’agence beige classique",
    ],
    resolution:
      "Éditoriale, interactive, audacieuse mais maîtrisée; couleurs par touches; photo jour/nuit adaptée",
    relatedItemKey: "artDirection",
  },
  {
    question: "Quel format doit utiliser le hero actuel ?",
    aliases: ["Quel format doit utiliser le hero de la landing page ?"],
    context:
      "La homepage a été reconstruite sur la maquette la plus récente. Le hero horizontal en collage de juillet n’est plus la spécification active.",
    options: [
      "Hero plein cadre, immersif et responsive",
      "Hero en collage horizontal texte/image/lifestyle",
      "Hero vertical type mobile",
    ],
    resolution: "Hero plein cadre, immersif et responsive",
    relatedItemKey: "homepage",
  },
  {
    question: "Quelle structure finale doit suivre la homepage ?",
    aliases: [
      "Quel système de page est validé pour la landing page ?",
      "Quelle structure doit suivre la homepage 24March Studio ?",
    ],
    context:
      "La version intégrée comprend six capsules et une méthode en six étapes. Elle remplace la structure antérieure à cinq pièces et cinq étapes.",
    options: [
      "Hero plein cadre, 6 capsules, bandeau, ce que tu reçois, méthode 6 étapes, 5 Cool People, CTA final",
      "10 sections, 5 pièces et méthode 5 étapes",
    ],
    resolution:
      "Hero plein cadre, 6 capsules, bandeau, ce que tu reçois, méthode 6 étapes, 5 Cool People, CTA final",
    relatedItemKey: "homepage",
  },
  {
    question: "La landing page est-elle désormais implémentée ?",
    aliases: ["La maquette visuelle finale de la landing page est-elle validée ?"],
    context:
      "La structure et les composants ont été intégrés et le build a réussi. Le travail restant porte surtout sur la génération, le remplacement et la validation des visuels finaux 2K.",
    options: [
      "Oui — structure implémentée; visuels finaux encore en cours",
      "Non — aucune intégration commencée",
      "Oui — tout est terminé, visuels compris",
    ],
    resolution: "Oui — structure implémentée; visuels finaux encore en cours",
    relatedItemKey: "homepage",
  },
  {
    question: "Quelle forme doit utiliser le sélecteur de pièces ?",
    context:
      "Les arches ont été jugées datées. Les capsules verticales ont été comparées aux superellipses puis explicitement validées.",
    options: ["Capsules verticales 3/5", "Superellipses", "Arches"],
    resolution: "Capsules verticales 3/5",
    relatedItemKey: "artDirection",
  },
  {
    question: "Le flash direct grand-angle doit-il définir toutes les images du site ?",
    context:
      "Cette esthétique fonctionne pour les scènes de nuit, mais deviendrait répétitive et artificielle si elle était appliquée uniformément aux scènes de jour.",
    options: [
      "Non — flash direct et grand-angle surtout la nuit; lumière crédible et adaptée le jour",
      "Oui — même flash direct sur toutes les images",
    ],
    resolution:
      "Non — flash direct et grand-angle surtout la nuit; lumière crédible et adaptée le jour",
    relatedItemKey: "artDirection",
  },
  {
    question: "Quel niveau stylistique doivent viser les intérieurs ?",
    context:
      "Les espaces doivent être distinctifs sans devenir chaotiques, décoratifs ou artificiellement tendance.",
    options: [
      "Sophistiqués, audacieux et maîtrisés",
      "Beige minimal et consensuel",
      "Dopamine maximaliste sans contrôle",
    ],
    resolution: "Sophistiqués, audacieux et maîtrisés",
    relatedItemKey: "artDirection",
  },
  {
    question: "La landing page doit-elle inclure projets récents, avis clients ou témoignages ?",
    context:
      "Ces sections ont été retirées. Aucun témoignage ne doit être inventé pour remplir la page ou le visuel final.",
    options: [
      "Non — conserver un visuel lifestyle final sans faux témoignage",
      "Oui — ajouter projets et témoignages génériques",
    ],
    resolution: "Non — conserver un visuel lifestyle final sans faux témoignage",
    relatedItemKey: "homepage",
  },
  {
    question: "Comment présenter les Cool People ?",
    context:
      "La section doit présenter cinq univers distincts sans cartes énormes, compressées ou incohérentes avec le reste de la page.",
    options: [
      "Cinq cartes homogènes, ligne discontinue, un symbole par profil",
      "Une grande mosaïque libre avec cartes de tailles variables",
    ],
    resolution: "Cinq cartes homogènes, ligne discontinue, un symbole par profil",
    relatedItemKey: "homepage",
  },
  {
    question: "Quel ordre suivre pour produire les visuels de la landing page ?",
    context:
      "L’ordre sert de checklist de génération et d’intégration. Il évite de mélanger sections, pièces et visuels lifestyle.",
    options: [
      "Hero → polaroïd → 6 capsules → bandeau → 5 Cool People → lifestyle final",
      "Produire les images sans ordre défini",
    ],
    resolution: "Hero → polaroïd → 6 capsules → bandeau → 5 Cool People → lifestyle final",
    relatedItemKey: "visuals",
  },
  {
    question: "La palette client doit-elle rester limitée aux couleurs des références du site ?",
    context:
      "Les directions peuvent changer selon le client. Le système doit analyser des facteurs plutôt que forcer une palette unique.",
    options: [
      "Non — quatre grandes directions modulées par indicateurs client",
      "Oui — imposer la palette du site à tous les projets",
    ],
    resolution: "Non — quatre grandes directions modulées par indicateurs client",
    relatedItemKey: "questionnaire",
  },
  {
    question: "Comment traiter les foyers multi-personnes dans le questionnaire ?",
    context:
      "Les autres membres du foyer ne voudront pas forcément remplir un questionnaire complet. Le parcours doit rester réaliste et fluide.",
    options: [
      "Un répondant principal décrit usages, contraintes et désaccords du foyer",
      "Chaque membre doit obligatoirement remplir le questionnaire",
    ],
    resolution: "Un répondant principal décrit usages, contraintes et désaccords du foyer",
    relatedItemKey: "questionnaire",
  },
  {
    question: "Quelle est la source de vérité des prix sur la landing page ?",
    context:
      "Les prix affichés ne doivent plus être dupliqués dans les composants, afin d’éviter les divergences entre maquette, code et paiement.",
    options: [
      "getServiceBySlug() + formatPrice()",
      "Valeurs saisies manuellement dans chaque carte",
    ],
    resolution: "getServiceBySlug() + formatPrice()",
    relatedItemKey: "homepage",
  },
  {
    question: "Amazon peut-il être utilisé dans les sélections produits ?",
    context:
      "Amazon a été ajouté à la liste de sources possibles pour élargir l’accès et les budgets, sans dicter la direction artistique.",
    options: ["Oui, comme source complémentaire", "Non, exclure Amazon"],
    resolution: "Oui, comme source complémentaire",
    relatedItemKey: "questionnaire",
  },
];
