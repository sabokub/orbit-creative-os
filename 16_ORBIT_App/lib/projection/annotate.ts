import { Decision, StudioItem } from "../types";
import { ProjectionConflictReason, ProjectionMutation } from "./contracts";
import { StudioBrainLink } from "./contracts";

export interface ConflictDraft {
  mutation: ProjectionMutation;
  reason: ProjectionConflictReason;
  targetId: string;
  oldValue: string;
  newValue: string;
}

export interface AnnotateDeps {
  getLink: (dedupeKey: string) => Promise<StudioBrainLink | null>;
  getStudioItem: (id: string) => Promise<StudioItem | null>;
  getDecision: (id: string) => Promise<Decision | null>;
}

/**
 * Reads current Studio Brain / link state and turns raw rule-computed
 * mutations into accurate create/update/skip/conflict decisions:
 *  - no link yet            → stays "create"
 *  - linked task/content    → "update" against the existing item, UNLESS the
 *    item is already `done` and the payload would change it → conflict (never
 *    silently reopen finished work)
 *  - linked, pending decision → "update" (in-place refresh; Studio Brain has
 *    no decision-content-edit primitive, so this is a documented no-op re-link)
 *  - linked, resolved decision → identical content: "skip" (idempotent,
 *    nothing to do); DIFFERENT content: conflict (never overwrite a resolved
 *    decision silently)
 */
export async function annotateMutations(
  mutations: ProjectionMutation[],
  deps: AnnotateDeps
): Promise<{ mutations: ProjectionMutation[]; conflicts: ConflictDraft[] }> {
  const out: ProjectionMutation[] = [];
  const conflicts: ConflictDraft[] = [];

  for (const raw of mutations) {
    if (raw.substrate === "none") {
      out.push(raw);
      continue;
    }

    const link = await deps.getLink(raw.deduplicationKey);
    if (!link || link.status !== "active") {
      out.push(raw);
      continue;
    }

    if (raw.substrate === "studio-task" || raw.substrate === "studio-content") {
      const existing = await deps.getStudioItem(link.targetId);
      if (!existing) {
        out.push(raw); // stale link — recreate
        continue;
      }
      if (existing.status === "done") {
        const newTitle = (raw.payload as { title?: string }).title ?? "";
        conflicts.push({ mutation: raw, reason: "done-task-would-be-modified", targetId: existing.id, oldValue: existing.title, newValue: newTitle });
        out.push({ ...raw, status: "conflict", targetId: existing.id });
        continue;
      }
      out.push({ ...raw, operation: "update", targetId: existing.id });
      continue;
    }

    // substrate === "decision"
    const existing = await deps.getDecision(link.targetId);
    if (!existing) {
      out.push(raw);
      continue;
    }
    const newContext = (raw.payload as { context?: string; question?: string }).context ?? (raw.payload as { question?: string }).question ?? "";
    if (existing.status === "pending") {
      out.push({ ...raw, operation: "update", targetId: existing.id });
      continue;
    }
    const oldContext = existing.context ?? existing.question;
    if (oldContext === newContext) {
      out.push({ ...raw, operation: "skip", targetId: existing.id, note: "Déjà projeté, aucun changement." });
      continue;
    }
    conflicts.push({ mutation: raw, reason: "resolved-decision-content-changed", targetId: existing.id, oldValue: oldContext, newValue: newContext });
    out.push({ ...raw, status: "conflict", targetId: existing.id });
  }

  return { mutations: out, conflicts };
}
