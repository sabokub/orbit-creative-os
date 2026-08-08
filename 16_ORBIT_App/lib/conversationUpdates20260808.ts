export const CONVERSATION_UPDATE_2026_08_08 =
  "orbit-hub:migrations:conversation-update-2026-08-08";

export const PROJECT_DIRECTIVE_2026_08_08 = {
  status: "master_directive_active_landing_client_split_locked",
  authority: [
    "Priorité : demande utilisateur actuelle → 00_PROJECT_DIRECTIVE → document spécifique actif → 01_CONSTITUTION_VISUELLE → 06_VISUAL_REFERENCE_LIBRARY → autres documents informatifs.",
    "Tout fichier projet reste dans 02_WEBSITE. Ne pas recréer Website, doublons ou déplacements parallèles.",
    "La règle la plus récente remplace toute règle contradictoire plus ancienne.",
  ],
  landing: [
    "Landing = production directe. Client = workflow client. Ne jamais mélanger les deux.",
    "Commande officielle : Landing 24March — [numéro].",
    "Une commande landing exige une génération d’image réelle dans le même tour.",
    "Pour la landing : aucun workflow client, aucun budget préalable, aucun calcul de rentabilité, aucun sourcing obligatoire, aucun moodboard obligatoire, aucune planche obligatoire, aucune validation intermédiaire, aucun GO/STOP.",
    "08_VISUAL_PRODUCTION_WORKFLOW et 05_CLIENT_BRIEF_SYSTEM ne s’appliquent jamais à la landing.",
    "10_LANDING_VISUAL_CRITERIA et 07_LANDING_IMAGE_GENERATION_PROMPT restent les documents spécifiques landing, sous l’autorité de 00_PROJECT_DIRECTIVE.",
    "Sortie landing : image seule, sans interface, mockup, texte ni logo intégrés ; minimum 2K ; format adapté à la section.",
    "Ne jamais bloquer une landing pour absence de sourcing, moodboard, budget, packshot, planche, rentabilité, stock local, livraison ou code postal.",
    "Fidélité produit exacte uniquement si explicitement demandée ; sans asset exploitable, demander l’image produit au lieu d’inventer.",
  ],
  landingVisualCriteria: [
    "Appartement crédible. Décoration extraordinaire.",
    "Photographique, réaliste, marquant, habitable, cohérent, non générique et exploitable sur le site.",
    "Un élément domine, un accompagne, le reste respire.",
    "Waouh par composition, couleur, motifs, textiles, art, matières, formes et tension visuelle — jamais par prestige immobilier.",
    "Jour : lumière naturelle éditoriale crédible. Nuit : flash direct et léger grand-angle possibles si crédibles.",
    "Interdits : beige sage, Pinterest générique, dopamine décor forcé, luxe froid, showroom, bouclette/sherpa, architecture exceptionnelle utilisée comme waouh, artefacts IA visibles.",
  ],
  clientWorkflow: [
    "08_VISUAL_PRODUCTION_WORKFLOW et 05_CLIENT_BRIEF_SYSTEM restent applicables aux projets clients.",
    "Le client workflow conserve sourcing réel, contrôle budgétaire, fidélité produit, choix technique du rendu et audits.",
    "Le système structure ; le designer arbitre ; le client garde l’autorité sur son quotidien.",
  ],
  clientExperience: [
    "Le brief client doit devenir un parcours immersif plein écran, proche d’une présentation, enregistrable et mettable en pause à tout moment.",
    "Annoncer la durée au début du parcours.",
    "Privilégier les choix visuels et la calibration par images ; éviter de demander au client de connaître des styles de décoration au démarrage.",
    "Les styles/territoires servent au système en interne et apparaissent après calibration si nécessaire, pas comme prérequis de connaissance client.",
    "Éviter le jargon non explicite : clarifier ou remplacer notamment entretien et styling.",
    "Les photos uploadées doivent apparaître visiblement dans les références du projet.",
  ],
  sourcingExperience: [
    "À l’étape de sélection client, afficher une planche visuelle de la sélection ; des liens seuls ne suffisent pas.",
    "Chaque nouveau test ou nouveau client repart d’un sourcing frais selon son brief ; ne jamais recycler silencieusement une sélection d’un test précédent.",
    "Les produits critiques doivent rester traçables et réels pour les projets clients.",
  ],
  routing: [
    "Une capacité moteur non vérifiée ne peut pas être routée comme disponible.",
    "Si Engine Matrix ne contient aucun moteur vérifié pour F2, ROUTE reste BLOCKED.",
    "Action minimale : tester puis enregistrer un moteur F2 avant de poursuivre le routage F2.",
  ],
} as const;

