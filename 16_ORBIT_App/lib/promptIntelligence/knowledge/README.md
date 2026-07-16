# Prompt Intelligence — Knowledge Layer

## What's actually in here right now

`items.ts` contains a seeded set of genuine, well-established prompt-engineering
principles (structure/ordering, image-prompt vocabulary, clarity rules,
anti-patterns, SEO practicals, model quirks). Every item is honestly
attributed: `sourceDocument: "ORBIT Prompt Engineering Guidelines"`, a
first-party knowledge base written for this PR.

**This is a deliberate substitution.** The originating GitHub issue (#13)
references a list of uploaded PDFs as source material ("Prompting Guideline
Pack", "Three Pillars of Professional AI Image Creation", "Nano Banana Pro
prompts", "Furniture Pipeline", etc.). None of those files exist anywhere in
this repository or in the session that implemented this PR. Attributing
seeded content to documents that were never actually provided would be
fabricated provenance, so this PR does not do that. Instead it seeds the
layer with real, defensible knowledge and documents (below) how the schema
supports ingesting the real documents once they exist.

## Schema

See `schema.ts` (`PromptKnowledgeItemSchema`, Zod-validated). Key fields:

- `sourceDocument` / `sourcePageOrSection` — provenance. `sourcePageOrSection`
  is omitted for first-party content; it becomes meaningful once real
  external PDFs are ingested (see below).
- `domain`, `taskTypes`, `targetModels` — the axes the Intelligence Layer
  filters/ranks on (see `query.ts`).
- `principle` / `rationale` — the actual guidance and why it's true.
- `recommendedWording`, `structurePattern`, `technicalVocabulary`,
  `goodExamples`, `badExamples`, `antiPatterns`, `constraints` — concrete,
  checkable content (not just prose).
- `confidence` (0-1) — how confident we are the principle is correct/broadly
  applicable. This is *not* a provenance/authority score; a first-party item
  can have high confidence, and a real ingested item can have low confidence
  if it looks unreliable.
- `status` — `active` | `proposed` | `deprecated`. The learning loop (see
  `../learning.ts`) can add `proposed` items for human review; nothing is
  ever auto-promoted to `active`.

## How real future ingestion would work (documented, not built)

Out of scope for this PR (per the issue's own scope-control section): no
Google Drive sync, no OCR, no automatic PDF ingestion. When real source
documents are actually provided, the intended shape is:

1. **Extraction adapter** (`knowledge/ingest/<sourceName>.ts`, not yet
   built): takes raw extracted text per document (from whatever OCR/PDF-text
   pipeline is chosen later) and segments it into candidate knowledge
   fragments (heading + body), similar in spirit to
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

## Scaling

At the current size (a few dozen items) `query.ts` does a linear scan with a
deterministic relevance score. If the knowledge base grows into the hundreds
or thousands of items (e.g. after real ingestion), add an index (by domain /
task type / target model) rather than changing the query contract.
