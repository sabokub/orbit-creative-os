export const CONVERSATION_UPDATE_2026_08_07 =
  "orbit-hub:migrations:conversation-update-2026-08-07";

export const VISUAL_SYSTEM_2026_08_07 = {
  status: "visual_workflow_v1_approved_hero_pilot_active",
  authority: [
    "La décision explicite la plus récente gagne.",
    "Pour la production visuelle : 01_CONSTITUTION_VISUELLE, 06_VISUAL_REFERENCE_LIBRARY, 07_LANDING_IMAGE_GENERATION_PROMPT, 05_CLIENT_BRIEF_SYSTEM puis 08_VISUAL_PRODUCTION_WORKFLOW.",
    "Le système recommande ; le designer arbitre.",
  ],
  core: [
    "Appartement crédible. Décoration extraordinaire.",
    "Le waouh vient de la direction artistique, jamais du prestige immobilier.",
    "Un élément domine, un accompagne, le reste respire.",
    "Tout meuble important existe réellement, reste traçable et respecte sa silhouette réelle.",
  ],
  economics: [
    "Panier cible par pièce : 1 800 € ; plage normale : 1 200 à 2 500 €.",
    "Conserver 30 à 50 % d’existant plausible et une seule pièce signature maximum.",
    "Avant design : calculer prix vendu, marge cible, coût horaire, coût IA et révisions incluses.",
    "Budget production maximal = prix vendu × (1 − marge cible).",
    "Temps maximal = (budget production maximal − coûts IA) ÷ coût horaire interne.",
  ],
  sourcing: [
    "Limiter la scène à 5–8 produits majeurs.",
    "Pour chaque produit : nom exact, fournisseur, lien, dimensions, couleur, matériau, prix actuel, disponibilité, livraison France, date de vérification, packshot et alternative.",
    "Aucun produit fictif, hybride ou physiquement impossible.",
  ],
  workflow: [
    "Étape 0 : gate rentabilité.",
    "Étape 1 : cadrage — 12 min maximum.",
    "Étape 2 : sourcing exact — 30 min maximum.",
    "Étape 3 : moodboard décisionnel — 15 min maximum.",
    "Étape 4 : prompt final verrouillé — 10 min maximum, zéro nouvelle idée.",
    "Étape 5 : génération — trois essais maximum : principal, correction ciblée, secours.",
    "Étape 6 : audit — 8 min maximum.",
    "Étape 7 : archive et apprentissage — 5 min.",
    "Temps cible complet : 85 minutes par visuel.",
  ],
  modularSkills: [
    "07_WORKFLOW_ORCHESTRATOR pilote désormais la séquence.",
    "Séquence active : enveloppe projet → brief vers concept → sourcing-moodboard → budget complet → validation explicite → choix technique du rendu → production → audit waouh → audit fidélité produits → contrôle rentabilité.",
    "Aucun rendu avant validation explicite de la planche sourcée et du budget produits.",
    "Après génération : exécuter 04_SKILL_WOW_AUDIT, 05_SKILL_PRODUCT_FIDELITY et 06_SKILL_PROFITABILITY_TIME.",
  ],
  generationRules: [
    "Aucun reroll aveugle.",
    "Après trois échecs : STOP, diagnostiquer et revenir à l’étape fautive.",
    "Produit halluciné : packshot, compositing ou 3D.",
    "Composition incorrecte : retour cadrage.",
    "Direction artistique incorrecte : retour moodboard.",
    "Produit incorrect ou hors budget : retour sourcing.",
    "Lumière incorrecte : éditer l’image existante.",
    "Détail mineur : retouche locale.",
  ],
  audit: [
    "Auditer marque, waouh, projection, architecture, mobilier, matières, palette, hiérarchie, budget et désirabilité.",
    "Verdicts autorisés : VALIDER, ÉDITER, REVOIR/RETOUR MOODBOARD, RETOUR SOURCING ou ARRÊTER/ABANDONNER.",
    "Une image presque bonne n’est pas validée.",
  ],
  landing: [
    "Image finale seule : aucun mockup site, texte, logo ou interface intégrés.",
    "Définition finale minimum 2K, netteté forte, export web exploitable.",
    "Ordre : Hero, Polaroïd, six capsules pièces, bandeau Ta pièce mais en mieux, cinq Cool People, Lifestyle final.",
    "Jour : lumière naturelle éditoriale crédible, aucun flash forcé.",
    "Nuit : flash direct et léger grand-angle possibles si crédibles.",
  ],
  heroPilot: [
    "Le Hero est le cas pilote officiel du workflow.",
    "Le pilote passe si : budget tenu, maximum trois générations, aucun mobilier majeur inventé, temps total inférieur à 85 minutes, audit conforme et qualité visuelle validée.",
    "Après validation du Hero, dupliquer la méthode sur les autres visuels landing.",
  ],
  clientBrief: [
    "Client Brief System v1.1 approuvé.",
    "Quatre territoires : Héritage réinventé, Modernisme sculptural, Éclectisme graphique, Collectionneur chaleureux.",
    "Six facteurs notés 1–5 : contraste, couleur, motifs, formes, époques, densité ; chacun reçoit importance, certitude et justification.",
    "Une direction dominante ; influence secondaire possible ; jamais quatre territoires mélangés à parts égales.",
    "Séparer profil esthétique et profil pratique ; signaler les contradictions sans décision automatique.",
    "Créer Profil client V1 après validation et versionner toute modification.",
  ],
} as const;

