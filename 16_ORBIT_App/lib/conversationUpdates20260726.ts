export const CONVERSATION_UPDATE_2026_07_26 =
  "orbit-hub:migrations:conversation-update-2026-07-26";

export const LANDING_PAGE_DIRECTION_2026_07_26 = {
  status: "art_direction_validated_copy_validated_mockup_pending",
  positioning: [
    "B2C pour particuliers créatifs.",
    "Direction artistique d’intérieur digitale.",
    "Transformation personnelle, sensible et forte en image.",
    "Signature : Cool people live here.",
    "Ne jamais présenter l’offre comme du B2B, du coaching déco ou une agence d’architecture classique.",
  ],
  visualDirection: [
    "Fond blanc presque pur, légèrement chaud.",
    "Palette principale : bordeaux, teal, noir et taupe.",
    "Bleu clair et vert lime uniquement en accents.",
    "Collage premium maîtrisé, magazine éditorial et campagne de marque interactive.",
    "Photos : environ 50 % intérieurs et 50 % lifestyle.",
    "Objets et animations sobres, sans surcharge décorative.",
  ],
  typography: [
    "Recoleta et Inter pour le système typographique global.",
    "Dans le hero, display noire, très condensée et massive, proche d’une grotesque éditoriale.",
  ],
  hero: [
    "Format desktop horizontal et panoramique.",
    "Texte à gauche.",
    "Grande image intérieure principale au centre.",
    "Photo lifestyle à droite.",
    "Bulle glass superposée sur une zone sombre pour préserver un vrai effet de transparence.",
    "L’image intérieure principale fournie le 26 juillet est retenue comme base du hero.",
    "La carte glass animée est destinée au hero et reste à finaliser techniquement.",
  ],
  pageSystem: [
    "Structure finale en 10 sections.",
    "Processus en 5 étapes.",
    "Offres mises en avant par pièce : salon, suite parentale, bureau, salle de bain et balcon.",
    "Section Cool People avec cinq profils.",
    "Les tarifs et le copywriting validés le 25 juillet restent inchangés.",
  ],
  visualAssets: [
    "Premier batch de huit images intérieures généré et en cours de correction.",
    "Les images doivent paraître photographiées en France, avec fenêtres et détails architecturaux cohérents.",
    "Photographie éditoriale réaliste, détails vécus, flash direct contrôlé.",
    "Aucun artefact IA, objet incohérent, faux livre illisible, appareil photo déformé ou détail halluciné.",
    "Conserver strictement le ratio demandé lors des régénérations.",
    "Le second batch reste à produire puis l’ensemble doit être harmonisé.",
  ],
  currentState: [
    "Positionnement final validé.",
    "Direction artistique web validée.",
    "Hero de référence validé dans son principe.",
    "Image principale du hero sélectionnée.",
    "Copywriting et grille tarifaire déjà verrouillés.",
    "Les dernières maquettes générées ont été rejetées car elles perdaient la direction artistique validée.",
    "Prochaine étape : produire une maquette finale fidèle au brief, puis intégrer la landing page et ses animations.",
  ],
} as const;

export interface ConversationDecisionSeed20260726 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution?: string;
  relatedItemKey?: "homepage" | "artDirection" | "glass" | "visuals";
}

