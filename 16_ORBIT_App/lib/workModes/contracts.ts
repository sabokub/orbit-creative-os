import { z } from "zod";
import { AGENT_ROLES, MEMORY_TYPES } from "../agents/contracts";

/**
 * Work Modes — contextual VIEWS over the one Orbit system (same memory, Studio
 * Brain, agent registry, orchestrator, tasks, progress journal, data). A mode
 * only changes what is emphasised: navigation, priority widgets, quick actions,
 * highlighted agents, filters, and the context policy sent to agents. Modes are
 * views, never silos.
 */

export const WORK_MODES = ["build", "creation", "content", "client", "steering"] as const;
export type WorkMode = (typeof WORK_MODES)[number];
export const WorkModeSchema = z.enum(WORK_MODES);

export const WorkModeNavigationItemSchema = z.object({
  href: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().min(1),
});
export type WorkModeNavigationItem = z.infer<typeof WorkModeNavigationItemSchema>;

export const WorkModeWidgetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});
export type WorkModeWidget = z.infer<typeof WorkModeWidgetSchema>;

export const WorkModeActionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().optional(),
});
export type WorkModeAction = z.infer<typeof WorkModeActionSchema>;

export const WorkModeAgentPrioritySchema = z.array(z.enum(AGENT_ROLES));
export type WorkModeAgentPriority = z.infer<typeof WorkModeAgentPrioritySchema>;

/** How this mode filters/prioritises project context for agents (no duplication — only boosts). */
export const WorkModeContextPolicySchema = z.object({
  /** Memory types boosted in context resolution for this mode. */
  prioritizeMemoryTypes: z.array(z.enum(MEMORY_TYPES)).default([]),
  emphasize: z.array(z.string().max(120)).default([]),
});
export type WorkModeContextPolicy = z.infer<typeof WorkModeContextPolicySchema>;

export const WorkModeConfigSchema = z.object({
  id: WorkModeSchema,
  label: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  navigationItems: z.array(WorkModeNavigationItemSchema).min(1),
  priorityWidgets: z.array(WorkModeWidgetSchema).default([]),
  quickActions: z.array(WorkModeActionSchema).default([]),
  preferredAgents: WorkModeAgentPrioritySchema.default([]),
  hiddenSections: z.array(z.string().max(120)).default([]),
  defaultFilters: z.record(z.string()).default({}),
  contextPolicy: WorkModeContextPolicySchema,
});
export type WorkModeConfig = z.infer<typeof WorkModeConfigSchema>;

export const DEFAULT_WORK_MODE: WorkMode = "build";
