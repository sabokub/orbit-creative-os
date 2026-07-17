import { z } from "zod";

/**
 * Sync Layer — contracts for making Orbit the single source of truth across
 * ChatGPT, Claude, Claude Code and Orbit itself. Conversations are ingested,
 * classified and turned into structured progress; only confirmed decisions and
 * validations change active project truth (that promotion happens through the
 * agent MemoryService, not here). Everything keeps exact provenance.
 *
 * SECURITY: imported conversation content is untrusted external data. It is
 * NEVER treated as system instructions. Deterministic extraction (ingest.ts)
 * only reads it as data; nothing here executes or trusts it.
 */

/* ------------------------------------------------------------------------ *
 * Sources & provenance
 * ------------------------------------------------------------------------ */

export const CONVERSATION_SOURCES = [
  "orbit",
  "chatgpt",
  "openai-api",
  "claude",
  "anthropic-api",
  "claude-code",
  "manual-import",
] as const;
export type ConversationSource = (typeof CONVERSATION_SOURCES)[number];
export const ConversationSourceSchema = z.enum(CONVERSATION_SOURCES);

/** How much we can trust a claim, from weakest to strongest evidence. */
export const VERIFICATION_LEVELS = [
  "declared",
  "verified-in-code",
  "verified-by-tests",
  "merged",
  "deployed",
  "user-validated",
] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];
export const VerificationLevelSchema = z.enum(VERIFICATION_LEVELS);

export const ProvenanceSchema = z.object({
  source: ConversationSourceSchema,
  externalId: z.string().max(200).optional(),
  author: z.string().max(200).optional(),
  capturedAt: z.string(),
  /** A durable reference back to the raw source (URL, file name, or stored raw id). */
  rawRef: z.string().max(500).optional(),
  verification: VerificationLevelSchema.default("declared"),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

/* ------------------------------------------------------------------------ *
 * Conversations
 * ------------------------------------------------------------------------ */

export const ConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system", "tool", "unknown"]).default("unknown"),
  author: z.string().max(200).optional(),
  content: z.string().max(100_000),
  at: z.string().optional(),
});
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export const SYNC_STATUSES = ["pending", "analyzed", "applied", "conflicted", "dismissed"] as const;
export type SyncStatus = (typeof SYNC_STATUSES)[number];
export const SyncStatusSchema = z.enum(SYNC_STATUSES);

export const ExternalConversationSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  source: ConversationSourceSchema,
  externalId: z.string().max(200).optional(),
  title: z.string().min(1).max(300),
  participants: z.array(z.string().max(200)).max(20).default([]),
  messages: z.array(ConversationMessageSchema).default([]),
  /** Raw pasted/imported blob kept verbatim for traceability when not message-structured. */
  rawContent: z.string().max(200_000).optional(),
  startedAt: z.string().optional(),
  updatedAt: z.string(),
  importedAt: z.string(),
  syncStatus: SyncStatusSchema,
  provenance: ProvenanceSchema,
  metadata: z.record(z.unknown()).default({}),
});
export type ExternalConversation = z.infer<typeof ExternalConversationSchema>;

/* ------------------------------------------------------------------------ *
 * Extraction results (classification of conversation content)
 * ------------------------------------------------------------------------ */

export const EXTRACTION_KINDS = [
  "information",
  "hypothesis",
  "proposal",
  "decision",
  "task",
  "deliverable",
  "feedback",
  "validation",
  "rejection",
  "scope-change",
  "technical-issue",
  "progress-note",
] as const;
export type ExtractionKind = (typeof EXTRACTION_KINDS)[number];
export const ExtractionKindSchema = z.enum(EXTRACTION_KINDS);

export const ExtractedItemSchema = z.object({
  kind: ExtractionKindSchema,
  content: z.string().min(1).max(2000),
  /** Whether this item may change active project truth once confirmed. */
  requiresConfirmation: z.boolean().default(true),
  sourceExcerpt: z.string().max(2000).optional(),
});
export type ExtractedItem = z.infer<typeof ExtractedItemSchema>;

export const ConversationAnalysisSchema = z.object({
  conversationId: z.string().optional(),
  projectId: z.string().min(1),
  summary: z.string().max(4000),
  items: z.array(ExtractedItemSchema).default([]),
  contradictions: z.array(z.string().max(1000)).default([]),
});
export type ConversationAnalysis = z.infer<typeof ConversationAnalysisSchema>;

/* ------------------------------------------------------------------------ *
 * Central progress journal
 * ------------------------------------------------------------------------ */

export const PROGRESS_TYPES = [
  "note",
  "decision",
  "task-update",
  "deliverable",
  "dev-session",
  "review",
  "import",
  "conflict",
  "milestone",
] as const;
export type ProgressType = (typeof PROGRESS_TYPES)[number];
export const ProgressTypeSchema = z.enum(PROGRESS_TYPES);