export const CONVERSATION_DECISIONS_2026_07_26: ConversationDecisionSeed20260726[] = [
  {
    question: "Quel est le positionnement final de 24March Studio ?",
    context:
      "Le site s’adresse à des particuliers créatifs. La marque vend une direction artistique d’intérieur digitale, personnelle et forte en image.",
    options: [
      "B2C — direction artistique d’intérieur digitale pour particuliers créatifs",
      "B2B — service pour marques et entreprises",
    ],
    resolution: "B2C — direction artistique d’intérieur digitale pour particuliers créatifs",
    relatedItemKey: "artDirection",
  },
  {
    question: "Quelle direction artistique doit suivre la landing page ?",
    context:
      "Le rendu doit retrouver les maquettes précédemment validées : fond chaud presque blanc, collage premium, éditorial lifestyle et campagne de marque interactive.",
    options: [
      "Fond chaud presque blanc, palette bordeaux/teal/noir/taupe, accents bleu clair et lime, collage éditorial premium",
      "Interface SaaS sombre et minimaliste",
      "Site d’agence d’architecture beige et classique",
    ],
    resolution:
      "Fond chaud presque blanc, palette bordeaux/teal/noir/taupe, accents bleu clair et lime, collage éditorial premium",
    relatedItemKey: "artDirection",
  },
  {
    question: "Quel format doit utiliser le hero de la landing page ?",
    context:
      "Le hero doit être pensé pour un écran desktop large. Les versions verticales ou trop proches d’une page mobile sont refusées.",
    options: [
      "Hero horizontal panoramique : texte à gauche, image centrale, lifestyle à droite",
      "Hero vertical centré",
    ],
    resolution: "Hero horizontal panoramique : texte à gauche, image centrale, lifestyle à droite",
    relatedItemKey: "homepage",
  },
  {
    question: "Quelle typographie doit dominer le hero ?",
    context:
      "Le hero de référence a été validé pour sa présence éditoriale. La police doit avoir plus de caractère que les versions précédentes.",
    options: [
      "Display noire, très condensée et massive, proche d’une grotesque éditoriale",
      "Serif fine et discrète",
      "Sans-serif ronde et légère",
    ],
    resolution: "Display noire, très condensée et massive, proche d’une grotesque éditoriale",
    relatedItemKey: "artDirection",
  },
  {
    question: "Comment intégrer la carte glass dans le hero ?",
    context:
      "La transparence a besoin d’un contenu derrière elle. La carte doit donc chevaucher une zone sombre de l’image, sans conserver une image parasite à l’intérieur de l’animation.",
    options: [
      "Superposer la carte glass sur une zone sombre du hero",
      "Placer la carte sur un fond vide uniforme",
      "Conserver une image fixe dans la carte",
    ],
    resolution: "Superposer la carte glass sur une zone sombre du hero",
    relatedItemKey: "glass",
  },
  {
    question: "Quelle image doit servir de visuel principal au hero ?",
    context:
      "L’image intérieure principale montrée le 26 juillet a été explicitement retenue pour le hero.",
    options: [
      "Utiliser l’image intérieure principale fournie le 26 juillet",
      "Générer une nouvelle image sans référence",
    ],
    resolution: "Utiliser l’image intérieure principale fournie le 26 juillet",
    relatedItemKey: "homepage",
  },
  {
    question: "Quel équilibre photographique doit garder le site ?",
    context:
      "La marque doit montrer les espaces, mais aussi les personnes et leur façon d’y vivre. Un site uniquement composé d’intérieurs paraît trop catalogue.",
    options: ["50 % intérieurs / 50 % lifestyle", "100 % intérieurs", "100 % portraits"],
    resolution: "50 % intérieurs / 50 % lifestyle",
    relatedItemKey: "artDirection",
  },
  {
    question: "Quel système de page est validé pour la landing page ?",
    aliases: ["Quelle structure doit suivre la homepage 24March Studio ?"],
    context:
      "Le brief final fixe dix sections, un process en cinq étapes, cinq pièces mises en avant et cinq profils Cool People. Le copywriting du 25 juillet reste la base.",
    options: [
      "10 sections, process 5 étapes, 5 pièces, 5 Cool People",
      "Revenir à la version courte précédente",
    ],
    resolution: "10 sections, process 5 étapes, 5 pièces, 5 Cool People",
    relatedItemKey: "homepage",
  },
  {
    question: "Quel niveau de réalisme exiger pour les images du site ?",
    context:
      "Les corrections récentes ont montré que les appareils photo, livres, fenêtres et petits objets peuvent trahir une génération IA. Le ratio doit aussi rester intact.",
    options: [
      "Photographies françaises crédibles, zéro artefact visible, objets cohérents, ratio strictement conservé",
      "Accepter quelques détails IA secondaires",
    ],
    resolution:
      "Photographies françaises crédibles, zéro artefact visible, objets cohérents, ratio strictement conservé",
    relatedItemKey: "visuals",
  },
  {
    question: "La maquette visuelle finale de la landing page est-elle validée ?",
    context:
      "Non. Le brief, le copywriting, le hero de référence et la direction artistique sont validés, mais les dernières propositions complètes ont perdu cette DA.",
    options: [
      "Non — refaire une proposition fidèle au brief validé",
      "Oui — passer directement au développement",
    ],
    resolution: "Non — refaire une proposition fidèle au brief validé",
    relatedItemKey: "homepage",
  },
];