export type StudioUpdateItemKey20260807 =
  | "workflow"
  | "heroPilot"
  | "visuals"
  | "clientBrief";

export interface ConversationDecisionSeed20260807 {
  question: string;
  aliases?: string[];
  context: string;
  options: string[];
  resolution: string;
  relatedItemKey?: StudioUpdateItemKey20260807;
}

export const CONVERSATION_DECISIONS_2026_08_07: ConversationDecisionSeed20260807[] = [
  {
    question: "Quelle est la première gate du workflow visuel ?",
    context: "La rentabilité est contrôlée avant toute décision de design.",
    options: ["Gate rentabilité avant design", "Cadrage créatif directement"],
    resolution: "Gate rentabilité avant design",
    relatedItemKey: "workflow",
  },
  {
    question: "Quelle séquence pilote désormais la production visuelle ?",
    aliases: ["Que faut-il valider avant toute génération finale ?"],
    context: "La version approuvée ajoute un orchestrateur modulaire et des gates explicites avant rendu.",
    options: [
      "Enveloppe projet → concept → sourcing-moodboard → budget → validation → choix technique → production → audits",
      "Shopping list puis moodboard puis génération libre",
    ],
    resolution: "Enveloppe projet → concept → sourcing-moodboard → budget → validation → choix technique → production → audits",
    relatedItemKey: "workflow",
  },
  {
    question: "Quand un rendu peut-il être lancé ?",
    context: "Le rendu reste bloqué tant que la planche sourcée et le budget produits ne sont pas validés explicitement.",
    options: [
      "Après validation explicite de la planche sourcée et du budget",
      "Dès qu’un concept paraît prometteur",
    ],
    resolution: "Après validation explicite de la planche sourcée et du budget",
    relatedItemKey: "workflow",
  },
  {
    question: "Combien de produits majeurs sourcer par scène ?",
    context: "Le sourcing court limite la complexité et améliore la fidélité produit.",
    options: ["5 à 8 produits majeurs", "Autant que nécessaire sans plafond"],
    resolution: "5 à 8 produits majeurs",
    relatedItemKey: "workflow",
  },
  {
    question: "Quel cadre budgétaire sert de référence par pièce ?",
    context: "Le budget réel client reste prioritaire, mais les visuels du site utilisent un cadre commun de projection.",
    options: [
      "1 800 € cible, 1 200–2 500 €, 30–50 % d’existant, une pièce signature maximum",
      "Budget premium libre sans plafond",
    ],
    resolution: "1 800 € cible, 1 200–2 500 €, 30–50 % d’existant, une pièce signature maximum",
    relatedItemKey: "workflow",
  },
  {
    question: "Combien de générations maximum autoriser par visuel ?",
    context: "Le workflow interdit les rerolls infinis et impose un diagnostic après échec.",
    options: ["Trois générations maximum", "Aucune limite si le résultat progresse"],
    resolution: "Trois générations maximum",
    relatedItemKey: "workflow",
  },
  {
    question: "Quel temps cible complet utiliser par visuel ?",
    context: "Le workflow approuvé chiffre chaque étape et impose un plafond global de production.",
    options: ["85 minutes", "Deux heures", "Pas de temps cible"],
    resolution: "85 minutes",
    relatedItemKey: "workflow",
  },
  {
    question: "Quel est le cas pilote officiel du workflow visuel ?",
    context: "La méthode doit être éprouvée sur le premier visuel de marque avant duplication.",
    options: ["Le Hero de la landing page", "Une capsule choisie au hasard"],
    resolution: "Le Hero de la landing page",
    relatedItemKey: "heroPilot",
  },
  {
    question: "Quand produire les autres visuels landing avec ce workflow ?",
    context: "Le Hero sert de preuve de méthode avant déploiement à la série complète.",
    options: ["Après validation du Hero pilote", "En parallèle sans attendre le pilote"],
    resolution: "Après validation du Hero pilote",
    relatedItemKey: "visuals",
  },
  {
    question: "Comment structurer le profil esthétique client ?",
    context: "Le Client Brief System v1.1 remplace les étiquettes de style rigides par territoires et facteurs mesurés.",
    options: [
      "Un territoire dominant, influence secondaire possible, six facteurs notés et qualifiés",
      "Un style unique attribué automatiquement",
    ],
    resolution: "Un territoire dominant, influence secondaire possible, six facteurs notés et qualifiés",
    relatedItemKey: "clientBrief",
  },
  {
    question: "Qui conserve l’autorité créative dans le Client Brief System ?",
    context: "Les scores structurent les décisions mais ne remplacent jamais le jugement professionnel.",
    options: ["Le designer arbitre", "Le score décide automatiquement"],
    resolution: "Le designer arbitre",
    relatedItemKey: "clientBrief",
  },
];
