import { MemoryEntry } from "../agents/contracts";

/**
 * Walks a memory entry's `supersedes` chain back to its root — the stable
 * anchor for a mutation's deduplication key. Every version of "the same
 * agent output" shares one lineage root id, so re-projecting a newer version
 * updates the SAME Studio Brain items instead of duplicating them.
 */
export function findLineageRootId(entries: MemoryEntry[], entry: MemoryEntry): string {
  const byId = new Map(entries.map((e) => [e.id, e]));
  let current = entry;
  const seen = new Set<string>();
  while (current.supersedes && byId.has(current.supersedes) && !seen.has(current.supersedes)) {
    seen.add(current.supersedes);
    current = byId.get(current.supersedes)!;
  }
  return current.id;
}
