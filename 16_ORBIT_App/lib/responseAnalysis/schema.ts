import { z } from "zod";
import type { AnalysisResult } from "./types";

/**
 * Zod schema for `AnalysisResult` as it crosses the network boundary
 * (client -> POST /api/analyze/apply). The analysis itself is always
 * produced server-side by `analyzeOrbitResponse`; the client is only
 * allowed to round-trip it back with edited `accepted` flags on the
 * proposed Studio Brain changes (and possibly an edited raw response before
 * a re-analyze). We never trust that round-trip blindly -- it is
 * Zod-validated here before anything touches Studio Brain or Redis, exactly
 * like the model's own JSON output is validated in semantic.ts.
 */

const MAX_TEXT = 20_000;
const MAX_RAW = 130_000;

const deliverableStatus = z.enum(["complete", "partial", "missing"]);

const deliverableResultSchema = z.object({
  id: z.string().max(200),
  label: z.string().max(300),
  status: deliverableStatus,
  reasons: z.array(z.string().max(MAX_TEXT)).max(50),
  content: z.string().max(MAX_RAW).optional(),
  wordCount: z.number().optional(),
});

const scoreWithIssues = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(z.string().max(MAX_TEXT)).max(50),
});

const changeProposalSchema = z.object({
  id: z.string().max(200),
  kind: z.enum(["create_task", "complete_task", "create_decision", "unblock_dependent", "update_deliverable"]),
  description: z.string().max(MAX_TEXT),
  payload: z.record(z.unknown()),
  accepted: z.boolean(),
});

export const WORKFLOW_STEPS = ["strategy", "creative", "website", "content", "images", "review"] as const;
export const ANALYSIS_SOURCES = ["openai", "manual", "claude", "other"] as const;

export const AnalysisResultSchema = z.object({
  id: z.string().min(1).max(200),
  projectId: z.string().min(1).max(200),
  workflowStep: z.enum(WORKFLOW_STEPS),
  promptId: z.string().max(200).optional(),
  source: z.enum(ANALYSIS_SOURCES),
  createdAt: z.string().max(60),

  documentType: z.union([z.enum(WORKFLOW_STEPS), z.literal("unknown")]),
  documentTypeConfidence: z.number().min(0).max(1),
  matchesExpectedModule: z.boolean(),

  rawResponse: z.string().max(MAX_RAW),
  normalizedResponse: z.string().max(MAX_RAW),
  summary: z.string().max(MAX_TEXT),

  completenessScore: z.number().min(0).max(100),
  qualityScore: z.number().min(0).max(100),
  exploitability: z.enum(["ready", "needs_edits", "not_usable"]),

  brandCoherence: scoreWithIssues,
  briefCoherence: scoreWithIssues,

  semanticAnalysisPerformed: z.boolean(),
  semanticAnalysisError: z.string().max(MAX_TEXT).optional(),

  expectedDeliverables: z.array(z.string().max(200)).max(100),
  detectedDeliverables: z.array(deliverableResultSchema).max(100),
  missingDeliverables: z.array(z.string().max(200)).max(100),
  partialDeliverables: z.array(z.string().max(200)).max(100),

  extractedEntities: z.record(z.unknown()),
  extractedTasks: z
    .array(
      z.object({
        title: z.string().max(500),
        description: z.string().max(MAX_TEXT).optional(),
        sourceHeading: z.string().max(300).optional(),
        dedupeKey: z.string().max(300),
      })
    )
    .max(200),
  extractedDecisions: z
    .array(
      z.object({
        question: z.string().max(500),
        context: z.string().max(MAX_TEXT).optional(),
        options: z.array(z.string().max(200)).max(20),
      })
    )
    .max(50),
  extractedDependencies: z.array(z.object({ from: z.string().max(300), to: z.string().max(300) })).max(200),
  extractedContent: z
    .array(z.object({ heading: z.string().max(300), level: z.number(), content: z.string().max(MAX_RAW), wordCount: z.number() }))
    .max(200),
  extractedPages: z.array(z.string().max(300)).max(200),
  extractedSections: z
    .array(z.object({ heading: z.string().max(300), level: z.number(), content: z.string().max(MAX_RAW), wordCount: z.number() }))
    .max(200),
  extractedCTAs: z.array(z.object({ text: z.string().max(300), vague: z.boolean() })).max(200),
  extractedFAQ: z.array(z.object({ question: z.string().max(500), answer: z.string().max(MAX_TEXT) })).max(100),
  extractedSEO: z
    .object({
      metaTitle: z.string().max(300).optional(),
      metaDescription: z.string().max(500).optional(),
      issues: z.array(z.string().max(300)).max(20),
    })
    .nullable(),
  extractedImageDirections: z.array(z.string().max(MAX_TEXT)).max(50),
  extractedImagePrompts: z.array(z.object({ section: z.string().max(300), prompt: z.string().max(MAX_TEXT) })).max(200),

  warnings: z.array(z.string().max(MAX_TEXT)).max(200),
  contradictions: z.array(z.string().max(MAX_TEXT)).max(200),
  placeholders: z.array(z.string().max(300)).max(200),

  recommendedNextActions: z.array(z.string().max(MAX_TEXT)).max(100),
  proposedStudioBrainChanges: z.array(changeProposalSchema).max(200),
});

export function parseAnalysisResult(raw: unknown): AnalysisResult {
  const result = AnalysisResultSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Analyse invalide : ${result.error.issues[0]?.message || "schéma non respecté"}.`);
  }
  return result.data as unknown as AnalysisResult;
}
