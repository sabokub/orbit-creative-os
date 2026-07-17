import { AgentRole, MemoryType } from "../agents/contracts";
import { WorkMode } from "./contracts";
import { getWorkModeConfig } from "./config";

/**
 * resolveWorkModeContext — given a mode and an agent, returns the context
 * shaping hints (which memory types to boost). It does NOT copy or rebuild
 * project context; the agent engine keeps its single context resolver and
 * simply receives these boosts. This is how a mode influences what agents see
 * without duplicating context.
 */
export interface WorkModeContextResolution {
  workMode: WorkMode;
  agentRole: AgentRole;
  boostTypes: MemoryType[];
  emphasize: string[];
  /** True when this agent is highlighted in the current mode. */
  preferred: boolean;
}

export function resolveWorkModeContext(
  _projectId: string,
  workMode: WorkMode,
  agentRole: AgentRole
): WorkModeContextResolution {
  const config = getWorkModeConfig(workMode);
  return {
    workMode,
    agentRole,
    boostTypes: config.contextPolicy.prioritizeMemoryTypes,
    emphasize: config.contextPolicy.emphasize,
    preferred: config.preferredAgents.includes(agentRole),
  };
}
