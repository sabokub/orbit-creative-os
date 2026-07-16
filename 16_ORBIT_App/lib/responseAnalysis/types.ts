import { WorkflowStep } from "../types";

/**
 * Canonical schema for the output of the response-analysis pipeline
 * (`analyzeOrbitResponse`). Both the "Générer avec OpenAI" path and the
 * manual-paste path produce exactly this shape — see lib/responseAnalysis/analyze.ts.
 */

export type AnalysisSource = "openai" | "manual" | "claude" | "other";

export type DocumentType = WorkflowStep | "unknown";

export type DeliverableStatus = "complete" | "partial" | "missing";

export interface DeliverableResult {
  id: string;
  label: string;
  status: DeliverableStatus;
  reasons: string[];
  /** Extracted raw markdown for this deliverable, if a matching section was found. */
  content?: string;
  wordCount?: number;
}

export interface ExtractedSection {
  heading: string;
  level: number;
  content: string;
  wordCount: number;
}

export interface ExtractedCTA {
  text: string;
  vague: boolean;
}

export interface ExtractedFAQItem {
  question: string;
  answer: string;
}

export interface ExtractedSEO {
  metaTitle?: string;
  metaDescription?: string;
  issues: string[];
}

export interface ExtractedImagePrompt {
  section: string;
  prompt: string;
}

export interface ExtractedTask {
  title: string;
  description?: string;
  sourceHeading?: string;
  /** Stable dedupe key derived from normalized title + project + step. */
  dedupeKey: string;
}

export interface ExtractedDecision {
  question: string;
  context?: string;
  options: string[];
}

export interface ExtractedDependency {
  from: string;
  to: string;
}

export type StudioBrainChangeKind =
  | "create_task"
  | "complete_task"
  | "create_decision"
  | "unblock_dependent"
  | "update_deliverable";

export interface StudioBrainChangeProposal {
  id: string;
  kind: StudioBrainChangeKind;
  description: string;
  /** Free-form payload interpreted by lib/responseAnalysis/studioBrainSync.ts */
  payload: Record<string, unknown>;
  /** Whether this change is currently selected for application — user can uncheck before validating. */
  accepted: boolean;
}

export interface ScoreWithIssues {
  score: number;
  issues: string[];
}

export interface AnalysisResult {
  id: string;
  projectId: string;
  workflowStep: WorkflowStep;
  promptId?: string;
  source: AnalysisSource;
  createdAt: string;

  documentType: DocumentType;
  documentTypeConfidence: number;
  matchesExpectedModule: boolean;

  rawResponse: string;
  normalizedResponse: string;
  summary: string;

  completenessScore: number;
  qualityScore: number;
  exploitability: "ready" | "needs_edits" | "not_usable";

  brandCoherence: ScoreWithIssues;
  briefCoherence: ScoreWithIssues;

  semanticAnalysisPerformed: boolean;
  semanticAnalysisError?: string;

  expectedDeliverables: string[];
  detectedDeliverables: DeliverableResult[];
  missingDeliverables: string[];
  partialDeliverables: string[];

  extractedEntities: Record<string, unknown>;
  extractedTasks: ExtractedTask[];
  extractedDecisions: ExtractedDecision[];
  extractedDependencies: ExtractedDependency[];
  extractedContent: ExtractedSection[];
  extractedPages: string[];
  extractedSections: ExtractedSection[];
  extractedCTAs: ExtractedCTA[];
  extractedFAQ: ExtractedFAQItem[];
  extractedSEO: ExtractedSEO | null;
  extractedImageDirections: string[];
  extractedImagePrompts: ExtractedImagePrompt[];

  warnings: string[];
  contradictions: string[];
  placeholders: string[];

  recommendedNextActions: string[];
  proposedStudioBrainChanges: StudioBrainChangeProposal[];
}

export interface AnalyzeOrbitResponseInput {
  projectId: string;
  projectName: string;
  workflowStep: WorkflowStep;
  promptId?: string;
  rawResponse: string;
  source: AnalysisSource;
  /** Expected deliverable ids for this module (from the contract) — allows the caller to override for testing. */
  expectedDeliverables?: string[];
  /** Set true to skip the AI semantic pass even if a key is configured (used by tests / explicit "structural only" mode). */
  skipSemanticAnalysis?: boolean;
}