export type StudioUpdateItemKey20260808 =
  | "workflow"
  | "landingDirect"
  | "visuals"
  | "clientExperience"
  | "sourcingVisual"
  | "engineMatrix";

export interface ConversationDecisionSeed20260808 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution: string;
  relatedItemKey?: StudioUpdateItemKey20260808;
}

export const CONVERSATION_DECISIONS_2026_08_08: ConversationDecisionSeed20260808[] = [
  {
    question: "La landing doit-elle suivre le workflow visuel client ?",
    aliases: ["Faut-il appliquer le workflow visuel v1 à la landing ?"],
    context: "00_PROJECT_DIRECTIVE sépare explicitement production landing et workflow client.",
    options: ["Non — landing en génération directe", "Oui — workflow client complet"],
    resolution: "Non — landing en génération directe",
    relatedItemKey: "landingDirect",
  },
  {
    question: "Quel est le cas pilote officiel du workflow visuel ?",
    context: "La règle Hero pilote du 7 août est remplacée pour la landing par la directive master du 7 août.",
    options: ["Aucun gate pilote pour la landing", "Le Hero bloque toute la série"],
    resolution: "Aucun gate pilote pour la landing",
    relatedItemKey: "landingDirect",
  },
  {
    question: "Quand produire les autres visuels landing avec ce workflow ?",
    context: "La série landing ne dépend plus de la validation d’un Hero pilote.",
    options: ["Directement selon la commande Landing 24March — [numéro]", "Après validation du Hero pilote"],
    resolution: "Directement selon la commande Landing 24March — [numéro]",
    relatedItemKey: "visuals",
  },
  {
    question: "Quelles gates peuvent bloquer une commande landing ?",
    context: "La directive master interdit les gates client dans le contexte landing.",
    options: ["Aucune gate client", "Budget + sourcing + moodboard + rentabilité"],
    resolution: "Aucune gate client",
    relatedItemKey: "landingDirect",
  },
  {
    question: "Quel livrable renvoyer pour une commande landing ?",
    context: "La landing attend uniquement l’asset visuel final utilisable sur le site.",
    options: ["Image seule, minimum 2K", "Prompt + moodboard + statut GO/STOP"],
    resolution: "Image seule, minimum 2K",
    relatedItemKey: "visuals",
  },
  {
    question: "Où doivent rester les fichiers projet 24March ?",
    context: "La directive master fixe un dossier unique pour éviter les doublons et divergences.",
    options: ["02_WEBSITE", "Website", "Créer un nouveau dossier par workflow"],
    resolution: "02_WEBSITE",
    relatedItemKey: "workflow",
  },
  {
    question: "Comment doit se présenter le brief client ?",
    context: "Le parcours actuel est trop formulaire et demande trop tôt des connaissances stylistiques au client.",
    options: [
      "Parcours plein écran, visuel, sauvegardable, avec pause et durée annoncée",
      "Formulaire long classique avec styles choisis dès le début",
    ],
    resolution: "Parcours plein écran, visuel, sauvegardable, avec pause et durée annoncée",
    relatedItemKey: "clientExperience",
  },
  {
    question: "Quand demander au client de choisir un style de décoration ?",
    context: "Le client ne doit pas avoir besoin de connaître les catégories stylistiques avant la calibration visuelle.",
    options: ["Après calibration visuelle si utile", "À la création du projet"],
    resolution: "Après calibration visuelle si utile",
    relatedItemKey: "clientExperience",
  },
  {
    question: "Que doit afficher une étape de sélection produits client ?",
    context: "Une liste de liens seule rend la validation lente et abstraite.",
    options: ["Une planche visuelle de la sélection avec les produits", "Uniquement les liens produits"],
    resolution: "Une planche visuelle de la sélection avec les produits",
    relatedItemKey: "sourcingVisual",
  },
  {
    question: "Un nouveau test client peut-il réutiliser silencieusement un sourcing précédent ?",
    context: "Les tests récents ont montré une répétition indésirable du sourcing d’un autre test.",
    options: ["Non — sourcing frais par brief", "Oui — réutiliser la dernière sélection"],
    resolution: "Non — sourcing frais par brief",
    relatedItemKey: "sourcingVisual",
  },
  {
    question: "Que faire si aucun moteur F2 n’est vérifié dans Engine Matrix ?",
    context: "Le routage ne doit jamais inventer une capacité moteur non testée.",
    options: ["Bloquer ROUTE et tester/enregistrer un moteur F2", "Router vers un moteur supposé compatible"],
    resolution: "Bloquer ROUTE et tester/enregistrer un moteur F2",
    relatedItemKey: "engineMatrix",
  },
];
