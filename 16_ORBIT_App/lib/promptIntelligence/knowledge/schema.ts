import { z } from "zod";

/**
 * Knowledge Layer — typed schema for a single prompt-engineering knowledge
 * item. This is the "sources, principles, rules, examples, technical
 * vocabulary, patterns" layer described in issue #13.
 *
 * IMPORTANT — honest sourcing (see PR description / issue fact-check, and
 * knowledge/README.md "Provenance history" for the full story):
 * `sourceDocument` must always name a source whose content was actually
 * read, by this codebase's own author, via a verifiable tool call — never a
 * name relayed secondhand without independent verification. Two kinds of
 * source appear in `items.ts`:
 *  - Real Google Drive documents (e.g. "04-The Three Pillars of
 *    Professional AI Image Creation.pdf", "Furniture Pipeline.pdf") — each
 *    one was independently confirmed to exist (via `search_files`) and read
 *    in full (via `read_file_content`) directly in this session before any
 *    item citing it was written. Only documents actually opened this way
 *    are cited — a folder containing 23 files does not license citing all
 *    23 if only some were opened and read.
 *  - `"ORBIT Prompt Engineering Guidelines"` — first-party content authored
 *    for this PR, used only for topics (website copywriting structure, SEO
 *    length conventions, UX writing, Brand-DNA/Studio-Brain integration,
 *    prompt-chaining mechanics specific to this app) that none of the real
 *    source documents actually cover — those documents are general
 *    AI-image/product-photography prompting material, not website-content
 *    guidance, so citing them for website-copywriting rules would itself be
 *    dishonest attribution.
 */

export const PROMPT_KNOWLEDGE_DOMAINS = [
  "structure", // overall prompt architecture / ordering
  "clarity", // vague verbs, ambiguity, actionable language
  "image-vocabulary", // camera/lens/lighting/material vocabulary
  "video-vocabulary", // shot/motion/pacing vocabulary
  "text-deliverable", // copywriting/website/content clarity rules
  "seo", // meta title/description, on-page SEO basics
  "brand-fit", // how to keep prompts aligned with Brand DNA
  "anti-pattern", // things to actively avoid
  "model-quirk", // model-specific behavior notes
  "output-format", // format/schema expectations
] as const;

export type PromptKnowledgeDomain = (typeof PROMPT_KNOWLEDGE_DOMAINS)[number];

export const PROMPT_TASK_TYPES = [
  "positioning",
  "copywriting",
  "information-architecture",
  "cta",
  "faq",
  "seo",
  "ux-writing",
  "image-prompt",
  "video-prompt",
  "general-text",
  "consistency-review",
] as const;

export type PromptTaskType = (typeof PROMPT_TASK_TYPES)[number];

export const PROMPT_TARGET_MODELS = [
  "openai-text",
  "claude-text",
  "openai-image",
  "nano-banana-image",
  "sora-video",
  "manual-export",
] as const;

export type PromptTargetModel = (typeof PROMPT_TARGET_MODELS)[number];

export const PROMPT_KNOWLEDGE_STATUSES = ["active", "proposed", "deprecated"] as const;
export type PromptKnowledgeStatus = (typeof PROMPT_KNOWLEDGE_STATUSES)[number];

export const PromptKnowledgeItemSchema = z.object({
  id: z.string().min(1).max(120),
  /** Honest provenance — see file-level comment. Never a fabricated document name. */
  sourceDocument: z.string().min(1).max(200),
  /** Omitted for first-party ORBIT content. For real ingested documents, a short locator (e.g. a section heading) when the document itself doesn't paginate cleanly. */
  sourcePageOrSection: z.string().max(200).optional(),
  /** Other real, independently-read documents that corroborate the same principle (multi-source synthesis) — never a document that wasn't itself opened and verified. */
  additionalSources: z.array(z.string().max(200)).max(10).default([]),
  title: z.string().min(1).max(200),
  domain: z.enum(PROMPT_KNOWLEDGE_DOMAINS),
  taskTypes: z.array(z.enum(PROMPT_TASK_TYPES)).min(1),
  targetModels: z.array(z.enum(PROMPT_TARGET_MODELS)).min(1),
  principle: z.string().min(1).max(600),
  rationale: z.string().min(1).max(800),
  recommendedWording: z.string().max(600).optional(),
  structurePattern: z.string().max(600).optional(),
  technicalVocabulary: z.array(z.string().max(120)).max(40).default([]),
  goodExamples: z.array(z.string().max(400)).max(10).default([]),
  badExamples: z.array(z.string().max(400)).max(10).default([]),
  antiPatterns: z.array(z.string().max(300)).max(10).default([]),
  constraints: z.array(z.string().max(300)).max(10).default([]),
  tags: z.array(z.string().max(60)).max(20).default([]),
  /** 0-1 — how confident we are this principle is correct/broadly applicable, not a measure of provenance. */
  confidence: z.number().min(0).max(1),
  status: z.enum(PROMPT_KNOWLEDGE_STATUSES),
});

export type PromptKnowledgeItem = z.infer<typeof PromptKnowledgeItemSchema>;

export function parsePromptKnowledgeItem(raw: unknown): PromptKnowledgeItem {
  return PromptKnowledgeItemSchema.parse(raw);
}

export function parsePromptKnowledgeItems(raw: unknown[]): PromptKnowledgeItem[] {
  return raw.map((item) => parsePromptKnowledgeItem(item));
}
