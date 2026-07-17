import { ExternalConversation, ProgressEntry } from "./contracts";

/** Storage-agnostic ports (same rationale as the agent layer's MemoryStore). */
export interface ConversationStore {
  listByProject(projectId: string): Promise<ExternalConversation[]>;
  get(id: string): Promise<ExternalConversation | null>;
  save(conversation: ExternalConversation): Promise<void>;
  remove(id: string, projectId: string): Promise<void>;
}

export interface ProgressStore {
  listByProject(projectId: string): Promise<ProgressEntry[]>;
  save(entry: ProgressEntry): Promise<void>;
  /** True if an entry with this dedupeKey already exists for the project. */
  hasDedupeKey(projectId: string, dedupeKey: string): Promise<boolean>;
}
