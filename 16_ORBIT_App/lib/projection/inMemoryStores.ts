import { ProjectionConflict, ProjectionResult, StudioBrainLink } from "./contracts";
import { ConflictStore, LinkStore, ProjectionLogStore } from "./stores";

export class InMemoryLinkStore implements LinkStore {
  private readonly byId = new Map<string, StudioBrainLink>();

  async get(dedupeKey: string): Promise<StudioBrainLink | null> {
    return this.byId.get(dedupeKey) ?? null;
  }
  async save(link: StudioBrainLink): Promise<void> {
    this.byId.set(link.id, { ...link });
  }
  async listByProject(projectId: string): Promise<StudioBrainLink[]> {
    return [...this.byId.values()].filter((l) => l.projectId === projectId);
  }
}

export class InMemoryConflictStore implements ConflictStore {
  private readonly byId = new Map<string, ProjectionConflict>();

  async get(id: string): Promise<ProjectionConflict | null> {
    return this.byId.get(id) ?? null;
  }
  async save(conflict: ProjectionConflict): Promise<void> {
    this.byId.set(conflict.id, { ...conflict });
  }
  async listByProject(projectId: string): Promise<ProjectionConflict[]> {
    return [...this.byId.values()].filter((c) => c.projectId === projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async findOpenByDedupeKey(projectId: string, dedupeKey: string): Promise<ProjectionConflict | null> {
    return (
      [...this.byId.values()].find((c) => c.projectId === projectId && c.status === "open" && c.mutation.deduplicationKey === dedupeKey) ?? null
    );
  }
}

export class InMemoryProjectionLogStore implements ProjectionLogStore {
  private readonly byId = new Map<string, ProjectionResult>();

  async save(result: ProjectionResult): Promise<void> {
    this.byId.set(result.id, { ...result });
  }
  async listByProject(projectId: string): Promise<ProjectionResult[]> {
    return [...this.byId.values()].filter((r) => r.projectId === projectId).sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt));
  }
}
