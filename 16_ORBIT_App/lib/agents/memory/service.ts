import {
  AgentRole,
  MemoryEntry,
  MemoryEntryInput,
  MemoryEntryInputSchema,
  MemoryStatus,
  MemoryType,
} from "../contracts";
import { MemoryStore } from "./store";

/** Deterministic id helper mirroring lib/studioBrain.ts genId shape. */
function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Memory service — all lifecycle/versioning rules live here, on top of the
 * MemoryStore port. Append-only: a new version never mutates the previous
 * entry's content, it writes a fresh entry and flips the old one to
 * "superseded" so the full history is preserved (brief requirement:
 * "Une nouvelle version doit conserver l'historique").
 */
export class MemoryService {
  constructor(private readonly store: MemoryStore) {}

  list(projectId: string): Promise<MemoryEntry[]> {
    return this.store.listByProject(projectId);
  }

  get(id: string): Promise<MemoryEntry | null> {
    return this.store.get(id);
  }

  /** Creates a standalone entry (brief/intake/user note/feedback…). */
  async create(input: MemoryEntryInput): Promise<MemoryEntry> {
    const parsed = MemoryEntryInputSchema.parse(input);
    const now = new Date().toISOString();
    const entry: MemoryEntry = {
      ...parsed,
      id: genId(`mem-${parsed.type}`),
      status: parsed.status ?? "draft",
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.save(entry);
    return entry;
  }

  /**
   * Records a new agent output as the current version for that
   * (project, role, type), superseding any prior non-rejected version of the
   * same role+type. Re-running an agent therefore never duplicates data — it
   * versions it. Returns the freshly created entry.
   */
  async recordAgentOutput(params: {
    projectId: string;
    agentRole: AgentRole;
    type: MemoryType;
    title: string;
    content: string;
    data?: Record<string, unknown>;
    runId?: string;
    source?: "agent" | "critic";
  }): Promise<MemoryEntry> {
    const existing = await this.store.listByProject(params.projectId);
    const priorSameRole = existing
      .filter(
        (e) =>
          e.agentRole === params.agentRole &&
          e.type === params.type &&
          (e.status === "draft" || e.status === "reviewed" || e.status === "approved")
      )
      .sort((a, b) => b.version - a.version);
    const latest = priorSameRole[0];

    const now = new Date().toISOString();
    // Supersede the previous current version (history preserved as its own entry).
    for (const prev of priorSameRole) {
      await this.store.save({ ...prev, status: "superseded", updatedAt: now });
    }

    const entry: MemoryEntry = {
      id: genId(`mem-${params.type}`),
      projectId: params.projectId,
      type: params.type,
      source: params.source ?? "agent",
      agentRole: params.agentRole,
      runId: params.runId,
      title: params.title,
      content: params.content,
      data: params.data,
      status: "draft",
      version: latest ? latest.version + 1 : 1,
      supersedes: latest?.id,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.save(entry);
    return entry;
  }

  /** Transitions an entry's status (approve/reject/review). */
  async setStatus(id: string, status: MemoryStatus): Promise<MemoryEntry> {
    const entry = await this.store.get(id);
    if (!entry) throw new Error(`Entrée mémoire introuvable : ${id}`);
    const next: MemoryEntry = { ...entry, status, updatedAt: new Date().toISOString() };
    await this.store.save(next);
    return next;
  }
}
