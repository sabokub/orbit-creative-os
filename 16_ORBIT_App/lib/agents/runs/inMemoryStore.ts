import { OrchestrationRun } from "../contracts";
import { RunStore } from "./store";

export class InMemoryRunStore implements RunStore {
  private readonly byId = new Map<string, OrchestrationRun>();

  async listByProject(projectId: string): Promise<OrchestrationRun[]> {
    return [...this.byId.values()]
      .filter((r) => r.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<OrchestrationRun | null> {
    return this.byId.get(id) ?? null;
  }

  async save(run: OrchestrationRun): Promise<void> {
    this.byId.set(run.id, { ...run, steps: run.steps.map((s) => ({ ...s })) });
  }
}
