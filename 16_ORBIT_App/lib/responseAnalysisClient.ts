"use client";

import { Project, WorkflowStep } from "./types";
import { AnalysisResult, AnalysisSource } from "./responseAnalysis/types";
import { VersionDiff } from "./responseAnalysis/versioning";

export interface AnalyzeRequest {
  projectId: string;
  workflowStep: WorkflowStep;
  reviewTarget?: string;
  promptId?: string;
  rawResponse: string;
  source: AnalysisSource;
  skipSemanticAnalysis?: boolean;
}

export interface AnalyzeResponse {
  analysis: AnalysisResult;
  versionDiff: VersionDiff;
}

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `La requête a échoué (${res.status})`);
    (err as Error & { status?: number; payload?: unknown }).status = res.status;
    (err as Error & { status?: number; payload?: unknown }).payload = body;
    throw err;
  }
  return body as T;
}

/** Canonical entry point for both the OpenAI-generated and manual-paste paths — same request shape, same pipeline, same result. */
export async function analyzeResponse(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return parse<AnalyzeResponse>(res);
}

export type ApplyMode = "draft" | "validate" | "raw_only";
export type VersionAction = "replace" | "merge" | "new_version" | "cancel";

export interface ApplyRequest {
  projectId: string;
  workflowStep: WorkflowStep;
  reviewTarget?: string;
  analysis: AnalysisResult;
  mode: ApplyMode;
  versionAction?: VersionAction;
  ifMatch?: string;
}

export interface ApplyResponse {
  project: Project;
  applyResult: { createdTaskIds: string[]; completedTaskIds: string[]; createdDecisionIds: string[]; skipped: string[] };
  idempotentNoOp?: boolean;
}

export async function applyAnalysis(req: ApplyRequest): Promise<ApplyResponse> {
  const res = await fetch("/api/analyze/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return parse<ApplyResponse>(res);
}

/* ------------------------------------------------------------------------ *
 * Manual-mode draft persistence — scoped per project + workflow step (+
 * review target when relevant), survives accidental navigation, cleared on
 * successful save. Never throws: localStorage can be unavailable (SSR,
 * private browsing quota) and losing a draft-save must never break the UI.
 * ------------------------------------------------------------------------ */

function draftKey(projectId: string, step: WorkflowStep, reviewTarget?: string): string {
  return `orbit:analysis-draft:${projectId}:${step}${reviewTarget ? `:${reviewTarget}` : ""}`;
}

export function saveDraft(projectId: string, step: WorkflowStep, text: string, reviewTarget?: string): void {
  try {
    if (typeof window === "undefined") return;
    if (!text.trim()) {
      window.localStorage.removeItem(draftKey(projectId, step, reviewTarget));
      return;
    }
    window.localStorage.setItem(draftKey(projectId, step, reviewTarget), text);
  } catch {
    // Storage unavailable — silently skip, never block the user's typing.
  }
}

export function loadDraft(projectId: string, step: WorkflowStep, reviewTarget?: string): string | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(draftKey(projectId, step, reviewTarget));
  } catch {
    return null;
  }
}

export function clearDraft(projectId: string, step: WorkflowStep, reviewTarget?: string): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(draftKey(projectId, step, reviewTarget));
  } catch {
    // no-op
  }
}
