import { BrandProfile, ProjectBrief, StudioItem, WorkflowStep } from "../types";
import { PromptTargetModel } from "./knowledge/schema";

/** The three-layer architecture's "module" axis — Website is the only fully implemented one in this PR. */
export const PROMPT_MODULES = ["brand", "creative", "website", "content", "visual-lab", "launch"] as const;
export type PromptModule = (typeof PROMPT_MODULES)[number];

export type TargetModel = PromptTargetModel;

export const PROMPT_SECTION_IDS = [
  "role",
  "objective",
  "currentTask",
  "projectContext",
  "brandDNA",
  "priorDecisions",
  "requiredDeliverable",
  "methodRules",
  "outputStructure",
  "constraints",
  "verificationChecklist",
] as const;
export type PromptSectionId = (typeof PROMPT_SECTION_IDS)[number];

export interface PromptSection {
  id: PromptSectionId;
  title: string;
  content: string;
  charCount: number;
}

export type ContextSourceKind = "brandDNA" | "projectBrief" | "studioBrain" | "priorOutput";

export interface SelectedContextItem {
  key: string;
  label: string;
  value: string;
  source: ContextSourceKind;
  reason: string;
  /** 1 (nice-to-have) - 5 (essential) */
  importance: number;
  estimatedTokens: number;
}

export interface OmittedContextItem extends SelectedContextItem {
  omittedReason: string;
}

export interface SelectedKnowledgeItem {
  id: string;
  title: string;
  sourceDocument: string;
  sourcePageOrSection?: string;
  relevance: number;
  reason: string;
  estimatedTokens: number;
}

export interface BudgetSectionUsage {
  id: PromptSectionId;
  chars: number;
  percentOfTotal: number;
  overBudget: boolean;
  budgetChars?: number;
}

export interface BudgetReport {
  estimatedPromptChars: number;
  estimatedPromptTokens: number;
  maxChars: number;
  maxTokens: number;
  reservedOutputTokens: number;
  status: "within_budget" | "compressed" | "over_budget";
  bySection: BudgetSectionUsage[];
  actionsTaken: string[];
  warnings: string[];
}

export interface QualityScoreDimension {
  id: string;
  label: string;
  score: number;
  max: number;
  explanation: string;
}

export interface QualityReport {
  total: number;
  maxTotal: number;
  dimensions: QualityScoreDimension[];
  deterministic: true;
  semantic?: {
    performed: boolean;
    score?: number;
    error?: string;
  };
}

export type OptimizerSeverity = "info" | "warning" | "critical";

export interface OptimizerWarning {
  id: string;
  severity: OptimizerSeverity;
  message: string;
}

export interface SourceTraceEntry {
  kind: "knowledge" | "brandDNA" | "projectBrief" | "priorOutput" | "studioBrain";
  refId: string;
  label: string;
  note: string;
}

/** Narrows a `Partial<Record<string, string>>` (e.g. Project.websiteChainOutputs) to a plain string-keyed record, dropping undefined entries. */
export function toValidatedOutputsRecord(partial: Partial<Record<string, string>> | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!partial) return result;
  for (const [key, value] of Object.entries(partial)) {
    if (typeof value === "string") result[key] = value;
  }
  return result;
}

export interface PromptBuildInput {
  projectId: string;
  projectName: string;
  module: PromptModule;
  workflowStep: WorkflowStep;
  /** Website chain step id (see contracts/website.ts) — undefined for non-chained modules/steps. */
  chainStepId?: string;
  targetModel: TargetModel;
  userIntent?: string;
  brandDNA: BrandProfile;
  brief: ProjectBrief;
  studioItems?: StudioItem[];
  /** Validated prior outputs, keyed by chain step id (website) or workflow step (other modules). */
  previousValidatedOutputs: Record<string, string>;
  desiredOutputFormat?: string;
  budgetOverride?: Partial<{ maxChars: number; maxEstimatedTokens: number; reservedOutputTokens: number }>;
}

export interface PromptBuildResult {
  builderVersion: string;
  promptVersion: string;
  createdAt: string;
  module: PromptModule;
  workflowStep: WorkflowStep;
  chainStepId?: string;
  targetModel: TargetModel;

  finalPrompt: string;
  sections: PromptSection[];
  selectedContext: SelectedContextItem[];
  omittedContext: OmittedContextItem[];
  selectedKnowledge: SelectedKnowledgeItem[];
  budgetReport: BudgetReport;
  qualityReport: QualityReport;
  warnings: OptimizerWarning[];
  sourceTrace: SourceTraceEntry[];
  nextStep?: string;
}