export const ProgressEntrySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  source: ConversationSourceSchema,
  sessionId: z.string().max(200).optional(),
  author: z.string().max(200).optional(),
  date: z.string(),
  type: ProgressTypeSchema,
  summary: z.string().min(1).max(2000),
  details: z.string().max(20_000).optional(),
  decisions: z.array(z.string().max(500)).default([]),
  tasksCompleted: z.array(z.string().max(500)).default([]),
  tasksCreated: z.array(z.string().max(500)).default([]),
  filesChanged: z.array(z.string().max(500)).default([]),
  featuresAdded: z.array(z.string().max(500)).default([]),
  issues: z.array(z.string().max(500)).default([]),
  blockers: z.array(z.string().max(500)).default([]),
  testsRun: z.string().max(1000).optional(),
  buildStatus: z.string().max(200).optional(),
  nextAction: z.string().max(1000).optional(),
  references: z.array(z.string().max(500)).default([]),
  commitSha: z.string().max(80).optional(),
  pullRequest: z.string().max(300).optional(),
  branch: z.string().max(200).optional(),
  verification: VerificationLevelSchema.default("declared"),
  validationStatus: z.enum(["unconfirmed", "confirmed", "rejected"]).default("unconfirmed"),
  /** Idempotency key so the same session/commit is never journaled twice. */
  dedupeKey: z.string().max(300).optional(),
});
export type ProgressEntry = z.infer<typeof ProgressEntrySchema>;

/* ------------------------------------------------------------------------ *
 * Standard end-of-session report (returned by ChatGPT / Claude / Claude Code)
 * ------------------------------------------------------------------------ */

export const SessionReportSchema = z.object({
  projectId: z.string().min(1),
  source: ConversationSourceSchema,
  sessionTitle: z.string().max(300).default(""),
  summary: z.string().max(4000).default(""),
  decisions: z.array(z.string().max(500)).default([]),
  tasksCreated: z.array(z.string().max(500)).default([]),
  tasksCompleted: z.array(z.string().max(500)).default([]),
  deliverables: z.array(z.string().max(500)).default([]),
  changes: z.array(z.string().max(500)).default([]),
  openQuestions: z.array(z.string().max(500)).default([]),
  risks: z.array(z.string().max(500)).default([]),
  nextActions: z.array(z.string().max(500)).default([]),
  memoryCandidates: z.array(z.string().max(1000)).default([]),
});
export type SessionReport = z.infer<typeof SessionReportSchema>;

/* ------------------------------------------------------------------------ *
 * Claude Code progress report (richer, dev-specific)
 * ------------------------------------------------------------------------ */

export const ClaudeCodeReportSchema = z.object({
  projectId: z.string().min(1),
  sessionId: z.string().min(1),
  objective: z.string().max(2000).default(""),
  analysis: z.string().max(4000).optional(),
  plan: z.string().max(4000).optional(),
  featuresCompleted: z.array(z.string().max(500)).default([]),
  featuresPartial: z.array(z.string().max(500)).default([]),
  filesCreated: z.array(z.string().max(500)).default([]),
  filesModified: z.array(z.string().max(500)).default([]),
  filesDeleted: z.array(z.string().max(500)).default([]),
  routesChanged: z.array(z.string().max(500)).default([]),
  migrations: z.array(z.string().max(500)).default([]),
  testsResult: z.string().max(1000).optional(),
  lintResult: z.string().max(1000).optional(),
  typecheckResult: z.string().max(1000).optional(),
  buildResult: z.string().max(1000).optional(),
  remainingErrors: z.array(z.string().max(500)).default([]),
  risks: z.array(z.string().max(500)).default([]),
  technicalDecisions: z.array(z.string().max(500)).default([]),
  commits: z.array(z.string().max(200)).default([]),
  pullRequests: z.array(z.string().max(300)).default([]),
  deployments: z.array(z.string().max(300)).default([]),
  branch: z.string().max(200).optional(),
  nextStep: z.string().max(1000).optional(),
});
export type ClaudeCodeReport = z.infer<typeof ClaudeCodeReportSchema>;

/* ------------------------------------------------------------------------ *
 * Aggregate sync status per project
 * ------------------------------------------------------------------------ */

export interface SyncStatusReport {
  projectId: string;
  conversationCount: number;
  progressCount: number;
  lastUpdatedBySource: Partial<Record<ConversationSource, string>>;
  pendingConversations: number;
  openConflicts: number;
  lastProgressAt?: string;
}

export const EXTERNAL_TARGETS = ["chatgpt", "claude", "claude-code"] as const;
export type ExternalTarget = (typeof EXTERNAL_TARGETS)[number];
export const ExternalTargetSchema = z.enum(EXTERNAL_TARGETS);
