import { MemoryEntry } from "../agents/contracts";
import { ProjectionMutation } from "./contracts";
import { findLineageRootId } from "./lineage";
import { getProjectionRule } from "./rules";

/**
 * Pure computation: approved memory entry + full project memory → proposed
 * mutations. No IO. Rejected/draft/reviewed entries never reach here (both
 * preview and apply enforce `status === "approved"` before calling this) —
 * that is the hard guarantee that only confirmed truth is ever projected.
 */
export function computeMutations(entry: MemoryEntry, entries: MemoryEntry[]): ProjectionMutation[] {
  if (entry.status !== "approved" || !entry.agentRole) return [];
  const rule = getProjectionRule(entry.agentRole);
  if (!rule) return [];
  const lineageRootId = findLineageRootId(entries, entry);
  return rule(entry, { projectId: entry.projectId, lineageRootId, sourceVersion: entry.version });
}
