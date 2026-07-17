import { z } from "zod";

/**
 * Agent Layer — shared, strictly-typed contracts for Orbit's multi-agent
 * Creative OS. Every agent is a specialization of the SAME execution engine
 * (see engine.ts): it is defined by a role, instructions, expected inputs, a
 * structured output schema, validation rules, dependencies and the memory it
 * may read. There is exactly one set of contracts — no per-agent schema
 * dialect, no `any`.
 *
 * Persistence reuses the existing Upstash Redis under the `orbit-hub:`
 * namespace (see memory/redisStore.ts, runs/redisStore.ts) — this is NOT a
 * parallel store to Studio Brain, it is the same database with complementary
 * keys.
 */

/* ------------------------------------------------------------------------ *
 * Roles
 * ------------------------------------------------------------------------ */

export const AGENT_ROLES = [
  "orbit-brain",
  "brand-strategist",
  "creative-director",
  "website-architect",
  "content-strategist",
  "prompt-intelligence",
  "orbit-critic",
] as const;
export type AgentRole = (typeof AGENT_ROLES)[number];
export const AgentRoleSchema = z.enum(AGENT_ROLES);

/** Canonical pipeline order (Brief → … → Critic). */
export const PIPELINE_ORDER: AgentRole[] = [
  "orbit-brain",
  "brand-strategist",
  "creative-director",
  "website-architect",
  "content-strategist",
  "prompt-intelligence",
  "orbit-critic",
];

/* ------------------------------------------------------------------------ *
 * Memory
 * ------------------------------------------------------------------------ */

/**
 * Explicit memory categories — memory is NOT a single text blob. Every stored
 * fact carries its epistemic kind so context resolution can prioritise
 * approved decisions over hypotheses, constraints over nice-to-haves, etc.
 */
export const MEMORY_TYPES = [
  "brief",
  "intake",
  "fact",
  "hypothesis",
  "decision",
  "preference",
  "constraint",
  "reference",
  "deliverable",
  "feedback",
  "validation",
  "analysis",
] as const;
export type MemoryType = (typeof MEMORY_TYPES)[number];
export const MemoryTypeSchema = z.enum(MEMORY_TYPES);

export const MEMORY_SOURCES = ["brief", "intake", "user", "agent", "critic", "system"] as const;
export type MemorySource = (typeof MEMORY_SOURCES)[number];
export const MemorySourceSchema = z.enum(MEMORY_SOURCES);

/**
 * Lifecycle of a memory entry / agent output:
 *  draft      -> produced, not yet reviewed
 *  reviewed   -> looked at (e.g. by Critic) but not decided
 *  approved   -> active truth, prioritised in future context
 *  rejected   -> no longer used as active truth
 *  superseded -> replaced by a newer version (history kept)
 */
export const MEMORY_STATUSES = ["draft", "reviewed", "approved", "rejected", "superseded"] as const;
export type MemoryStatus = (typeof MEMORY_STATUSES)[number];
export const MemoryStatusSchema = z.enum(MEMORY_STATUSES);

export const MemoryEntrySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  type: MemoryTypeSchema,
  source: MemorySourceSchema,
  /** Role that produced this entry, when source === "agent" | "critic". */
  agentRole: AgentRoleSchema.optional(),
  /** Orchestration run that produced this entry, when applicable. */
  runId: z.string().optional(),
  title: z.string().min(1).max(200),
  /** Human-readable summary — always present, safe to show raw in the UI. */
  content: z.string().max(20_000),
  /** Structured payload validated by the producing agent's output schema. */
  data: z.record(z.unknown()).optional(),
  status: MemoryStatusSchema,
  version: z.number().int().min(1),
  /** Id of the entry this one replaces (previous version). */
  supersedes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

/** Input to create a memory entry — server fills id/version/status/timestamps. */
export const MemoryEntryInputSchema = z.object({
  projectId: z.string().min(1),
  type: MemoryTypeSchema,
  source: MemorySourceSchema,
  agentRole: AgentRoleSchema.optional(),
  runId: z.string().optional(),
  title: z.string().min(1).max(200),
  content: z.string().max(20_000),
  data: z.record(z.unknown()).optional(),
  status: MemoryStatusSchema.optional(),
});
export type MemoryEntryInput = z.infer<typeof MemoryEntryInputSchema>;

/* ------------------------------------------------------------------------ *
 * Agent definition & dependencies
 * ------------------------------------------------------------------------ */

export interface AgentDependency {
  role: AgentRole;
  /** If true, the engine refuses to run this agent until the dependency has an approved/draft output. */
  required: boolean;
  reason: string;
}

/**
 * Static, code-defined description of one agent. Not persisted (holds a Zod
 * schema and functions) — lives in the registry. An agent is "principally
 * defined by" exactly these fields, per the architecture brief.
 */
export interface AgentDefinition<S extends z.ZodTypeAny = z.ZodTypeAny> {
  role: AgentRole;
  title: string;
  description: string;
  /** System instructions injected verbatim into the prompt. */
  instructions: string;
  dependencies: AgentDependency[];
  /** Memory type this agent's primary output is stored as. */
  produces: MemoryType;
  /** Zod schema the model output MUST satisfy (validated, never blindly trusted). */
  outputSchema: S;
  /** Turns a validated output into a short human summary for the memory entry. */
  summarize: (output: z.infer<S>) => string;
}

