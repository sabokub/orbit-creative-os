import { ExternalConversation, ProgressEntry } from "./contracts";
import { ConversationStore, ProgressStore } from "./stores";

export class InMemoryConversationStore implements ConversationStore {
  private readonly byId = new Map<string, ExternalConversation>();

  async listByProject(projectId: string): Promise<ExternalConversation[]> {
    return [...this.byId.values()]
      .filter((c) => c.projectId === projectId)
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  }
  async get(id: string): Promise<ExternalConversation | null> {
    return this.byId.get(id) ?? null;
  }
  async save(conversation: ExternalConversation): Promise<void> {
    this.byId.set(conversation.id, { ...conversation });
  }
  async remove(id: string): Promise<void> {
    this.byId.delete(id);
  }
}

export class InMemoryProgressStore implements ProgressStore {
  private readonly byId = new Map<string, ProgressEntry>();

  async listByProject(projectId: string): Promise<ProgressEntry[]> {
    return [...this.byId.values()]
      .filter((e) => e.projectId === projectId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }
  async save(entry: ProgressEntry): Promise<void> {
    this.byId.set(entry.id, { ...entry });
  }
  async hasDedupeKey(projectId: string, dedupeKey: string): Promise<boolean> {
    return [...this.byId.values()].some((e) => e.projectId === projectId && e.dedupeKey === dedupeKey);
  }
}
