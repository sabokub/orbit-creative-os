import { ProjectionConflict, ProjectionResult, StudioBrainLink } from "./contracts";

/** Storage-agnostic ports (same pattern as MemoryStore/RunStore). */

export interface LinkStore {
  get(dedupeKey: string): Promise<StudioBrainLink | null>;
  save(link: StudioBrainLink): Promise<void>;
  listByProject(projectId: string): Promise<StudioBrainLink[]>;
}

export interface ConflictStore {
  get(id: string): Promise<ProjectionConflict | null>;
  save(conflict: ProjectionConflict): Promise<void>;
  listByProject(projectId: string): Promise<ProjectionConflict[]>;
  findOpenByDedupeKey(projectId: string, dedupeKey: string): Promise<ProjectionConflict | null>;
}

export interface ProjectionLogStore {
  save(result: ProjectionResult): Promise<void>;
  listByProject(projectId: string): Promise<ProjectionResult[]>;
}
