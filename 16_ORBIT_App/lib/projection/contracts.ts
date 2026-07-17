import { z } from "zod";
import { AgentRoleSchema } from "../agents/contracts";

/**
 * Projection Layer — turns an APPROVED agent output into real Studio Brain
 * mutations (tasks, content, decisions) without creating a parallel system.
 * Memory stays the source of provenance/versions/history; Studio Brain stays
 * the source of active operational state. A mutation always keeps a link back
 * to the memory entry that produced it (StudioBrainLink), so nothing is
 * orphaned and re-running a projection is idempotent (see dedupe.ts).
 */

/* ------------------------------------------------------------------------ *
 * Conceptual target classification (rich, per the brief) — the actual write
 * always lands on one of a small number of real substrates (see below).
 * ------------------------------------------------------------------------ */

export const PROJECTION_TARGETS = [
  "decision",
  "task",
  "subtask",
  "dependency",
  "objective",
  "active-focus",
  "content",
  "content-idea",
  "deliverable",
  "roadmap-step",
  "risk",
  "blocker",
  "deadline",
  "brand-element",
  "creative-rule",
  "page-architecture",
  "prompt",
  "critic-recommendation",
] as const;
export type ProjectionTarget = (typeof PROJECTION_TARGETS)[number];
export const ProjectionTargetSchema = z.enum(PROJECTION_TARGETS);

/** The real store a mutation writes to. "none" = intentionally not automated (documented, e.g. objective/active-focus). */
export const PROJECTION_SUBSTRATES = ["studio-task", "studio-content", "decision", "none"] as const;
export type ProjectionSubstrate = (typeof PROJECTION_SUBSTRATES)[number];
export const ProjectionSubstrateSchema = z.enum(PROJECTION_SUBSTRATES);

export const PROJECTION_OPERATIONS = ["create", "update", "skip"] as const;
export type ProjectionOperation = (typeof PROJECTION_OPERATIONS)[number];
export const ProjectionOperationSchema = z.enum(PROJECTION_OPERATIONS);

export const PROJECTION_MODES = ["preview", "confirm", "auto-safe"] as const;
export type ProjectionMode = (typeof PROJECTION_MODES)[number];
export const ProjectionModeSchema = z.enum(PROJECTION_MODES);

export const PROJECTION_MUTATION_STATUSES = ["proposed", "applied", "skipped", "conflict", "rejected"] as const;
export type ProjectionMutationStatus = (typeof PROJECTION_MUTATION_STATUSES)[number];
export const ProjectionMutationStatusSchema = z.enum(PROJECTION_MUTATION_STATUSES);

/* ------------------------------------------------------------------------ *
 * Provenance
 * ------------------------------------------------------------------------ */

export const SourceProvenanceSchema = z.object({
  projectId: z.string().min(1),
  sourceMemoryEntryId: z.string().min(1),
  sourceRunId: z.string().optional(),
  sourceAgent: AgentRoleSchema,
  /** Root memory entry id at the start of the supersedes chain — stable across versions. */
  sourceLineageRootId: z.string().min(1),
  sourceVersion: z.number().int().min(1),
});
export type SourceProvenance = z.infer<typeof SourceProvenanceSchema>;

/* ------------------------------------------------------------------------ *
 * Mutation
 * ------------------------------------------------------------------------ */

export const ProjectionMutationSchema = z.object({
  /** Deterministic (= "mut:" + deduplicationKey) so preview and apply always agree. */
  id: z.string().min(1),
  projectId: z.string().min(1),
  sourceMemoryEntryId: z.string().min(1),
  sourceRunId: z.string().optional(),
  sourceAgent: AgentRoleSchema,
  lineageRootId: z.string().min(1),
  targetType: ProjectionTargetSchema,
  substrate: ProjectionSubstrateSchema,
  operation: ProjectionOperationSchema,
  /** Existing Studio Brain id when operation is "update" (or once applied for "create"). */
  targetId: z.string().optional(),
  payload: z.record(z.unknown()),
  /** 0-1 rule confidence. */
  confidence: z.number().min(0).max(1),
  requiresConfirmation: z.boolean(),
  deduplicationKey: z.string().min(1),
  status: ProjectionMutationStatusSchema,
  note: z.string().max(500).optional(),
  createdAt: z.string(),
  appliedAt: z.string().optional(),
});
export type ProjectionMutation = z.infer<typeof ProjectionMutationSchema>;

