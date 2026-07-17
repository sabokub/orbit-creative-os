import { AgentRole, MemoryEntry } from "../../agents/contracts";
import { ProjectionMutation } from "../contracts";
import { RuleContext } from "./helpers";
import { projectOrbitBrain } from "./orbitBrain";
import { projectBrandStrategist } from "./brandStrategist";
import { projectCreativeDirector } from "./creativeDirector";
import { projectWebsiteArchitect } from "./websiteArchitect";
import { projectContentStrategist } from "./contentStrategist";
import { projectPromptIntelligence } from "./promptIntelligence";
import { projectOrbitCritic } from "./orbitCritic";

export type ProjectionRule = (entry: MemoryEntry, ctx: RuleContext) => ProjectionMutation[];

const RULES: Partial<Record<AgentRole, ProjectionRule>> = {
  "orbit-brain": projectOrbitBrain,
  "brand-strategist": projectBrandStrategist,
  "creative-director": projectCreativeDirector,
  "website-architect": projectWebsiteArchitect,
  "content-strategist": projectContentStrategist,
  "prompt-intelligence": projectPromptIntelligence,
  "orbit-critic": projectOrbitCritic,
};

export function getProjectionRule(role: AgentRole): ProjectionRule | undefined {
  return RULES[role];
}
