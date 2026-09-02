export const CONVERSATION_UPDATE_2026_09_02 =
  "orbit-hub:migrations:conversation-update-2026-09-02";

export const STUDIO_STATE_2026_09_02 = {
  positioning: [
    "24March Studio est relancé comme service B2C de direction d’intérieur digitale pour particuliers créatifs, pas comme agence B2B, agence 3D ou cabinet d’architecture classique.",
    "Cible prioritaire : 18–35 ans urbains créatifs — créateurs de contenu, freelances, DA, graphistes, photographes, stylistes, tatoueurs et musiciens.",
    "Promesse : « Un intérieur vraiment personnel. Fort à vivre. Fort en image. »",
    "Signature : « Cool people live here. »",
  ],
  landingGovernance: [
    "00_PROJECT_DIRECTIVE est l’autorité projet après la demande utilisateur courante.",
    "Landing = production directe ; workflow client séparé.",
    "Pour la landing, appliquer 10_LANDING_VISUAL_CRITERIA et 07_LANDING_IMAGE_GENERATION_PROMPT uniquement dans les limites fixées par 00_PROJECT_DIRECTIVE.",
    "Ne pas appliquer 08_VISUAL_PRODUCTION_WORKFLOW ni 05_CLIENT_BRIEF_SYSTEM à la landing.",
    "Aucun sourcing, budget, moodboard, packshot ou validation GO/STOP ne doit bloquer une génération landing.",
    "Une commande landing exige une image réelle produite dans le même tour ; jamais un prompt textuel ou un faux statut à la place.",
    "Image seule : pas d’interface, mockup, texte ou logo intégrés ; minimum 2K.",
    "Règle visuelle centrale : appartement crédible, décoration extraordinaire ; un élément domine, un accompagne, le reste respire.",
  ],
  visualBenchmark: [
    "Benchmark visuel actif : V03 — T04, Golden R023, binding REAL_REF.",
    "Série STYLE_DIRECTION avancée jusqu’à STYLE_DIRECTION_36 — COMPOSITION AUTHORITY.",
    "Protocole strict : une image par test, référence réelle obligatoire, architecture ordinaire, pas de reroll aveugle.",
    "R023 transmet le niveau de sélection, la tension graphique, la personnalité et l’étrangeté maîtrisée ; ne pas copier littéralement son contenu.",
    "Blacklist active : canapé bouclé/sherpa/blob/galet, tasseaux, art abstrait générique, livres Kinfolk, cheminée marbre, architecture spectaculaire et backplates Paris.",
  ],
  website: [
    "Repo site de référence : sabokub/24march-studio-site, branche main.",
    "La homepage reste en finition et n’atteint pas encore le niveau Awwwards visé.",
    "Bloc Les Cool People : cinq cartes doivent rester visibles ; le cinquième personnage ne doit pas disparaître.",
    "Kit créatif : les cartes arrière doivent rester lisibles et devenir réellement interactives plutôt qu’un simple empilement statique.",
    "Navigation : corriger la barre qui disparaît quand la page revient tout en haut.",
    "Le flou résiduel du hero provenait d’une source 1672×941 agrandie ; cible HD recommandée 3440×1936.",
  ],
  commerce: [
    "Domaine officiel validé : 24march.fr chez Infomaniak.",
    "Stripe est branché.",
    "Prix actuellement codés pour les six pièces : 229 / 229 / 229 / 259 / 229 / 289 €.",
    "Plafond public validé : 399 € par pièce.",
    "La page /waitlist existe mais sa readiness de lancement reste à surveiller.",
  ],
  relaunch: [
    "Relance full digital prévue en septembre 2026.",
    "Aucune nouvelle date publique exacte de lancement n’est verrouillée dans les décisions disponibles au 2 septembre.",
    "Priorité actuelle : terminer le polish site, la readiness waitlist et le système visuel avant ouverture publique.",
  ],
} as const;

