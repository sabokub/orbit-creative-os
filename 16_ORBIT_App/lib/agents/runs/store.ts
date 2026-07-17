import { OrchestrationRun } from "../contracts";

/** Storage-agnostic port for orchestration runs (see MemoryStore rationale). */
export interface RunStore {
  listByProject(projectId: string): Promise<OrchestrationRun[]>;
  get(id: string): Promise<OrchestrationRun | null>;
  save(run: OrchestrationRun): Promise<void>;
}
