import { PromptModuleContract } from "./types";
import { websiteChainStepIds } from "./website";

/**
 * Module-level prompt contracts (issue #13, section "2. Prompt contracts by
 * module + workflow step"). Only Website is `implemented: true` — it is
 * backed by the full 13-step chain in `website.ts`. Every other module gets
 * an honest, explicit partial stub: real fields, real workflow step mapping,
 * but no chain and `implemented: false`, matching the same "don't fake full
 * implementations" convention already used in
 * lib/responseAnalysis/contracts/stubs.ts for the response-analysis layer.
 */

export const WEBSITE_MODULE_CONTRACT: PromptModuleContract = {
  module: "website",
  workflowStep: "website",
  implemented: true,
  purpose: "Produire, un livrable à la fois, la structure et le copywriting complets d'un site web pour un projet 24March Studio.",
  expectedOutput: "13 livrables (voir website.ts / WEBSITE_CHAIN), chacun validé indépendamment avant de passer au suivant.",
  requiredInputs: ["brandDNA", "brief.projectGoal", "brief.specificContext"],
  optionalInputs: ["brief.references", "brief.constraints", "studioItems"],
  relevantBrandFields: [
    "name",
    "activity",
    "positioning",
    "audience",
    "offer",
    "brandPromise",
    "toneOfVoice",
    "visualDirection",
    "photographyDirection",
    "colors",
    "websiteDirection",
    "avoid",
  ],
  knowledgeDomains: ["structure", "clarity", "text-deliverable", "image-vocabulary", "seo", "brand-fit", "anti-pattern"],
  knowledgeTaskTypes: [
    "positioning",
    "copywriting",
    "information-architecture",
    "cta",
    "faq",
    "seo",
    "ux-writing",
    "image-prompt",
    "consistency-review",
  ],
  defaultTargetModel: "openai-text",
  recommendedBudgetChars: 3200,
  requiredOutputFormat: "Markdown, un ## par livrable, sans placeholder.",
  validationCriteria: ["Voir lib/responseAnalysis/contracts/website.ts (WEBSITE_CONTRACT) — réutilisé tel quel, par sous-ensemble de deliverableIds selon l'étape."],
  nextWorkflowStep: "content",
  retryStrategy: "Chaque étape de la chaîne est retryable indépendamment (voir WEBSITE_CHAIN[].retryStrategy) sans relancer les étapes déjà validées.",
  chainStepIds: websiteChainStepIds(),
};

function partialStub(overrides: Partial<PromptModuleContract> & Pick<PromptModuleContract, "module" | "workflowStep">): PromptModuleContract {
  return {
    implemented: false,
    purpose: "",
    expectedOutput: "",
    requiredInputs: [],
    optionalInputs: [],
    relevantBrandFields: [],
    knowledgeDomains: [],
    knowledgeTaskTypes: ["general-text"],
    defaultTargetModel: "openai-text",
    recommendedBudgetChars: 3200,
    requiredOutputFormat: "Markdown.",
    validationCriteria: ["Non implémenté — analyse générique uniquement (voir lib/responseAnalysis/contracts/stubs.ts)."],
    retryStrategy: "Non implémenté.",
    ...overrides,
  };
}

export const BRAND_MODULE_CONTRACT: PromptModuleContract = partialStub({
  module: "brand",
  workflowStep: "strategy",
  purpose: "Construire/affiner le positionnement de marque (stub — la logique historique vit dans lib/prompts.ts STRATEGY_TEMPLATE).",
  expectedOutput: "Diagnostic, insight, positionnement, promesse, piliers, risques, prochaines actions.",
  requiredInputs: ["brandDNA", "brief.projectGoal"],
  relevantBrandFields: ["name", "activity", "audience", "offer", "positioning", "brandPromise", "messagePillars"],
  knowledgeDomains: ["structure", "clarity", "brand-fit"],
  knowledgeTaskTypes: ["positioning", "general-text"],
  nextWorkflowStep: "creative",
});

export const CREATIVE_MODULE_CONTRACT: PromptModuleContract = partialStub({
  module: "creative",
  workflowStep: "creative",
  purpose: "Traduire la stratégie en territoire visuel (stub — logique historique dans lib/prompts.ts CREATIVE_TEMPLATE).",
  expectedOutput: "Couleurs, lumière, composition, styling, risques créatifs.",
  requiredInputs: ["brandDNA", "brief.specificContext"],
  relevantBrandFields: ["visualDirection", "photographyDirection", "colors"],
  knowledgeDomains: ["image-vocabulary", "brand-fit"],
  knowledgeTaskTypes: ["image-prompt", "general-text"],
  nextWorkflowStep: "website",
});

export const CONTENT_MODULE_CONTRACT: PromptModuleContract = partialStub({
  module: "content",
  workflowStep: "content",
  purpose: "Système éditorial 30 jours (stub — logique historique dans lib/prompts.ts CONTENT_TEMPLATE).",
  expectedOutput: "Piliers, formats, idées, calendrier 30 jours.",
  requiredInputs: ["brandDNA", "brief.channels"],
  relevantBrandFields: ["audience", "offer", "toneOfVoice", "contentDirection"],
  knowledgeDomains: ["text-deliverable"],
  knowledgeTaskTypes: ["copywriting"],
  nextWorkflowStep: "images",
});

export const VISUAL_LAB_MODULE_CONTRACT: PromptModuleContract = partialStub({
  module: "visual-lab",
  workflowStep: "images",
  purpose: "Prompts image de production (stub — logique historique dans lib/prompts.ts IMAGES_TEMPLATE).",
  expectedOutput: "Un brief image complet par besoin visuel + variantes + checklist.",
  requiredInputs: ["brandDNA"],
  relevantBrandFields: ["visualDirection", "photographyDirection", "colors", "imagePromptRules", "avoid"],
  knowledgeDomains: ["image-vocabulary", "anti-pattern"],
  knowledgeTaskTypes: ["image-prompt"],
  defaultTargetModel: "nano-banana-image",
  nextWorkflowStep: "review",
});

export const LAUNCH_MODULE_CONTRACT: PromptModuleContract = partialStub({
  module: "launch",
  workflowStep: "review",
  purpose: "Relecture critique avant diffusion (stub — logique historique dans lib/prompts.ts REVIEW_TEMPLATE). Pas encore de notion de 'launch' dédiée dans le modèle de données actuel (Stage n'a pas d'étape launch séparée) — volontairement non construit ici.",
  expectedOutput: "Verdict, note, points forts, problèmes, statut de validation.",
  requiredInputs: ["review target content"],
  relevantBrandFields: ["positioning", "toneOfVoice", "visualDirection", "avoid"],
  knowledgeDomains: ["anti-pattern", "brand-fit"],
  knowledgeTaskTypes: ["consistency-review"],
});

const CONTRACTS: PromptModuleContract[] = [
  BRAND_MODULE_CONTRACT,
  CREATIVE_MODULE_CONTRACT,
  WEBSITE_MODULE_CONTRACT,
  CONTENT_MODULE_CONTRACT,
  VISUAL_LAB_MODULE_CONTRACT,
  LAUNCH_MODULE_CONTRACT,
];

export function getModulePromptContract(module: PromptModuleContract["module"]): PromptModuleContract {
  const found = CONTRACTS.find((c) => c.module === module);
  if (!found) throw new Error(`Aucun contrat de prompt pour le module "${module}".`);
  return found;
}

export function allModulePromptContracts(): PromptModuleContract[] {
  return CONTRACTS;
}
