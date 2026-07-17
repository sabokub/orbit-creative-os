import { MemoryEntry } from "../contracts";

/**
 * Storage-agnostic memory port. The engine, context resolver and service
 * layer depend ONLY on this interface — never on Redis directly — so the same
 * logic runs against the Upstash-backed store in production and an in-memory
 * store in tests. This is the seam that keeps the agent layer decoupled and
 * testable without a live database.
 */
export interface MemoryStore {
  listByProject(projectId: string): Promise<MemoryEntry[]>;
  get(id: string): Promise<MemoryEntry | null>;
  save(entry: MemoryEntry): Promise<void>;
}