export type StudioUpdateItemKey20260902 =
  | "brandBrain"
  | "landingGovernance"
  | "visualBenchmark"
  | "homepage"
  | "domain"
  | "pricing"
  | "payment"
  | "waitlist"
  | "launch";

export interface ConversationDecisionSeed20260902 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution: string;
  relatedItemKey?: StudioUpdateItemKey20260902;
}

export const CONVERSATION_DECISIONS_2026_09_02: ConversationDecisionSeed20260902[] = [
  {
    question: "Quel est le positionnement actif de 24March Studio ?",
    context: "Le studio a été recentré sur une offre digitale destinée aux particuliers créatifs.",
    options: ["B2C direction d’intérieur digitale", "Agence B2B / 3D", "Cabinet d’architecture classique"],
    resolution: "B2C direction d’intérieur digitale",
    relatedItemKey: "brandBrain",
  },
  {
    question: "Le workflow client s’applique-t-il aux visuels landing ?",
    context: "00_PROJECT_DIRECTIVE sépare explicitement la landing de la production client.",
    options: ["Non, landing = génération directe", "Oui, workflow client complet"],
    resolution: "Non, landing = génération directe",
    relatedItemKey: "landingGovernance",
  },
  {
    question: "Quel est le binding du benchmark visuel courant ?",
    context: "Les derniers tests STYLE_DIRECTION utilisent une référence Golden réelle et verrouillée.",
    options: ["V03 — T04 / R023 / REAL_REF", "TEXT_PROXY", "Référence libre"],
    resolution: "V03 — T04 / R023 / REAL_REF",
    relatedItemKey: "visualBenchmark",
  },
  {
    question: "Quelle STYLE_DIRECTION est la plus récente ?",
    context: "La série d’itérations sur V03 — T04 / R023 continue après le baseline initial.",
    options: ["STYLE_DIRECTION_36 — COMPOSITION AUTHORITY", "STYLE_DIRECTION_22", "STYLE_DIRECTION_10"],
    resolution: "STYLE_DIRECTION_36 — COMPOSITION AUTHORITY",
    relatedItemKey: "visualBenchmark",
  },
  {
    question: "Quel est le domaine officiel du studio ?",
    context: "Le domaine .com n’est plus la cible opérationnelle.",
    options: ["24march.fr", "24marchstudio.com", "24marchstudio.fr"],
    resolution: "24march.fr",
    relatedItemKey: "domain",
  },
  {
    question: "Quel est le plafond public validé par pièce ?",
    context: "La grille actuelle reste sous un plafond public unique.",
    options: ["399 €", "499 €", "Aucun plafond"],
    resolution: "399 €",
    relatedItemKey: "pricing",
  },
  {
    question: "Quels défauts homepage sont prioritaires au 2 septembre ?",
    context: "La finition actuelle reste sous le niveau Awwwards visé.",
    options: [
      "5e Cool People invisible + cartes Kit créatif peu lisibles + navbar qui disparaît en haut",
      "Refonte complète du positionnement",
      "Suppression des interactions",
    ],
    resolution: "5e Cool People invisible + cartes Kit créatif peu lisibles + navbar qui disparaît en haut",
    relatedItemKey: "homepage",
  },
  {
    question: "Quel est le statut du paiement en ligne ?",
    context: "Le paiement a déjà été intégré au site.",
    options: ["Stripe branché", "À sélectionner", "Paiement manuel uniquement"],
    resolution: "Stripe branché",
    relatedItemKey: "payment",
  },
  {
    question: "Quand la relance full digital est-elle prévue ?",
    context: "L’ancienne échéance de fin août est dépassée et aucune nouvelle date publique exacte n’est verrouillée.",
    options: ["Septembre 2026, date exacte non verrouillée", "31 août 2026", "2027"],
    resolution: "Septembre 2026, date exacte non verrouillée",
    relatedItemKey: "launch",
  },
];
