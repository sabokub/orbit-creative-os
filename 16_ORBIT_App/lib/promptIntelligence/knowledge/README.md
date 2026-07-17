# Prompt Intelligence — Knowledge Layer

## Provenance history (read this first)

This file's seed data went through three honestly-distinct stages:

**Stage 1 (initial PR).** The GitHub issue that requested this feature (#13)
referenced a list of uploaded PDFs as source material ("Prompting Guideline
Pack", "Three Pillars of Professional AI Image Creation", "Nano Banana Pro
prompts", "Furniture Pipeline", etc.). At that point none of those files were
reachable from this session — no Drive tool was available — so seeding the
Knowledge Layer with content attributed to those exact names would have been
fabricated provenance. `items.ts` was instead seeded entirely with first-party
content honestly attributed to `"ORBIT Prompt Engineering Guidelines"`.

**Stage 2.** Google Drive tools became available in this session mid-task.
Rather than trust a relayed description of what another session claimed to
have read, this session independently: called `search_files` for `title
contains 'Ohneis Ressources'` and confirmed both folders genuinely exist,
owned by the account's real user; listed both folders' contents directly and
cross-checked real filenames against the ones claimed; then called
`read_file_content` itself on 10 of the (at-the-time believed) 23 files,
citing only what it personally read.

**Stage 3 (this update).** Read and evaluated the remaining files in both
folders, until all 23 files across "Ohneis Ressources" and "Ohneis Ressources
2" had been personally opened and read by this session. Consolidated
duplicate/near-duplicate principles that recur across multiple documents
(especially the four e-commerce pipeline docs, which share a near-identical
"vision analysis first, extract structured variables, inject as placeholders
downstream" architecture) into single canonical items with multi-source
`additionalSources` attribution, rather than one near-identical item per
document.

## Full document status (all 23 personally read)

Every row below reflects a document this session actually opened via
`read_file_content` — never a file cited on the strength of merely appearing
in a folder listing.

| # | Document | Folder | Status |
|---|---|---|---|
| 1 | `01-Mastering Intentional AI- Beyond Random Prompts.pdf` | 1 | Read, not separately cited — thesis-level framing ("AI amplifies taste, doesn't create it") fully absorbed into `real-consistency-beats-perfection` and `real-comparison-loop-iterative-refinement`, no distinct new rule of its own. |
| 2 | `02-Mastering Visual Instinct- From Random to Intentional AI Art.pdf` | 1 | **Cited** — `real-consistency-beats-perfection` |
| 3 | `03-Technical Language- The Bridge Between Vision and AI.pdf` | 1 | **Cited** — `real-camera-lens-vocabulary`, `real-lighting-vocabulary`, `real-material-texture-specificity`, `real-specificity-reduces-guesswork` (additionalSources) |
| 4 | `04-The Three Pillars of Professional AI Image Creation.pdf` | 1 | **Cited** — `real-3-pillar-system`, `real-prompt-structured-ordering` (additionalSources) |
| 5 | `05-Accelerated Aesthetic Development- AI-Powered Visual Mastery.pdf` | 1 | **Cited** — `real-comparison-loop-iterative-refinement` |
| 6 | `06-Foundation to Vision- Bridging Systematic Prompting with Creative Direction.pdf` | 1 | Read, not separately cited — the extracted text was a short conclusion/recap page ("Taste First, Tools Second") summarizing content already covered by items 2–5; no distinct new claim to cite. |
| 7 | `Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf` | 2 | **Cited** — `real-prompt-structured-ordering`, `real-specificity-reduces-guesswork`, `real-negative-prompting-explicit-exclusions`, `real-gpt-as-structured-prompt-intermediary` |
| 8 | `972181274-7-Master-Prompts-That-Actually-Work.pdf` | 1 | **Cited** — `real-intentional-imperfection-vs-ai-smoothness` |
| 9 | `AI Prompts for Nano Banana Pro.pdf` | 1 | Read, not cited — ready-to-use marketing/UGC prompt templates; content not appropriate to reproduce/generalize into example fields, and its underlying swap-target pattern is already covered by the pipeline items with more suitable examples. |
| 10 | `Mixed Media Prompts.pdf` | 2 | **Cited** — `real-intentional-imperfection-vs-ai-smoothness` (additionalSources) |
| 11 | `Motion Style Workflow.pdf` | 2 | Read, not cited — a tool-specific animation workflow (After Effects shapes → Kling Motion Control → Hunyuan 3D); its only generalizable idea (separate a motion reference from a style reference) duplicates the reference-lock pattern already covered. |
| 12 | `AI Sora Prompt – Vol. 2.pdf` | 1 | **Cited** — `real-video-prompt-structure-components` |
| 13 | `Grok Imagine Guideline.pdf` | 1 | **Cited** — `real-explicit-preservation-directive-for-edits` |
| 14 | `Furniture Pipeline.pdf` | 1 | **Cited** — `real-reference-image-consistency-lock` |
| 15 | `Fashion Pipeline.pdf` | 1 | **Cited** — `real-vision-analysis-first-pattern`, `real-reference-image-consistency-lock` (additionalSources) |
| 16 | `Beverage Pipeline.pdf` | 1 | **Cited** — `real-vision-analysis-first-pattern`, `real-reference-image-consistency-lock` (additionalSources on both — shares the "Cognitive Anchor" / "No Hallucinated Objects" framing) |
| 17 | `Jewelry Pipeline.pdf` | 2 | **Cited** — `real-vision-analysis-first-pattern`, `real-reference-image-consistency-lock` (additionalSources on both — explicit Phase 1 vision analysis + prohibition list) |
| 18 | `Marker Style Prompt.pdf` | 2 | **Cited** — `real-locked-aesthetic-single-variable-template` (additionalSources) |
| 19 | `Matchbox Prompts.pdf` | 2 | Read, not cited — a single thin example (one vintage-label illustration) with no articulated general principle beyond what `real-locked-aesthetic-single-variable-template` already states more clearly from other sources. |
| 20 | `Adobe Stickers Prompt.pdf` | 1 | **Cited** — `real-locked-aesthetic-single-variable-template` |
| 21 | `Risograph Print Style.pdf` | 2 | **Cited** — `real-locked-aesthetic-single-variable-template` (additionalSources) |
| 22 | `Halftone Workflow.pdf` | 1 | Read, not cited — states a "do your graphic design first, then apply the transformative style prompt" two-stage rule that duplicates the structure/reference/vision separation and vision-analysis-first patterns already covered. |
| 23 | `Pixel Transition Workflow.pdf` | 2 | **Cited** — `real-bridge-frame-video-transition` |
| 24 | `Lens Transition Effect.pdf` | 2 | **Cited** — `real-edge-only-lens-transform-skeleton` |
| 25 | `Image Enhancer _ Restorer prompt.pdf` | 2 | **Cited** — `real-explicit-preservation-directive-for-edits` (additionalSources) |
| 26 | `UGC Agent One.pdf` | 2 | **Cited** — `real-deconstruct-then-rebuild-reference` |
| 27 | `Luma Agent Guide.pdf` | 2 | Read, not cited — its core value (set brand identity once, reuse across every generation) duplicates `real-consistency-beats-perfection` and `brand-fit-dont-restate-full-dna-every-step`; no distinct new rule. |

(Table numbered 1–27 because the original Stage-2 pass already covered 9 of
these; the coordinator's "23 priority documents" list and the 10 documents
read in Stage 2 overlap on 6 titles — see the numbering above for the exact
per-document status, which is what actually matters, not the count.)

**Not personally read, therefore never cited anywhere in this codebase:**
`Envato Floating UI.pdf`, `10 Almost Free AI Tools.pdf`,
`FAL - UGC Setup.pdf`, `Gemini Slide Workflow.pdf`, `Claude Code Setup.pdf`,
`Ai Blueprint for Businesses.pdf`,
`914393148-First-Step-From-Random-to-Pro.pdf`,
`972981665-01-Mastering-Intentional-AI-Beyond-Random-Prompts.pdf`,
`Cats, Lifestyle & Product Photography Prompt Pack v4.pdf`,
`Advanced Prompt Pack v7.pdf`, `Pixa Setup Guide.pdf`, `ManyChat Guide.pdf`,
`Micrographics Branding Design Prompts.pdf` — these 13 files sit in the same
two Drive folders (40 files total) but were outside the 23-document priority
list and were never opened this session. They must not be cited by any
future knowledge item without first being personally read.

**What did *not* change.** None of the verified documents are about website
copywriting, SEO, UX writing, or Brand-DNA/Studio-Brain integration — they're
general AI-image/video and product-photography prompting material. The items
covering those domains stay attributed to `"ORBIT Prompt Engineering
Guidelines"` because citing a real document for a topic it doesn't actually
address would itself be dishonest attribution. See the domain comments in
`items.ts` for exactly which items are real-sourced vs. first-party.

## Schema

See `schema.ts` (`PromptKnowledgeItemSchema`, Zod-validated). Key fields:

- `sourceDocument` / `sourcePageOrSection` / `additionalSources` — provenance.
  `sourcePageOrSection` is set only when a real document has a distinguishable
  section (e.g. an appendix); omitted for first-party content and for
  documents that don't paginate cleanly. `additionalSources` lists other
  *personally-verified* documents that corroborate the same principle
  (multi-source synthesis) — never a document that wasn't itself opened.
- `domain`, `taskTypes`, `targetModels` — the axes the Intelligence Layer
  filters/ranks on (see `query.ts`).
- `principle` / `rationale` — the actual guidance and why it's true. For
  real-sourced items, `rationale` quotes or closely paraphrases the source
  document(s) directly rather than asserting the claim without attribution —
  and, where a principle recurs across multiple documents, names each one
  and quotes its version, rather than presenting convergent evidence as if it
  came from a single source.
- `recommendedWording`, `structurePattern`, `technicalVocabulary`,
  `goodExamples`, `badExamples`, `antiPatterns`, `constraints` — concrete,
  checkable content. For real-sourced items, examples are paraphrased
  distillations of what the source illustrates, not verbatim reproductions of
  its (sometimes proprietary, sometimes unsuitable-for-reuse) example
  prompts.
- `confidence` (0-1) — how confident we are the principle is correct/broadly
  applicable. This is *not* a provenance/authority score; a first-party item
  can have high confidence, and a real ingested item can have lower
  confidence if its claim looks narrow or platform-specific. Items
  corroborated by 3+ independent documents (e.g.
  `real-vision-analysis-first-pattern`, `real-reference-image-consistency-lock`)
  are not automatically scored higher — confidence still reflects how
  broadly/reliably the *principle itself* applies, not the citation count.
- `status` — `active` | `proposed` | `deprecated`. The learning loop (see
  `../learning.ts`) can add `proposed` items for human review; nothing is
  ever auto-promoted to `active`.

## How real future ingestion of *additional* documents would work

Documents outside the 23-file priority list (and anything added to Drive
later) are explicitly out of scope for automatic ingestion in this PR (per
the issue's own scope-control section: no Drive sync, no OCR pipeline, no
automatic ingestion). The pattern demonstrated in Stages 2–3 above — search,
list, personally read, then hand-write an honestly-cited item, consolidating
duplicates across sources — is the manual version of the intended future
shape:

1. **Extraction adapter** (`knowledge/ingest/<sourceName>.ts`, not yet
   built): given a document already confirmed to exist and already read (via
   Drive tools or whatever pipeline is chosen later), segments its text into
   candidate knowledge fragments (heading + body), similar in spirit to
   `lib/responseAnalysis/markdown.ts`'s section extraction.
2. **Candidate review queue**: each fragment becomes a `status: "proposed"`
   `PromptKnowledgeItem` with `sourceDocument` set to the real file name and
   `sourcePageOrSection` set to the actual page/section it came from — never
   guessed. A human (studio operator) reviews each candidate in a review
   surface (the same kind of explicit-approval UI as the learning loop in
   `../learning.ts`) before it can move to `status: "active"`.
3. **No silent promotion**: nothing produced by extraction is queryable by
   `queryKnowledge()` for real generation until a human sets `status:
   "active"` — this mirrors the "never auto-rewrite canonical knowledge"
   rule already applied to the learning loop.
4. **Versioned re-ingestion**: if a document is re-uploaded/updated, new
   candidates are diffed against existing items with the same
   `sourceDocument` rather than duplicating them blindly.
5. **Duplicate detection across sources**: before adding a new candidate,
   check whether an existing `active` item already states the same principle
   from a different document; if so, add the new document to
   `additionalSources` on the existing item rather than creating a
   near-duplicate (this is what Stage 3 did manually for the four
   e-commerce pipeline documents).
6. **Never cite the uncited**: a file merely *existing* in a searched folder
   is not sufficient grounds to cite it — only files actually opened and
   read, and even then, only when they yield a distinct, non-redundant
   principle (see the "read, not cited" rows in the status table above).

## Scaling

At the current size (a few dozen items) `query.ts` does a linear scan with a
deterministic relevance score. If the knowledge base grows into the hundreds
or thousands of items (e.g. after real ingestion of documents beyond the
23-file priority list), add an index (by domain / task type / target model)
rather than changing the query contract.
