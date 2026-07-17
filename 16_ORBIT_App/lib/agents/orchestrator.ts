import {
  AgentRole,
  MemoryType,
  OrchestrationMode,
  OrchestrationRun,
  OrchestrationStep,
  PIPELINE_ORDER,
} from "./contracts";
import { AgentRuntime, runAgent } from "./engine";
import { RunStore } from "./runs/store";

/**
 * Orchestrator — sequences agents over the shared engine. Supports a single
 * agent, an arbitrary sequence, the full pipeline, or a Critic-only review.
 * Each step reads its dependencies from memory, produces a structured output,
 * persists it, and updates the run's status. Re-running never duplicates data:
 * the memory service versions outputs (supersede), so a re-run just adds a new
 * version and the run record is a fresh, independent trace.
 */

function genRunId(): string {
  return `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface OrchestrateInput {
  projectId: string;
  mode: OrchestrationMode;
  /** Explicit roles for mode "single" (first element) or "sequence". */
  roles?: AgentRole[];
  userIntent?: string;
  /** Memory types to prioritise for every step (from the active work mode). */
  boostTypes?: MemoryType[];
}

export interface OrchestrateDeps {
  runtime: AgentRuntime;
  runStore: RunStore;
}

function resolveRoles(input: OrchestrateInput): AgentRole[] {
  switch (input.mode) {
    case "single":
      if (!input.roles?.length) throw new Error("mode 'single' requiert un rôle.");
      return [input.roles[0]];
    case "sequence":
      if (!input.roles?.length) throw new Error("mode 'sequence' requiert au moins un rôle.");
      return input.roles;
    case "review":
      return ["orbit-critic"];
    case "full":
    default:
      return [...PIPELINE_ORDER];
  }
}

export async function orchestrate(
  input: OrchestrateInput,
  deps: OrchestrateDeps
): Promise<OrchestrationRun> {
  const roles = resolveRoles(input);
  const now = new Date().toISOString();

  const run: OrchestrationRun = {
    id: genRunId(),
    projectId: input.projectId,
    mode: input.mode,
    status: "running",
    steps: roles.map((role): OrchestrationStep => ({ role, status: "idle", memoryEntryIds: [] })),
    createdAt: now,
    updatedAt: now,
  };
  await deps.runStore.save(run);

  for (let i = 0; i < run.steps.length; i++) {
    run.steps[i] = { ...run.steps[i], status: "running", startedAt: new Date().toISOString() };
    run.updatedAt = new Date().toISOString();
    await deps.runStore.save(run);

    const result = await runAgent(
      { projectId: input.projectId, role: run.steps[i].role, runId: run.id, userIntent: input.userIntent, boostTypes: input.boostTypes },
      deps.runtime
    );

    run.steps[i] = {
      ...run.steps[i],
      status: result.status,
      memoryEntryIds: result.memoryEntryIds,
      summary: result.summary,
      error: result.error,
      finishedAt: new Date().toISOString(),
    };
    run.updatedAt = new Date().toISOString();
    await deps.runStore.save(run);

    // Halt the chain on a failed or skipped step — downstream agents depend on it.
    if (result.status !== "completed") {
      run.status = "failed";
      await deps.runStore.save(run);
      return run;
    }
  }

  run.status = "completed";
  run.updatedAt = new Date().toISOString();
  await deps.runStore.save(run);
  return run;
}
