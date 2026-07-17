import { AgentRole, AnyAgentDefinition, defineAgent } from "./contracts";
import { orbitBrain } from "./definitions/orbitBrain";
import { brandStrategist } from "./definitions/brandStrategist";
import { creativeDirector } from "./definitions/creativeDirector";
import { websiteArchitect } from "./definitions/websiteArchitect";
import { contentStrategist } from "./definitions/contentStrategist";
import { promptIntelligence } from "./definitions/promptIntelligence";
import { orbitCritic } from "./definitions/orbitCritic";

/**
 * Single source of truth mapping a role to its definition. Every agent is a
 * specialization of the same engine; the registry is the only place that
 * knows the concrete set. Typed as AgentDefinition (unknown output) at the
 * registry boundary — the engine validates each output against its own
 * schema, so the erased generic here is safe.
 */
const REGISTRY: Record<AgentRole, AnyAgentDefinition> = {
  "orbit-brain": defineAgent(orbitBrain),
  "brand-strategist": defineAgent(brandStrategist),
  "creative-director": defineAgent(creativeDirector),
  "website-architect": defineAgent(websiteArchitect),
  "content-strategist": defineAgent(contentStrategist),
  "prompt-intelligence": defineAgent(promptIntelligence),
  "orbit-critic": defineAgent(orbitCritic),
};

export function getAgentDefinition(role: AgentRole): AnyAgentDefinition {
  const def = REGISTRY[role];
  if (!def) throw new Error(`Agent inconnu : ${role}`);
  return def;
}

export function listAgentDefinitions(): AnyAgentDefinition[] {
  return Object.values(REGISTRY);
}