/**
 * Registry/engine-facing shape. The per-agent generic `S` is invariant, so a
 * heterogeneous collection can't keep each concrete schema type; we erase to
 * this common shape at the registry boundary. `summarize` widens to `unknown`
 * (the engine only ever passes it the freshly-validated output).
 */
export type AnyAgentDefinition = Omit<AgentDefinition, "outputSchema" | "summarize"> & {
  outputSchema: z.ZodTypeAny;
  summarize: (output: unknown) => string;
};

/** Erases the authoring generic to the registry shape in one localized place. */
export function defineAgent<S extends z.ZodTypeAny>(def: AgentDefinition<S>): AnyAgentDefinition {
  return def as unknown as AnyAgentDefinition;
}

/* ------------------------------------------------------------------------ *
 * Project context (context continuity)
 * ------------------------------------------------------------------------ */

export interface ContextTraceEntry {
  memoryId: string;
  type: MemoryType;
  status: MemoryStatus;
  reason: string;
  estimatedTokens: number;
}

export interface ProjectContext {
  projectId: string;
  role: AgentRole;
  /** Rendered context string handed to the model — role-scoped, size-capped. */
  rendered: string;
  entries: MemoryEntry[];
  trace: ContextTraceEntry[];
  estimatedTokens: number;
  truncated: boolean;
}

/* ------------------------------------------------------------------------ *
 * Execution I/O
 * ------------------------------------------------------------------------ */

export const AgentExecutionInputSchema = z.object({
  projectId: z.string().min(1),
  role: AgentRoleSchema,
  runId: z.string().optional(),
  userIntent: z.string().max(4000).optional(),
});
export type AgentExecutionInput = z.infer<typeof AgentExecutionInputSchema>;

export const AGENT_STATUSES = ["idle", "running", "completed", "failed", "skipped"] as const;
export type AgentStatus = (typeof AGENT_STATUSES)[number];
export const AgentStatusSchema = z.enum(AGENT_STATUSES);

export interface AgentExecutionOutput {
  role: AgentRole;
  status: AgentStatus;
  /** Validated structured output, when status === "completed". */
  output?: Record<string, unknown>;
  summary?: string;
  /** Memory entries written by this execution. */
  memoryEntryIds: string[];
  error?: string;
  contextTrace: ContextTraceEntry[];
  createdAt: string;
}

/* ------------------------------------------------------------------------ *
 * Orchestration
 * ------------------------------------------------------------------------ */

export const ORCHESTRATION_MODES = ["single", "sequence", "full", "review"] as const;
export type OrchestrationMode = (typeof ORCHESTRATION_MODES)[number];
export const OrchestrationModeSchema = z.enum(ORCHESTRATION_MODES);

export const OrchestrationStepSchema = z.object({
  role: AgentRoleSchema,
  status: AgentStatusSchema,
  memoryEntryIds: z.array(z.string()).default([]),
  summary: z.string().optional(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
});
export type OrchestrationStep = z.infer<typeof OrchestrationStepSchema>;

export const OrchestrationRunSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  mode: OrchestrationModeSchema,
  status: AgentStatusSchema,
  steps: z.array(OrchestrationStepSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type OrchestrationRun = z.infer<typeof OrchestrationRunSchema>;

/* ------------------------------------------------------------------------ *
 * Review (Orbit Critic output)
 * ------------------------------------------------------------------------ */

const ScoredDimensionSchema = z.object({
  score: z.number().min(0).max(100),
  comment: z.string().min(1).max(2000),
});

export const ReviewResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  briefAlignment: ScoredDimensionSchema,
  brandCoherence: ScoredDimensionSchema,
  creativeQuality: ScoredDimensionSchema,
  clarity: ScoredDimensionSchema,
  relevance: ScoredDimensionSchema,
  risks: z.array(z.string().max(500)).max(20).default([]),
  contradictions: z.array(z.string().max(500)).max(20).default([]),
  /** Not just a score — WHAT to fix and WHY, ordered by priority. */
  priorityFixes: z
    .array(
      z.object({
        what: z.string().min(1).max(500),
        why: z.string().min(1).max(500),
        target: AgentRoleSchema.optional(),
      })
    )
    .max(20)
    .default([]),
  verdict: z.enum(["approve", "revise", "reject"]),
  summary: z.string().min(1).max(2000),
});
export type ReviewResult = z.infer<typeof ReviewResultSchema>;

/* ------------------------------------------------------------------------ *
 * Image-prompt generators (Prompt Intelligence adaptation axis).
 * Kept separate from lib/promptIntelligence PROMPT_TARGET_MODELS so the
 * existing knowledge-selection engine is untouched.
 * ------------------------------------------------------------------------ */

export const IMAGE_GENERATORS = ["gpt-image", "nano-banana", "midjourney", "sora"] as const;
export type ImageGenerator = (typeof IMAGE_GENERATORS)[number];
export const ImageGeneratorSchema = z.enum(IMAGE_GENERATORS);
