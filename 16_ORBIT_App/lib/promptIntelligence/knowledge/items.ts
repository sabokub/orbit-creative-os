import { parsePromptKnowledgeItems, PromptKnowledgeItem } from "./schema";

/**
 * Seeded Knowledge Layer content.
 *
 * Honesty note (do not remove): every item below is attributed to
 * `"ORBIT Prompt Engineering Guidelines"`, a first-party knowledge base
 * written for this PR from genuine, well-established prompt-engineering
 * practice (prompt structure, image-prompt vocabulary, clarity rules,
 * model-specific quirks). It is NOT extracted from any uploaded PDF —
 * no such files exist in this repository/session. See
 * `lib/promptIntelligence/knowledge/README.md` for how real ingestion from
 * actual source documents would work once they are provided.
 */

const RAW_ITEMS: PromptKnowledgeItem[] = [
  // ---- structure -----------------------------------------------------------
  {
    id: "structure-subject-setting-style-tech",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Order image prompts subject → setting → style → technical details",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image", "sora-video"],
    principle:
      "Describe, in order: the subject/action, the setting/environment, the visual style/mood, then camera and technical parameters last.",
    rationale:
      "Image models weight earlier tokens more heavily for composition. Leading with the subject anchors the main content; trailing technical detail refines rendering without displacing the subject.",
    recommendedWording: "[subject/action], [setting], [style/mood], [camera/lens/lighting], [technical constraints]",
    structurePattern: "subject -> setting -> style -> technical",
    technicalVocabulary: [],
    goodExamples: [
      "A stylist arranging linen cushions on a corduroy sofa, sunlit apartment living room, editorial lifestyle mood, shot on 35mm, soft window light from the left",
    ],
    badExamples: ["35mm lens, soft light, editorial mood, apartment, sofa, stylist arranging cushions"],
    antiPatterns: ["Leading a prompt with camera/technical jargon before establishing subject and scene."],
    constraints: [],
    tags: ["ordering", "image"],
    confidence: 0.85,
    status: "active",
  },
  {
    id: "structure-role-objective-context-constraints",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Structure text prompts as role, objective, context, constraints, output format, verification",
    domain: "structure",
    taskTypes: ["general-text", "copywriting", "information-architecture", "consistency-review"],
    targetModels: ["openai-text", "claude-text", "manual-export"],
    principle:
      "A production prompt separates: who the model should act as, what the concrete objective is, what context it needs, what constraints bound the answer, what output format is required, and a checklist to self-verify against before returning the answer.",
    rationale:
      "Mixing role, context and constraints into one paragraph forces the model to disentangle intent from data; separating them into labeled sections reduces ambiguity and improves instruction-following, especially for multi-part deliverables.",
    recommendedWording: "Role: ... / Objective: ... / Context: ... / Constraints: ... / Output format: ... / Verify: ...",
    structurePattern: "role-objective-context-constraints-format-verification",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Burying the required output format in the middle of a long paragraph of context."],
    constraints: [],
    tags: ["structure", "text"],
    confidence: 0.9,
    status: "active",
  },
  {
    id: "structure-one-deliverable-per-step",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Chain prompts so each step produces one coherent deliverable",
    domain: "structure",
    taskTypes: ["general-text", "consistency-review"],
    targetModels: ["openai-text", "claude-text", "manual-export"],
    principle:
      "When a task has more than 3-4 genuinely distinct deliverables, split it into a chain of prompts — one per deliverable (or one small coherent group) — rather than requesting all of them in a single call.",
    rationale:
      "Long multi-deliverable prompts dilute attention across many instructions at once; the model tends to under-deliver on later items and truncate output length. Splitting into a chain lets each step get full attention and a realistic length budget, and lets a failed step be retried alone.",
    recommendedWording: undefined,
    structurePattern: "chain: step_n -> validate -> step_n+1",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: ["A single prompt asking for 13 distinct website deliverables at once."],
    antiPatterns: ["Requesting an entire site's worth of copy, structure, SEO and image prompts in one prompt."],
    constraints: [],
    tags: ["chaining", "budget"],
    confidence: 0.85,
    status: "active",
  },
  {
    id: "structure-carry-validated-decisions-forward",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Carry only validated prior decisions forward in a chain, not full transcripts",
    domain: "structure",
    taskTypes: ["general-text", "information-architecture", "consistency-review"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "Later steps in a chain should receive a compact summary of validated prior outputs relevant to them (e.g. the validated hero promise, not the entire previous response) rather than the full raw text of every earlier step.",
    rationale:
      "Passing entire prior deliverables verbatim into every subsequent prompt compounds token cost across a chain and re-introduces irrelevant detail the model has to filter out; a targeted summary keeps continuity without the overhead.",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Concatenating every previous step's full output into each new prompt."],
    constraints: [],
    tags: ["chaining", "context-selection"],
    confidence: 0.8,
    status: "active",
  },

  // ---- clarity / anti-pattern ------------------------------------------------
  {
    id: "clarity-avoid-vague-verbs",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Avoid vague verbs like 'improve', 'optimize', 'make better' without a measurable target",
    domain: "clarity",
    taskTypes: ["general-text", "copywriting"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "Replace vague instruction verbs ('improve', 'enhance', 'optimize') with a concrete, checkable action ('shorten to under 12 words', 'add one measurable proof point', 'remove passive voice').",
    rationale:
      "Vague verbs give the model no criterion for success, so it optimizes for plausible-sounding change rather than the actual goal — the output looks different but isn't reliably better.",
    badExamples: ["Improve this CTA.", "Make the hero copy more impactful."],
    goodExamples: ["Rewrite this CTA to name the specific action and result in 5 words or fewer."],
    antiPatterns: ["Vague improvement verbs with no measurable target."],
    technicalVocabulary: [],
    constraints: [],
    tags: ["clarity", "verbs"],
    confidence: 0.9,
    status: "active",
  },
  {
    id: "anti-pattern-motivational-filler",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Avoid motivational filler language that doesn't change model behavior",
    domain: "anti-pattern",
    taskTypes: ["general-text", "copywriting", "image-prompt"],
    targetModels: ["openai-text", "claude-text", "openai-image", "nano-banana-image"],
    principle:
      "Phrases like 'be world-class', 'think outside the box', 'be extremely creative and thoughtful' add length without adding information the model can act on. Replace them with a concrete constraint or example instead.",
    rationale:
      "These phrases have no operational meaning — they cannot be checked against the output, so they consume prompt budget without narrowing the solution space toward what's actually wanted.",
    badExamples: ["Be a world-class copywriter and write something amazing."],
    goodExamples: ["Write hero copy in 8-14 words, active voice, naming the outcome the reader gets."],
    antiPatterns: ["Generic superlatives ('world-class', 'amazing', 'best-in-class') with no operational meaning."],
    technicalVocabulary: [],
    constraints: [],
    tags: ["filler", "budget"],
    confidence: 0.85,
    status: "active",
  },
  {
    id: "anti-pattern-missing-output-format",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Always specify the exact output format and structure expected",
    domain: "output-format",
    taskTypes: ["general-text", "copywriting", "information-architecture", "faq", "seo"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "State explicitly whether the answer should be Markdown, JSON, a numbered list, a table, or plain prose — and the exact headings/keys expected — rather than leaving format to the model's default.",
    rationale:
      "Downstream parsing (e.g. this app's response-analysis pipeline, which matches Markdown headings) depends on predictable structure; an unspecified format produces inconsistent results that are harder to validate automatically.",
    technicalVocabulary: [],
    goodExamples: ["Respond in Markdown with one ## heading per deliverable, in this exact order: ..."],
    badExamples: [],
    antiPatterns: ["Omitting the required output format/structure entirely."],
    constraints: [],
    tags: ["output-format"],
    confidence: 0.9,
    status: "active",
  },
  {
    id: "anti-pattern-placeholder-output",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Explicitly forbid placeholders in the final deliverable",
    domain: "anti-pattern",
    taskTypes: ["general-text", "copywriting"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "Instruct the model to never use placeholders ('[insert benefit here]', 'TODO', 'Lorem ipsum') and to make a stated assumption instead when information is missing.",
    rationale:
      "Without this instruction, models sometimes leave structural placeholders when they lack a specific input, which silently produces an unusable deliverable that structural analysis must then flag after the fact.",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: ["[Insert compelling benefit statement here]"],
    antiPatterns: ["Placeholder text left in a final deliverable."],
    constraints: [],
    tags: ["placeholders"],
    confidence: 0.85,
    status: "active",
  },

  // ---- image vocabulary -------------------------------------------------------
  {
    id: "image-vocab-camera-lens",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Use concrete camera/lens vocabulary instead of generic quality adjectives",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Prefer concrete camera/lens terms (35mm, 50mm, wide angle, shallow depth of field, eye-level, low angle) over generic quality adjectives ('high quality', '4k', 'professional photo') which carry little compositional information.",
    rationale:
      "Concrete optical vocabulary maps to learned visual patterns (framing, distortion, depth) that generic quality words do not — they describe *how* the image should look, not just that it should look good.",
    technicalVocabulary: ["35mm", "50mm", "wide angle", "shallow depth of field", "eye-level", "low angle", "close-up", "medium shot"],
    goodExamples: ["shot on 35mm, shallow depth of field, eye-level framing"],
    badExamples: ["high quality, 4k, professional photo, best quality"],
    antiPatterns: ["Stacking generic quality adjectives instead of concrete camera/lens choices."],
    constraints: [],
    tags: ["camera", "lens"],
    confidence: 0.8,
    status: "active",
  },
  {
    id: "image-vocab-lighting",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Describe lighting by direction, quality and source, not just brightness",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Specify light direction (from the left, backlit, overhead), quality (soft, hard, diffused) and source (window light, flash, golden hour) rather than only brightness ('well lit', 'bright').",
    rationale:
      "Lighting direction and quality are the dominant drivers of mood and depth in a generated image; brightness alone under-specifies the scene and leaves rendering to chance.",
    technicalVocabulary: ["backlit", "golden hour", "window light", "diffused light", "hard shadow", "flash photography", "rim light"],
    goodExamples: ["soft window light from the left, golden hour warmth"],
    badExamples: ["well lit, bright, good lighting"],
    antiPatterns: ["Describing lighting only in terms of brightness."],
    constraints: [],
    tags: ["lighting"],
    confidence: 0.8,
    status: "active",
  },
  {
    id: "image-vocab-materials",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Name specific materials and textures rather than abstract mood words",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Name concrete materials (corduroy, linen, brushed brass, raw plaster, terracotta) instead of abstract mood adjectives (cozy, luxurious, elevated) to steer texture and material rendering.",
    rationale:
      "Material nouns give the model a specific visual reference; mood adjectives are compatible with too many different renderings to reliably produce a consistent visual identity.",
    technicalVocabulary: ["corduroy", "linen", "brushed brass", "raw plaster", "terracotta", "boucle", "rattan"],
    goodExamples: ["corduroy sofa, linen curtains, brushed brass fixtures"],
    badExamples: ["cozy, luxurious, elevated interior"],
    antiPatterns: ["Relying on abstract mood adjectives instead of naming materials."],
    constraints: [],
    tags: ["materials"],
    confidence: 0.75,
    status: "active",
  },
  {
    id: "image-vocab-negative-constraints",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "State negative constraints explicitly and specifically",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Name specifically what must not appear (no text overlays, no human faces, no visible logos, no clutter on the counter) rather than a generic 'avoid anything bad'.",
    rationale:
      "Specific negative constraints are checkable by a reviewer and by automated analysis; a vague negative instruction is neither followed reliably nor verifiable after generation.",
    technicalVocabulary: [],
    goodExamples: ["No text overlays. No visible brand logos. No people in frame."],
    badExamples: ["Avoid anything that looks bad or off-brand."],
    antiPatterns: ["Vague negative constraints with nothing concrete to check."],
    constraints: [],
    tags: ["negative-constraints"],
    confidence: 0.75,
    status: "active",
  },

  // ---- text deliverable / seo / ux -------------------------------------------
  {
    id: "text-cta-specificity",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "CTAs should name the action and the result, not a generic verb",
    domain: "text-deliverable",
    taskTypes: ["cta", "copywriting"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "A strong CTA names both the action and what the user gets ('Réserve ton diagnostic gratuit' rather than 'Cliquez ici' or 'En savoir plus').",
    rationale:
      "Generic CTAs ('cliquez ici', 'learn more') carry no information about value and consistently underperform in conversion; naming the outcome sets expectations and increases click intent.",
    technicalVocabulary: [],
    goodExamples: ["Réserve ton diagnostic gratuit", "Découvre ta direction artistique en 48h"],
    badExamples: ["Cliquez ici", "En savoir plus"],
    antiPatterns: ["Generic CTA verbs with no named outcome."],
    constraints: [],
    tags: ["cta"],
    confidence: 0.85,
    status: "active",
  },
  {
    id: "seo-meta-title-length",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Keep meta titles and descriptions within practical search-result length limits",
    domain: "seo",
    taskTypes: ["seo"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "Meta titles are commonly truncated by search engines beyond roughly 55-60 characters and meta descriptions beyond roughly 150-160 characters — write within those ranges so the full text is visible in results.",
    rationale:
      "These are practical display-length conventions widely used in on-page SEO practice (search engines render titles/descriptions in a fixed-width area); they are not a guaranteed technical limit, but writing within them avoids truncation in most cases.",
    technicalVocabulary: ["meta title", "meta description", "SERP"],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Meta titles/descriptions long enough to be truncated in search results."],
    constraints: ["Meta title <= 60 characters (practical guideline).", "Meta description <= 160 characters (practical guideline)."],
    tags: ["seo", "meta"],
    confidence: 0.6,
    status: "active",
  },
  {
    id: "ux-writing-one-idea-per-sentence",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "UX copy: one idea per sentence, active voice, name the user's action",
    domain: "text-deliverable",
    taskTypes: ["ux-writing", "copywriting"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "Interface copy should carry exactly one idea per sentence, use active voice, and name what the user does next rather than describing the product in the abstract.",
    rationale:
      "UX copy is scanned, not read; compound sentences and passive voice increase the cognitive cost of understanding what to do next, which measurably hurts task completion.",
    technicalVocabulary: [],
    goodExamples: ["Choisis ton style. On s'occupe du reste."],
    badExamples: ["Une expérience qui a été pensée pour être personnalisée par nos experts selon vos goûts."],
    antiPatterns: ["Compound sentences describing the product instead of the user's next action."],
    constraints: [],
    tags: ["ux-writing"],
    confidence: 0.75,
    status: "active",
  },
  {
    id: "info-architecture-scannable-sitemap",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Sitemaps and homepage structures should be scannable lists, not prose",
    domain: "structure",
    taskTypes: ["information-architecture"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "Ask explicitly for a bulleted/numbered list of pages or sections (one line per item) rather than a paragraph describing the site structure in prose.",
    rationale:
      "This app's structural analysis (and human reviewers) parse sitemaps and homepage structures as list items; prose descriptions are harder to verify for completeness and harder to act on directly.",
    technicalVocabulary: [],
    goodExamples: ["- Accueil\n- À propos\n- Offres\n- Portfolio\n- Contact"],
    badExamples: ["Le site comportera une page d'accueil, suivie d'une page à propos, puis..."],
    antiPatterns: ["Describing a sitemap in prose instead of a list."],
    constraints: [],
    tags: ["sitemap", "structure"],
    confidence: 0.8,
    status: "active",
  },

  // ---- model quirks -----------------------------------------------------------
  {
    id: "model-quirk-openai-json-mode",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "When strict JSON is required from an OpenAI text model, ask for JSON only, no surrounding prose",
    domain: "model-quirk",
    taskTypes: ["general-text"],
    targetModels: ["openai-text"],
    principle:
      "When a structured JSON response is required, explicitly instruct 'respond with a single JSON object only, no markdown fences, no explanatory text' and validate the result server-side rather than trusting it blindly.",
    rationale:
      "This mirrors the existing pattern already used in this codebase (lib/responseAnalysis/semantic.ts): the model is asked for pure JSON, but the caller always Zod-validates the response and has an explicit stricter-reminder retry rather than trusting the first response.",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Parsing model JSON output without schema validation."],
    constraints: [],
    tags: ["json", "openai"],
    confidence: 0.7,
    status: "active",
  },
  {
    id: "model-quirk-claude-long-context-structure",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "For Claude-style models, use clear section labels/XML-like tags for long structured context",
    domain: "model-quirk",
    taskTypes: ["general-text", "consistency-review"],
    targetModels: ["claude-text"],
    principle:
      "When a prompt carries multiple distinct blocks of context (brand DNA, brief, prior deliverables), label each block clearly (plain headings or simple tags) rather than a single undifferentiated block of text.",
    rationale:
      "Clear section labeling is a widely-documented practice for keeping long, multi-part context unambiguous regardless of model family — it reduces the chance the model conflates content from two different sources.",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Concatenating brand DNA, brief and prior outputs with no labeling."],
    constraints: [],
    tags: ["structure", "claude"],
    confidence: 0.6,
    status: "active",
  },
  {
    id: "model-quirk-image-model-param-caution",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Do not assert image-model API parameters you are not certain currently exist",
    domain: "model-quirk",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image", "sora-video"],
    principle:
      "Prompt profiles for image/video models should describe vocabulary and structure conventions, not claim specific undocumented API parameters (aspect ratio flags, seed syntax, negative-prompt fields) exist for a given model unless independently confirmed — those change frequently across providers.",
    rationale:
      "Third-party image/video model APIs change parameters and syntax often; hard-coding an unconfirmed parameter into a 'best practice' risks producing prompts that reference features that don't exist, which is worse than omitting them.",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Asserting a specific --flag or API parameter for an image model without confirming it currently exists."],
    constraints: [],
    tags: ["image", "caution"],
    confidence: 0.9,
    status: "active",
  },

  // ---- brand fit ---------------------------------------------------------------
  {
    id: "brand-fit-avoid-list-is-a-hard-constraint",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Brand 'avoid' lists are hard constraints, not stylistic suggestions",
    domain: "brand-fit",
    taskTypes: ["general-text", "copywriting", "image-prompt"],
    targetModels: ["openai-text", "claude-text", "openai-image", "nano-banana-image"],
    principle:
      "When a Brand DNA profile defines an explicit 'avoid' list, state it as a hard constraint in the prompt ('never produce: ...') rather than folding it into general tone guidance where it can be deprioritized.",
    rationale:
      "General tone guidance competes with many other instructions for the model's attention; an explicit hard-constraint framing keeps brand-safety items from being silently dropped in a long prompt.",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Mentioning brand 'avoid' items only once, buried inside a paragraph of tone description."],
    constraints: [],
    tags: ["brand", "constraints"],
    confidence: 0.75,
    status: "active",
  },
  {
    id: "brand-fit-dont-restate-full-dna-every-step",
    sourceDocument: "ORBIT Prompt Engineering Guidelines",
    title: "Only include the Brand DNA fields relevant to the current step",
    domain: "brand-fit",
    taskTypes: ["general-text", "information-architecture", "image-prompt"],
    targetModels: ["openai-text", "claude-text", "openai-image", "nano-banana-image"],
    principle:
      "A step producing a sitemap needs audience/positioning/offer, not photography direction or content-calendar direction; a step producing a hero image brief needs visual direction and photography direction, not SEO tone. Select only the Brand DNA fields the step actually needs.",
    rationale:
      "Injecting the full Brand DNA profile into every step wastes prompt budget on irrelevant fields and can dilute the fields that actually matter for that step's decision.",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Pasting the entire Brand DNA profile into every prompt regardless of relevance."],
    constraints: [],
    tags: ["brand", "context-selection"],
    confidence: 0.8,
    status: "active",
  },
];

export const SEEDED_PROMPT_KNOWLEDGE: PromptKnowledgeItem[] = parsePromptKnowledgeItems(RAW_ITEMS);
