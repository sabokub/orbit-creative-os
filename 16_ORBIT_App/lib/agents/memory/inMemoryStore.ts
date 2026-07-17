import { MemoryEntry } from "../contracts";
import { MemoryStore } from "./store";

/** In-process MemoryStore for unit tests and offline reasoning about flows. */
export class InMemoryStore implements MemoryStore {
  private readonly byId = new Map<string, MemoryEntry>();

  async listByProject(projectId: string): Promise<MemoryEntry[]> {
    return [...this.byId.values()]
      .filter((e) => e.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<MemoryEntry | null> {
    return this.byId.get(id) ?? null;
  }

  async save(entry: MemoryEntry): Promise<void> {
    this.byId.set(entry.id, { ...entry });
  }
}
