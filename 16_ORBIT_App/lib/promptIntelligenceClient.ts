"use client";

import { WebsiteChainStep } from "./promptIntelligence/contracts/types";
import { PromptBuildResult, TargetModel } from "./promptIntelligence/types";
import { PromptVersionRecord } from "./promptIntelligence/versioning";

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `La requête a échoué (${res.status})`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return body as T;
}

export interface ChainStepWithState extends WebsiteChainStep {
  hasValidatedOutput: boolean;
  versionHistory: PromptVersionRecord[];
}

export async function fetchWebsiteChain(projectId: string): Promise<ChainStepWithState[]> {
  const res = await fetch(`/api/prompt-intelligence/chain?projectId=${encodeURIComponent(projectId)}`, { cache: "no-store" });
  const body = await parse<{ steps: ChainStepWithState[] }>(res);
  return body.steps;
}

export interface BuildPromptRequest {
  projectId: string;
  chainStepId: string;
  targetModel: TargetModel;
  userIntent?: string;
  desiredOutputFormat?: string;
}

export async function buildWebsitePrompt(req: BuildPromptRequest): Promise<PromptBuildResult> {
  const res = await fetch("/api/prompt-intelligence/build", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const body = await parse<{ result: PromptBuildResult }>(res);
  return body.result;
}

export function promptMetaFromBuildResult(result: PromptBuildResult, editedPrompt?: string) {
  return {
    promptVersion: result.promptVersion,
    builderVersion: result.builderVersion,
    targetModel: result.targetModel,
    selectedKnowledgeIds: result.selectedKnowledge.map((k) => k.id),
    contextSnapshotKeys: result.selectedContext.map((c) => c.key),
    budgetStatus: result.budgetReport.status,
    estimatedPromptChars: result.budgetReport.estimatedPromptChars,
    qualityScore: result.qualityReport.total,
    userEdited: Boolean(editedPrompt && editedPrompt !== result.finalPrompt),
    editedPrompt: editedPrompt && editedPrompt !== result.finalPrompt ? editedPrompt : undefined,
    finalPrompt: result.finalPrompt,
  };
}
