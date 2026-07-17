import { MemoryEntry } from "../../agents/contracts";
import { ProjectionMutation, ProjectionSubstrate, ProjectionTarget } from "../contracts";

export interface RuleContext {
  projectId: string;
  lineageRootId: string;
  sourceVersion: number;
}

export interface MutationOptions {
  confidence: number;
  requiresConfirmation: boolean;
  note?: string;
}

export function truncate(s: string, n = 80): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** Best-effort ISO date extraction from loose text ("2026-08-01", "01/08/2026", "semaine 1" → undefined). */
export function parseLooseDate(text: string): string | undefined {
  const iso = text.match(/\d{4}-\d{2}-\d{2}/);
  if (iso) return iso[0];
  const fr = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (fr) return `${fr[3]}-${fr[2]}-${fr[1]}`;
  return undefined;
}

function baseMutation(
  entry: MemoryEntry,
  ctx: RuleContext,
  targetType: ProjectionTarget,
  substrate: ProjectionSubstrate,
  kind: string,
  index: number,
  payload: Record<string, unknown>,
  opts: MutationOptions
): ProjectionMutation {
  const dedupeKey = `${ctx.projectId}:${entry.agentRole}:${targetType}:${ctx.lineageRootId}:${kind}:${index}`;
  return {
    id: `mut:${dedupeKey}`,
    projectId: ctx.projectId,
    sourceMemoryEntryId: entry.id,
    sourceRunId: entry.runId,
    sourceAgent: entry.agentRole!,
    lineageRootId: ctx.lineageRootId,
    targetType,
    substrate,
    operation: "create",
    payload,
    confidence: opts.confidence,
    requiresConfirmation: opts.requiresConfirmation,
    deduplicationKey: dedupeKey,
    status: "proposed",
    note: opts.note,
    createdAt: new Date().toISOString(),
  };
}

export interface TaskFields {
  title: string;
  description?: string;
  category?: string;
  estimateMinutes?: number;
  urgency?: number;
  impact?: number;
  launchCritical?: boolean;
  dueDate?: string;
  notes?: string;
}

export function taskMutation(
  entry: MemoryEntry,
  ctx: RuleContext,
  kind: string,
  index: number,
  fields: TaskFields,
  opts: MutationOptions,
  targetType: ProjectionTarget = "task"
): ProjectionMutation {
  return baseMutation(entry, ctx, targetType, "studio-task", kind, index, { ...fields }, opts);
}

export function contentMutation(
  entry: MemoryEntry,
  ctx: RuleContext,
  kind: string,
  index: number,
  fields: TaskFields,
  opts: MutationOptions,
  targetType: ProjectionTarget = "content"
): ProjectionMutation {
  return baseMutation(entry, ctx, targetType, "studio-content", kind, index, { ...fields }, opts);
}

export interface DecisionFields {
  question: string;
  context?: string;
  options: string[];
  /** If set, the created decision is immediately resolved with this option (low-risk, informational record). */
  autoResolve?: string;
}

export function decisionMutation(
  entry: MemoryEntry,
  ctx: RuleContext,
  kind: string,
  index: number,
  fields: DecisionFields,
  opts: MutationOptions & { targetType: ProjectionTarget }
): ProjectionMutation {
  const { targetType, ...rest } = opts;
  return baseMutation(entry, ctx, targetType, "decision", kind, index, { ...fields }, rest);
}

/** Documented no-op for targets not automated in this version (e.g. objective/active-focus). */
export function skippedMutation(
  entry: MemoryEntry,
  ctx: RuleContext,
  targetType: ProjectionTarget,
  kind: string,
  index: number,
  note: string
): ProjectionMutation {
  const m = baseMutation(entry, ctx, targetType, "none", kind, index, {}, { confidence: 1, requiresConfirmation: false, note });
  return { ...m, operation: "skip", status: "skipped" };
}
