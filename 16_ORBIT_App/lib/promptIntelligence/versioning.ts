import { z } from "zod";
import { PromptBuildResult } from "./types";

/**
 * Prompt versioning (issue #13, section 13). Stores, per generation: prompt
 * version, builder version, workflow step, selected knowledge ids, context
 * snapshot ids, budget report, quality score, user edits, generated response
 * reference, outcome status. Never silently overwrites a validated prompt —
 * `appendVersion` always appends; nothing here mutates or deletes a prior
 * record. Comparison is a pure diff over the stored fields.
 *
 * Persistence: records live under `Project.websitePromptChain[stepId]`
 * (see lib/types.ts) — additive to the existing Project model, not a second
 * store.
 */

export type PromptVersionOutcome = "pending" | "accepted" | "rejected" | "superseded";

export interface PromptVersionRecord {
  id: string;
  chainStepId: string;
  promptVersion: string;
  builderVersion: string;
  workflowStep: string;
  targetModel: string;
  selectedKnowledgeIds: string[];
  contextSnapshotKeys: string[];
  budgetStatus: string;
  estimatedPromptChars: number;
  qualityScore: number;
  userEdited: boolean;
  editedPrompt?: string;
  finalPrompt: string;
  generatedResponseRef?: string;
  outcomeStatus: PromptVersionOutcome;
  createdAt: string;
}

function genVersionId(): string {
  return `promptver-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function recordFromBuildResult(
  result: PromptBuildResult,
  extra: { userEdited?: boolean; editedPrompt?: string; generatedResponseRef?: string; outcomeStatus?: PromptVersionOutcome } = {}
): PromptVersionRecord {
  if (!result.chainStepId) {
    throw new Error("recordFromBuildResult requires a chainStepId (Website chain only).");
  }
  return {
    id: genVersionId(),
    chainStepId: result.chainStepId,
    promptVersion: result.promptVersion,
    builderVersion: result.builderVersion,
    workflowStep: result.workflowStep,
    targetModel: result.targetModel,
    selectedKnowledgeIds: result.selectedKnowledge.map((k) => k.id),
    contextSnapshotKeys: result.selectedContext.map((c) => c.key),
    budgetStatus: result.budgetReport.status,
    estimatedPromptChars: result.budgetReport.estimatedPromptChars,
    qualityScore: result.qualityReport.total,
    userEdited: extra.userEdited ?? false,
    editedPrompt: extra.editedPrompt,
    finalPrompt: extra.editedPrompt || result.finalPrompt,
    generatedResponseRef: extra.generatedResponseRef,
    outcomeStatus: extra.outcomeStatus ?? "pending",
    createdAt: new Date().toISOString(),
  };
}

/** Appends a new version to an existing history — never mutates/removes prior records. */
export function appendVersion(history: PromptVersionRecord[], record: PromptVersionRecord): PromptVersionRecord[] {
  return [...history, record];
}

/** Idempotency guard: a version with the same promptVersion already recorded is not appended twice. */
export function appendVersionIdempotent(history: PromptVersionRecord[], record: PromptVersionRecord): { history: PromptVersionRecord[]; appended: boolean } {
  if (history.some((r) => r.promptVersion === record.promptVersion)) {
    return { history, appended: false };
  }
  return { history: appendVersion(history, record), appended: true };
}

export interface PromptVersionDiff {
  chars: { previous: number; next: number; delta: number };
  quality: { previous: number; next: number; delta: number };
  knowledgeAdded: string[];
  knowledgeRemoved: string[];
  contextAdded: string[];
  contextRemoved: string[];
  promptChanged: boolean;
}

export function diffPromptVersions(previous: PromptVersionRecord, next: PromptVersionRecord): PromptVersionDiff {
  const prevKnowledge = new Set(previous.selectedKnowledgeIds);
  const nextKnowledge = new Set(next.selectedKnowledgeIds);
  const prevContext = new Set(previous.contextSnapshotKeys);
  const nextContext = new Set(next.contextSnapshotKeys);

  return {
    chars: { previous: previous.estimatedPromptChars, next: next.estimatedPromptChars, delta: next.estimatedPromptChars - previous.estimatedPromptChars },
    quality: { previous: previous.qualityScore, next: next.qualityScore, delta: next.qualityScore - previous.qualityScore },
    knowledgeAdded: [...nextKnowledge].filter((id) => !prevKnowledge.has(id)),
    knowledgeRemoved: [...prevKnowledge].filter((id) => !nextKnowledge.has(id)),
    contextAdded: [...nextContext].filter((key) => !prevContext.has(key)),
    contextRemoved: [...prevContext].filter((key) => !nextContext.has(key)),
    promptChanged: previous.finalPrompt.trim() !== next.finalPrompt.trim(),
  };
}

export function latestVersion(history: PromptVersionRecord[]): PromptVersionRecord | undefined {
  return history.length > 0 ? history[history.length - 1] : undefined;
}

/**
 * Validates the prompt-build metadata a client sends back alongside a
 * chain-step validation request (POST /api/analyze/apply with
 * chainStepId + promptMeta). Never trusts the client's round-trip blindly —
 * same pattern as `lib/responseAnalysis/schema.ts` parsing `AnalysisResult`.
 */
export const PromptVersionMetaSchema = z.object({
  promptVersion: z.string().min(1).max(120),
  builderVersion: z.string().min(1).max(40),
  targetModel: z.string().min(1).max(60),
  selectedKnowledgeIds: z.array(z.string().max(120)).max(50),
  contextSnapshotKeys: z.array(z.string().max(120)).max(100),
  budgetStatus: z.string().max(40),
  estimatedPromptChars: z.number().min(0).max(1_000_000),
  qualityScore: z.number().min(0).max(100),
  userEdited: z.boolean(),
  editedPrompt: z.string().max(200_000).optional(),
  finalPrompt: z.string().max(200_000),
});

export type PromptVersionMeta = z.infer<typeof PromptVersionMetaSchema>;

export function recordFromMeta(chainStepId: string, workflowStep: string, meta: PromptVersionMeta, generatedResponseRef: string): PromptVersionRecord {
  return {
    id: genVersionId(),
    chainStepId,
    promptVersion: meta.promptVersion,
    builderVersion: meta.builderVersion,
    workflowStep,
    targetModel: meta.targetModel,
    selectedKnowledgeIds: meta.selectedKnowledgeIds,
    contextSnapshotKeys: meta.contextSnapshotKeys,
    budgetStatus: meta.budgetStatus,
    estimatedPromptChars: meta.estimatedPromptChars,
    qualityScore: meta.qualityScore,
    userEdited: meta.userEdited,
    editedPrompt: meta.editedPrompt,
    finalPrompt: meta.editedPrompt || meta.finalPrompt,
    generatedResponseRef,
    outcomeStatus: "accepted",
    createdAt: new Date().toISOString(),
  };
}