/* ------------------------------------------------------------------------ *
 * Request / Preview / Result
 * ------------------------------------------------------------------------ */

export const ProjectionRequestSchema = z.object({
  projectId: z.string().min(1),
  memoryEntryId: z.string().min(1),
  mode: ProjectionModeSchema.default("preview"),
  selectedMutationIds: z.array(z.string()).optional(),
});
export type ProjectionRequest = z.infer<typeof ProjectionRequestSchema>;

export const ProjectionPreviewSchema = z.object({
  projectId: z.string().min(1),
  sourceMemoryEntryId: z.string().min(1),
  sourceAgent: AgentRoleSchema,
  mutations: z.array(ProjectionMutationSchema),
  calculatedAt: z.string(),
});
export type ProjectionPreview = z.infer<typeof ProjectionPreviewSchema>;

export const ProjectionResultSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  sourceMemoryEntryId: z.string().min(1),
  mode: ProjectionModeSchema,
  applied: z.array(ProjectionMutationSchema),
  skipped: z.array(ProjectionMutationSchema),
  conflicts: z.array(z.lazy(() => ProjectionConflictSchema)),
  createdCount: z.number().int().min(0),
  updatedCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  conflictCount: z.number().int().min(0),
  journalEntryId: z.string().optional(),
  calculatedAt: z.string(),
});
export type ProjectionResult = z.infer<typeof ProjectionResultSchema>;

/* ------------------------------------------------------------------------ *
 * Conflicts — never silently overwritten. Old + new value + provenance kept.
 * ------------------------------------------------------------------------ */

export const PROJECTION_CONFLICT_REASONS = ["done-task-would-be-modified", "resolved-decision-content-changed"] as const;
export type ProjectionConflictReason = (typeof PROJECTION_CONFLICT_REASONS)[number];

export const PROJECTION_CONFLICT_RESOLUTIONS = ["keep", "replace", "merge"] as const;
export type ProjectionConflictResolution = (typeof PROJECTION_CONFLICT_RESOLUTIONS)[number];

export const ProjectionConflictSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  mutation: ProjectionMutationSchema,
  reason: z.enum(PROJECTION_CONFLICT_REASONS),
  targetId: z.string().min(1),
  oldValue: z.string(),
  newValue: z.string(),
  status: z.enum(["open", "resolved"]),
  resolution: z.enum(PROJECTION_CONFLICT_RESOLUTIONS).optional(),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
});
export type ProjectionConflict = z.infer<typeof ProjectionConflictSchema>;

/* ------------------------------------------------------------------------ *
 * Studio Brain link — the provenance + dedup index. Keyed BY the
 * deduplicationKey itself, so there is exactly one row per logical target;
 * re-projecting updates it in place instead of creating duplicates.
 * ------------------------------------------------------------------------ */

export const StudioBrainLinkSchema = z.object({
  /** = the mutation's deduplicationKey. */
  id: z.string().min(1),
  projectId: z.string().min(1),
  targetType: ProjectionTargetSchema,
  substrate: ProjectionSubstrateSchema,
  targetId: z.string().min(1),
  sourceMemoryEntryId: z.string().min(1),
  sourceRunId: z.string().optional(),
  sourceAgent: AgentRoleSchema,
  mutationId: z.string().min(1),
  lineageRootId: z.string().min(1),
  status: z.enum(["active", "superseded"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type StudioBrainLink = z.infer<typeof StudioBrainLinkSchema>;

/** Policy gate for what may apply without explicit per-item confirmation. */
export const ProjectionPolicySchema = z.object({
  mode: ProjectionModeSchema,
});
export type ProjectionPolicy = z.infer<typeof ProjectionPolicySchema>;
