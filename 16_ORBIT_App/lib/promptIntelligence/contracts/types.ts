import { BrandProfile, WorkflowStep } from "../../types";
import { PromptKnowledgeDomain, PromptTargetModel, PromptTaskType } from "../knowledge/schema";
import { PromptModule } from "../types";

/**
 * A module-level prompt contract: purpose, expected output, required/optional
 * inputs, relevant context, target model, budget, output format, validation
 * criteria, next step and retry strategy. Per the issue's scope control,
 * only Website (`contracts/website.ts`) is fully implemented — every other
 * module contract here is an honest partial stub (`implemented: false`).
 */
export interface PromptModuleContract {
  module: PromptModule;
  workflowStep: WorkflowStep;
  implemented: boolean;
  purpose: string;
  expectedOutput: string;
  requiredInputs: string[];
  optionalInputs: string[];
  relevantBrandFields: (keyof BrandProfile)[];
  knowledgeDomains: PromptKnowledgeDomain[];
  knowledgeTaskTypes: PromptTaskType[];
  defaultTargetModel: PromptTargetModel;
  recommendedBudgetChars: number;
  requiredOutputFormat: string;
  validationCriteria: string[];
  nextWorkflowStep?: WorkflowStep;
  retryStrategy: string;
  /** Present only for modules with a fully implemented step-by-step chain (Website). */
  chainStepIds?: string[];
}

/**
 * A single step in the Website prompt chain. Each step maps 1:1 (or grouped)
 * onto the deliverable ids already defined in
 * lib/responseAnalysis/contracts/website.ts (`WEBSITE_CONTRACT`) — this is
 * intentional so the existing `analyzeOrbitResponse` pipeline can validate a
 * single step's response by passing just that step's deliverable ids as
 * `expectedDeliverables`, with zero changes to the analysis pipeline itself.
 */
export interface WebsiteChainStep {
  id: string;
  order: number;
  title: string;
  purpose: string;
  /** Deliverable ids from lib/responseAnalysis/contracts/website.ts this step is responsible for ("" for the final review step, which has no single-deliverable contract). */
  deliverableIds: string[];
  requiredBrandFields: (keyof BrandProfile)[];
  /** Prior chain step ids whose validated output is relevant context for this step. */
  dependsOnSteps: string[];
  knowledgeDomains: PromptKnowledgeDomain[];
  knowledgeTaskTypes: PromptTaskType[];
  targetModel: PromptTargetModel;
  recommendedBudgetChars: number;
  outputFormatHint: string;
  validationCriteria: string[];
  retryStrategy: string;
}
