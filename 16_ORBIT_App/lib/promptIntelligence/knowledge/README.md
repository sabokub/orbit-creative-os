# Prompt Intelligence — Knowledge Layer

## Provenance history (read this first)

This file's seed data went through two honestly-distinct stages, and both are
worth recording rather than quietly overwriting:

**Stage 1 (initial PR).** The GitHub issue that requested this feature (#13)
referenced a list of uploaded PDFs as source material ("Prompting Guideline
Pack", "Three Pillars of Professional AI Image Creation", "Nano Banana Pro
prompts", "Furniture Pipeline", etc.). At that point none of those files were
reachable from this session — no Drive tool was available — so seeding the
Knowledge Layer with content attributed to those exact names would have been
fabricated provenance. `items.ts` was instead seeded entirely with first-party
content honestly attributed to `"ORBIT Prompt Engineering Guidelines"`.

**Stage 2 (this update).** Google Drive tools became available in this
session mid-task. Rather than trust a relayed description of what another
session claimed to have read, this session independently:
1. Called `search_files` for `title contains 'Ohneis Ressources'` and
   confirmed both folders genuinely exist, owned by the account's real user.
2. Listed both folders' contents directly and cross-checked the real
   filenames against the ones claimed.
3. Called `read_file_content` itself on 10 of the 23 files, reading their
   actual extracted text before writing a single knowledge item citing them.

Only those 10 personally-read documents are cited anywhere in `items.ts`.
The other 13 files in the two folders were never opened in this session and
are never cited — a folder containing N files does not license citing all N
if only some were actually read. The 10 documents verified and cited are:

- `01-Mastering Intentional AI- Beyond Random Prompts.pdf`
- `02-Mastering Visual Instinct- From Random to Intentional AI Art.pdf`
- `03-Technical Language- The Bridge Between Vision and AI.pdf`
- `04-The Three Pillars of Professional AI Image Creation.pdf`
- `05-Accelerated Aesthetic Development- AI-Powered Visual Mastery.pdf`
- `06-Foundation to Vision- Bridging Systematic Prompting with Creative Direction.pdf`
- `Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf`
- `Furniture Pipeline.pdf`
- `Fashion Pipeline.pdf`
- `AI Prompts for Nano Banana Pro.pdf` (read, but not cited by any item — see below)

`AI Prompts for Nano Banana Pro.pdf` was opened and read, but no knowledge
item cites it: its content is ready-to-use marketing/UGC prompt templates
with some content not appropriate to reproduce or generalize into this
codebase's example fields, and the reusable underlying pattern it
demonstrates (swap-target product photography) is already covered honestly
by the Furniture/Fashion pipeline items with more suitable examples.

**What did *not* change.** None of the 10 verified documents are about
website copywriting, SEO, UX writing, or Brand-DNA/Studio-Brain integration —
they're general AI-image and product-photography prompting material. The
items covering those domains stay attributed to `"ORBIT Prompt Engineering
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
  document directly rather than asserting the claim without attribution.
- `recommendedWording`, `structurePattern`, `technicalVocabulary`,
  `goodExamples`, `badExamples`, `antiPatterns`, `constraints` — concrete,
  checkable content. For real-sourced items, examples are paraphrased
  distillations of what the source illustrates, not verbatim reproductions of
  its (sometimes proprietary, sometimes unsuitable-for-reuse) example
  prompts.
- `confidence` (0-1) — how confident we are the principle is correct/broadly
  applicable. This is *not* a provenance/authority score; a first-party item
  can have high confidence, and a real ingested item can have lower
  confidence if its claim looks narrow or platform-specific.
- `status` — `active` | `proposed` | `deprecated`. The learning loop (see
  `../learning.ts`) can add `proposed` items for human review; nothing is
  ever auto-promoted to `active`.

## How real future ingestion of *additional* documents would work

The remaining 13 files in the two Drive folders (and anything added later)
are explicitly out of scope for automatic ingestion in this PR (per the
issue's own scope-control section: no Drive sync, no OCR pipeline, no
automatic ingestion). The pattern demonstrated in Stage 2 above — search,
list, personally read, then hand-write an honestly-cited item — is the
manual version of the intended future shape:

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
5. **Never cite the uncited**: as demonstrated in Stage 2, a file merely
   *existing* in a searched folder is not sufficient grounds to cite it —
   only files actually opened and read.

## Scaling

At the current size (a few dozen items) `query.ts` does a linear scan with a
deterministic relevance score. If the knowledge base grows into the hundreds
or thousands of items (e.g. after real ingestion of the remaining files), add
an index (by domain / task type / target model) rather than changing the
query contract.
