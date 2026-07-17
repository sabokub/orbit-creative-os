import { WebsiteChainStep } from "./types";

/**
 * The Website prompt chain — the core deliverable of this PR. Replaces the
 * single monolithic `WEBSITE_TEMPLATE` (lib/prompts.ts) with 13 focused
 * steps, in the same order as that template's numbered list, each one
 * producing one coherent deliverable (step 6 groups two closely related
 * deliverables — offers + proof — per the issue's own suggested grouping).
 *
 * Each step's `deliverableIds` are exactly the ids used in
 * `lib/responseAnalysis/contracts/website.ts` (`WEBSITE_CONTRACT`), so a
 * step's response can be validated by calling the existing
 * `analyzeOrbitResponse({ workflowStep: "website", expectedDeliverables:
 * step.deliverableIds, ... })` — no fork of the analysis pipeline.
 */
export const WEBSITE_CHAIN: WebsiteChainStep[] = [
  {
    id: "website-positioning",
    order: 1,
    title: "Positionnement web",
    purpose: "Traduire le positionnement de marque en positionnement spécifique au site web du projet.",
    deliverableIds: ["positioning-web"],
    requiredBrandFields: ["name", "activity", "positioning", "audience", "offer"],
    dependsOnSteps: [],
    knowledgeDomains: ["structure", "clarity", "brand-fit"],
    knowledgeTaskTypes: ["positioning", "general-text"],
    targetModel: "openai-text",
    recommendedBudgetChars: 3200,
    outputFormatHint: "Markdown, un seul ## Positionnement web, 150-300 mots.",
    validationCriteria: ["Section non vide, non placeholder, >= 200 caractères (voir WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo avec rappel de longueur minimale si le livrable précédent était trop court.",
  },
  {
    id: "hero-promise",
    order: 2,
    title: "Promesse du hero",
    purpose: "Formuler la promesse affichée dans le hero de la homepage, alignée sur le positionnement validé.",
    deliverableIds: ["hero-promise"],
    requiredBrandFields: ["brandPromise", "toneOfVoice", "audience"],
    dependsOnSteps: ["website-positioning"],
    knowledgeDomains: ["clarity", "text-deliverable"],
    knowledgeTaskTypes: ["copywriting", "general-text"],
    targetModel: "openai-text",
    recommendedBudgetChars: 2000,
    outputFormatHint: "Markdown, un seul ## Promesse du hero, 1-2 phrases + 2-3 variantes.",
    validationCriteria: ["Promesse non vide, non placeholder (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo — n'affecte pas le positionnement déjà validé.",
  },
  {
    id: "sitemap",
    order: 3,
    title: "Arborescence",
    purpose: "Définir la liste des pages du site à partir du positionnement et de l'offre.",
    deliverableIds: ["sitemap"],
    requiredBrandFields: ["offer", "audience"],
    dependsOnSteps: ["website-positioning"],
    knowledgeDomains: ["structure"],
    knowledgeTaskTypes: ["information-architecture"],
    targetModel: "openai-text",
    recommendedBudgetChars: 2200,
    outputFormatHint: "Markdown, liste à puces, une page par ligne, minimum 3 pages.",
    validationCriteria: [">= 3 entrées listées (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo avec rappel de format liste si une prose a été produite au lieu d'une liste.",
  },
  {
    id: "homepage-ia",
    order: 4,
    title: "Structure de la homepage",
    purpose: "Définir l'architecture des sections de la page d'accueil.",
    deliverableIds: ["homepage-structure"],
    requiredBrandFields: ["offer", "positioning"],
    dependsOnSteps: ["website-positioning", "hero-promise", "sitemap"],
    knowledgeDomains: ["structure"],
    knowledgeTaskTypes: ["information-architecture"],
    targetModel: "openai-text",
    recommendedBudgetChars: 3200,
    outputFormatHint: "Markdown, liste ordonnée de sections avec un rôle en une phrase pour chacune.",
    validationCriteria: [">= 3 sections listées ou description substantielle (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo.",
  },
  {
    id: "section-copywriting",
    order: 5,
    title: "Copywriting de chaque section",
    purpose: "Rédiger le texte complet de chaque section de la homepage définie à l'étape précédente.",
    deliverableIds: ["section-copywriting"],
    requiredBrandFields: ["toneOfVoice", "audience", "avoid"],
    dependsOnSteps: ["homepage-ia", "hero-promise"],
    knowledgeDomains: ["text-deliverable", "clarity"],
    knowledgeTaskTypes: ["copywriting"],
    targetModel: "openai-text",
    recommendedBudgetChars: 4200,
    outputFormatHint: "Markdown, un sous-titre ### par section de la homepage, texte complet sans placeholder.",
    validationCriteria: [">= 400 caractères au total (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo — le plus susceptible de dépasser le budget, surveiller la compression.",
  },
  {
    id: "offers-and-proof",
    order: 6,
    title: "Offres et éléments de preuve",
    purpose: "Reformuler les offres pour le web et lister les éléments de preuve (témoignages, résultats, garanties).",
    deliverableIds: ["offers-web", "proof-elements"],
    requiredBrandFields: ["offer", "successCriteria"],
    dependsOnSteps: ["website-positioning"],
    knowledgeDomains: ["text-deliverable"],
    knowledgeTaskTypes: ["copywriting"],
    targetModel: "openai-text",
    recommendedBudgetChars: 3000,
    outputFormatHint: "Markdown, ## Offres reformulées pour le web puis ## Éléments de preuve.",
    validationCriteria: ["Les deux sections présentes et substantielles (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo, groupe cohérent — ne re-génère pas le positionnement.",
  },
  {
    id: "ctas",
    order: 7,
    title: "Appels à l'action",
    purpose: "Produire les CTA principaux et secondaires du site.",
    deliverableIds: ["ctas"],
    requiredBrandFields: ["toneOfVoice"],
    dependsOnSteps: ["offers-and-proof", "hero-promise"],
    knowledgeDomains: ["text-deliverable", "clarity"],
    knowledgeTaskTypes: ["cta"],
    targetModel: "openai-text",
    recommendedBudgetChars: 1600,
    outputFormatHint: "Markdown, liste d'au moins 2 CTA nommant l'action et le résultat.",
    validationCriteria: [">= 2 CTA détectés, pas tous vagues (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo avec rappel anti-CTA-vague si tous les CTA précédents étaient vagues.",
  },
  {
    id: "faq",
    order: 8,
    title: "FAQ",
    purpose: "Anticiper 5 à 8 objections/questions fréquentes avec réponses complètes.",
    deliverableIds: ["faq"],
    requiredBrandFields: ["offer", "audience"],
    dependsOnSteps: ["offers-and-proof"],
    knowledgeDomains: ["text-deliverable"],
    knowledgeTaskTypes: ["faq"],
    targetModel: "openai-text",
    recommendedBudgetChars: 3200,
    outputFormatHint: "Markdown, 5 à 8 paires question/réponse.",
    validationCriteria: [">= 5 paires Q/R détectées (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo.",
  },
  {
    id: "seo-basics",
    order: 9,
    title: "Bases SEO",
    purpose: "Produire un meta title et une meta description exploitables.",
    deliverableIds: ["seo-basics"],
    requiredBrandFields: ["positioning", "audience"],
    dependsOnSteps: ["website-positioning", "hero-promise"],
    knowledgeDomains: ["seo"],
    knowledgeTaskTypes: ["seo"],
    targetModel: "openai-text",
    recommendedBudgetChars: 1200,
    outputFormatHint: "Markdown, 'Meta title : ...' puis 'Meta description : ...'.",
    validationCriteria: ["Meta title et meta description tous deux présents (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo, budget le plus faible de la chaîne.",
  },
  {
    id: "ux-writing",
    order: 10,
    title: "Ton UX writing",
    purpose: "Définir le ton des micro-textes d'interface (boutons, messages, formulaires).",
    deliverableIds: ["ux-writing-tone"],
    requiredBrandFields: ["toneOfVoice"],
    dependsOnSteps: ["section-copywriting"],
    knowledgeDomains: ["text-deliverable"],
    knowledgeTaskTypes: ["ux-writing"],
    targetModel: "openai-text",
    recommendedBudgetChars: 1600,
    outputFormatHint: "Markdown, description du ton + 3-5 exemples de micro-textes.",
    validationCriteria: [">= 80 caractères (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo.",
  },
  {
    id: "hero-image-direction",
    order: 11,
    title: "Direction de l'image hero",
    purpose: "Décrire la direction de l'image principale du site.",
    deliverableIds: ["hero-image-direction"],
    requiredBrandFields: ["visualDirection", "photographyDirection", "colors", "avoid"],
    dependsOnSteps: ["website-positioning", "hero-promise"],
    knowledgeDomains: ["image-vocabulary", "brand-fit"],
    knowledgeTaskTypes: ["image-prompt"],
    targetModel: "nano-banana-image",
    recommendedBudgetChars: 2600,
    outputFormatHint: "Markdown, sujet/environnement/lumière/matières/caméra/format/contraintes négatives.",
    validationCriteria: [">= 80 caractères, non placeholder (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo.",
  },
  {
    id: "section-image-prompts",
    order: 12,
    title: "Prompts image par section",
    purpose: "Produire un prompt image par section de la homepage, cohérent avec l'image hero.",
    deliverableIds: ["section-image-prompts"],
    requiredBrandFields: ["visualDirection", "photographyDirection", "avoid"],
    dependsOnSteps: ["hero-image-direction", "homepage-ia"],
    knowledgeDomains: ["image-vocabulary"],
    knowledgeTaskTypes: ["image-prompt"],
    targetModel: "nano-banana-image",
    recommendedBudgetChars: 3600,
    outputFormatHint: "Markdown, un prompt par section listée à l'étape 'Structure de la homepage'.",
    validationCriteria: [">= 3 prompts détectés (WEBSITE_CONTRACT)."],
    retryStrategy: "Retry solo.",
  },
  {
    id: "consistency-review",
    order: 13,
    title: "Revue de cohérence finale",
    purpose:
      "Relire l'ensemble des 12 livrables validés précédents et signaler toute incohérence de ton, de promesse ou de direction visuelle avant la mise en production.",
    deliverableIds: [],
    requiredBrandFields: ["positioning", "toneOfVoice", "visualDirection", "avoid"],
    dependsOnSteps: [
      "website-positioning",
      "hero-promise",
      "sitemap",
      "homepage-ia",
      "section-copywriting",
      "offers-and-proof",
      "ctas",
      "faq",
      "seo-basics",
      "ux-writing",
      "hero-image-direction",
      "section-image-prompts",
    ],
    knowledgeDomains: ["brand-fit", "anti-pattern"],
    knowledgeTaskTypes: ["consistency-review"],
    targetModel: "claude-text",
    recommendedBudgetChars: 4000,
    outputFormatHint: "Markdown, liste des incohérences détectées classées par gravité, ou confirmation explicite qu'aucune n'a été trouvée.",
    validationCriteria: ["Cette étape n'a pas de contrat de livrable dédié — elle est notée par la revue humaine, pas par analyzeOrbitResponse."],
    retryStrategy: "Retry solo — ne modifie aucun des 12 livrables, produit uniquement une critique.",
  },
];

/**
 * Canonical Markdown heading text for each deliverable id, matching the
 * labels in lib/responseAnalysis/contracts/website.ts (WEBSITE_CONTRACT).
 * Instructing the model to use these exact headings keeps the generated
 * response parseable by `findMatchingSection`'s fuzzy fold-match without any
 * change to the existing analysis pipeline.
 */
export const WEBSITE_DELIVERABLE_HEADINGS: Record<string, string> = {
  "positioning-web": "Positionnement web",
  "hero-promise": "Promesse du hero",
  sitemap: "Arborescence",
  "homepage-structure": "Structure de la homepage",
  "section-copywriting": "Copywriting de chaque section",
  ctas: "Appels à l’action",
  "proof-elements": "Éléments de preuve",
  "offers-web": "Offres reformulées pour le web",
  faq: "FAQ (5 à 8 questions-réponses)",
  "hero-image-direction": "Direction de l’image hero",
  "section-image-prompts": "Prompts image par section",
  "seo-basics": "Bases SEO",
  "ux-writing-tone": "Ton UX writing",
};

export function getWebsiteChainStep(id: string): WebsiteChainStep | undefined {
  return WEBSITE_CHAIN.find((step) => step.id === id);
}

export function websiteChainStepIds(): string[] {
  return WEBSITE_CHAIN.map((s) => s.id);
}

export function nextWebsiteChainStepId(currentId: string): string | undefined {
  const idx = WEBSITE_CHAIN.findIndex((s) => s.id === currentId);
  if (idx === -1 || idx === WEBSITE_CHAIN.length - 1) return undefined;
  return WEBSITE_CHAIN[idx + 1].id;
}
