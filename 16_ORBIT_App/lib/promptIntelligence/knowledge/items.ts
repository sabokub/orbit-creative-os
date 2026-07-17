import { z } from "zod";
import { parsePromptKnowledgeItems, PromptKnowledgeItemSchema } from "./schema";

/** Input shape (pre-Zod-defaults) — lets individual items omit array fields that default to []. */
type RawKnowledgeItem = z.input<typeof PromptKnowledgeItemSchema>;

/**
 * Seeded Knowledge Layer content.
 *
 * Provenance (do not remove — see knowledge/README.md "Provenance history"
 * for the full account): items below come from two honestly-distinct
 * sources:
 *
 *  1. Real documents in the user's Google Drive ("Ohneis Ressources" /
 *     "Ohneis Ressources 2"), independently confirmed to exist and read in
 *     full by this codebase's own author via `search_files` +
 *     `read_file_content` tool calls in this session — not relayed
 *     secondhand. All 23 files across the two priority folders have now
 *     been personally opened and read; not all 23 are cited below — a
 *     handful yielded no distinct, non-redundant principle beyond what an
 *     already-cited document captures, and are explicitly listed as
 *     "read, not cited" in knowledge/README.md's provenance table rather
 *     than silently dropped. `goodExamples`/`badExamples` below are
 *     paraphrased distillations of what cited documents illustrate, not
 *     verbatim reproductions of their (sometimes proprietary, sometimes
 *     unsuitable-for-reuse) example prompts.
 *  2. `"ORBIT Prompt Engineering Guidelines"` — first-party content authored
 *     for this PR, used only where the real documents above (which are all
 *     general AI-image/product-photography prompting material) don't apply:
 *     website copywriting structure, SEO length conventions, UX writing,
 *     Brand-DNA/Studio-Brain integration, and this app's own prompt-chaining
 *     mechanics.
 */

const RAW_ITEMS: RawKnowledgeItem[] = [
  // ---- structure (real sources) -----------------------------------------------
  {
    id: "real-prompt-structured-ordering",
    sourceDocument: "Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf",
    additionalSources: ["04-The Three Pillars of Professional AI Image Creation.pdf"],
    title: "Order image prompts Subject > Action > Setting > Style > Technical Details",
    domain: "structure",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image", "sora-video"],
    principle:
      "Organize an image prompt logically: [Subject Description] [Action/Pose] in [Environment/Setting], [Lighting Conditions], [Style/Medium], [Camera Specifications], [Technical Parameters], with negative prompts last.",
    rationale:
      "The source document states this directly: \"Structure Matters: Organize your prompt logically\" and \"Keyword Weighting: Words appearing earlier often have more influence; some platforms allow explicit weighting.\" Leading with the subject anchors composition before technical detail refines it.",
    recommendedWording: "[subject/action] in [setting], [lighting], [style/medium], [camera specs], [technical parameters] --no [exclusions]",
    structurePattern: "subject -> action -> setting -> lighting -> style -> camera -> technical -> negative",
    technicalVocabulary: [],
    goodExamples: [
      "A stylist arranging linen cushions on a corduroy sofa in a sunlit apartment living room, editorial lifestyle mood, shot on 35mm, soft window light from the left, --no clutter, watermarks",
    ],
    badExamples: ["35mm lens, soft light, editorial mood, apartment, sofa, stylist arranging cushions"],
    antiPatterns: ["Leading a prompt with camera/technical jargon before establishing subject and scene."],
    constraints: [],
    tags: ["ordering", "image"],
    confidence: 0.85,
    status: "active",
  },
  {
    id: "real-3-pillar-system",
    sourceDocument: "04-The Three Pillars of Professional AI Image Creation.pdf",
    title: "Separate an image prompt into Structure, Reference, and Vision layers",
    domain: "structure",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Build (and review) an image prompt as three distinct layers: Structure (camera, lighting, material, composition — the technical foundation), Reference (named photographers/movements/eras that anchor a style vocabulary), and Vision (the emotional intent — what the viewer should feel).",
    rationale:
      "Quoting the source directly: \"Structure is your technical foundation... Reference gives you style... Vision is about soul... this pillar separates good technical work from memorable art by defining the emotional intent.\" Keeping the three layers distinct avoids blending technical specification with emotional language, which tends to produce vague prompts.",
    structurePattern: "structure -> reference -> vision",
    technicalVocabulary: [],
    goodExamples: [
      "Structure: 85mm lens, soft window lighting, shallow depth of field. Reference: contemporary editorial portrait photography. Vision: quiet confidence, approachable authority.",
    ],
    badExamples: ["Cool motorcycle at night."],
    antiPatterns: ["Writing only technical specification with no stated emotional intent, or only mood language with no technical foundation."],
    constraints: [],
    tags: ["3-pillar", "image"],
    confidence: 0.85,
    status: "active",
  },
  {
    id: "real-vision-analysis-first-pattern",
    sourceDocument: "Fashion Pipeline.pdf",
    additionalSources: ["Jewelry Pipeline.pdf", "Beverage Pipeline.pdf"],
    title: "Extract named subject attributes once, then inject them into every downstream prompt in a chain",
    domain: "structure",
    taskTypes: ["image-prompt", "consistency-review"],
    targetModels: ["openai-text", "claude-text", "openai-image", "nano-banana-image"],
    principle:
      "Before generating any variant of a real subject across a multi-step pipeline, run a separate analysis step that names its defining attributes explicitly (object type, primary material, primary color, distinguishing details) as reusable variables, then inject those exact variables into every subsequent prompt in the chain.",
    rationale:
      "This pattern recurs, near-identically, across three e-commerce pipeline documents read this session. Fashion: \"These variables inject into EVERY downstream prompt... no hallucination.\" Jewelry: \"Phase 1 runs vision analysis... extracts the variables that downstream prompts will need.\" Beverage calls it the 'Cognitive Anchor': \"Reference Beats Description... More precise than text.\" Independent convergence across three unrelated documents is strong corroboration, and matches this app's own context-selection principle: pass only named, validated prior-step outputs forward rather than re-deriving context each time.",
    technicalVocabulary: ["object type", "primary material", "primary color", "vision analysis block", "cognitive anchor"],
    goodExamples: ["Extract once: 'waxed cotton field jacket, deep navy, leather collar trim, two patch hip pockets' — reuse in every later prompt."],
    badExamples: ["Re-describing the subject freehand in each new prompt of a multi-step pipeline, risking drift between steps."],
    antiPatterns: ["Letting each step in a chain re-imagine subject details instead of reusing a single validated description."],
    constraints: [],
    tags: ["chaining", "context-selection"],
    confidence: 0.75,
    status: "active",
  },
  {
    id: "real-comparison-loop-iterative-refinement",
    sourceDocument: "05-Accelerated Aesthetic Development- AI-Powered Visual Mastery.pdf",
    additionalSources: ["Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf"],
    title: "Iterate on one named gap at a time against a chosen reference, not a full prompt rewrite",
    domain: "structure",
    taskTypes: ["image-prompt", "consistency-review"],
    targetModels: ["openai-image", "nano-banana-image", "openai-text", "claude-text"],
    principle:
      "Generate, place the result beside a chosen reference image, identify one specific weakness (not a vague 'make it better'), adjust the prompt to address only that one element, then regenerate and compare again.",
    rationale:
      "Quoting the source's own method: \"Identify one specific weakness / Adjust your prompt to address it / Regenerate and compare again.\" The companion source's advanced-technique section reinforces the same idea: \"Change just one element at a time to see its impact.\" Changing one variable per iteration makes it possible to attribute a quality change to a specific prompt edit.",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: ["Rewriting an entire prompt from scratch after a single unsatisfying result, losing track of which change helped."],
    antiPatterns: ["Changing many prompt elements at once between iterations, making it impossible to tell what improved or worsened the result."],
    constraints: [],
    tags: ["iteration", "image"],
    confidence: 0.7,
    status: "active",
  },

  // ---- clarity / anti-pattern (mixed real + first-party) -----------------------
  {
    id: "real-specificity-reduces-guesswork",
    sourceDocument: "Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf",
    additionalSources: ["03-Technical Language- The Bridge Between Vision and AI.pdf"],
    title: "Specificity is Key: detailed prompts reduce the AI's guesswork",
    domain: "clarity",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Replace a bare subject/mood description with concrete, specific detail — named action, named setting, named technical parameters — because vague prompts force the model to guess.",
    rationale:
      "Quoting the source's first core principle: \"Specificity is Key: Detailed prompts reduce the AI's guesswork and produce more targeted results.\" The companion document gives the same lesson from the opposite direction, showing a documented weak/strong pair: \"Wrong: 'A businessman in an office' / Right: 'Medium shot of a businessman at f/2.8, 85mm lens, side-lit by large window, reviewing documents with focused expression...'\"",
    badExamples: ["A businessman in an office.", "Cool motorcycle at night."],
    goodExamples: [
      "Medium shot of a businessman at f/2.8, 85mm lens, side-lit by a large window, reviewing documents with a focused expression, shallow depth of field isolating him from a blurred office background.",
    ],
    antiPatterns: ["Vague subject/mood description with no concrete technical or compositional detail."],
    technicalVocabulary: [],
    constraints: [],
    tags: ["clarity", "specificity"],
    confidence: 0.85,
    status: "active",
  },
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
      "Vague verbs give the model no criterion for success, so it optimizes for plausible-sounding change rather than the actual goal — the output looks different but isn't reliably better. This is the text-deliverable analogue of the image-prompting 'specificity' principle above; none of the real source documents (all image/product-photography focused) address text-editing instructions directly, so this stays first-party.",
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
  {
    id: "real-negative-prompting-explicit-exclusions",
    sourceDocument: "Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf",
    title: "End image prompts with an explicit, named exclusion list",
    domain: "anti-pattern",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Name specifically what must not appear (distorted features, text, watermarks, unwanted elements) at the end of the prompt, rather than a generic 'avoid anything bad'.",
    rationale:
      "The source documents this as a standard structural component (\"-- distorted features, text, watermarks\") and gives a troubleshooting table mapping named problems to named negative terms (e.g. \"Distorted faces: Add --no deformed features, distorted face\"). Specific negative constraints are checkable by a reviewer; a vague negative instruction is not.",
    technicalVocabulary: [],
    goodExamples: ["-- distorted features, text, watermarks, low-res artifacts"],
    badExamples: ["Avoid anything that looks bad or off-brand."],
    antiPatterns: ["Vague negative constraints with nothing concrete to check."],
    constraints: [
      "The exact '--no'/'--ar'/'--seed' flag syntax documented in this source is specific to certain platforms (Midjourney-style tools) — treat it as an example convention, not a universal API parameter (see model-quirk-image-model-param-caution).",
    ],
    tags: ["negative-constraints", "image"],
    confidence: 0.75,
    status: "active",
  },

  // ---- image vocabulary (real sources) ------------------------------------------
  {
    id: "real-camera-lens-vocabulary",
    sourceDocument: "03-Technical Language- The Bridge Between Vision and AI.pdf",
    additionalSources: ["Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf"],
    title: "Choose focal length, aperture and camera angle deliberately, not decoratively",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Pick lens/aperture/angle for the compositional and emotional effect they're documented to produce, and name them explicitly instead of a generic quality adjective.",
    rationale:
      "Quoting the source's own vocabulary tables: \"85-135mm Medium Telephoto: Professional portraits, fashion, beautiful bokeh\", \"f/1.2-f/1.8: Extreme shallow depth, dreamlike bokeh, low-light capability\", \"Low Angle: Subject dominance, heroic feel, architectural strength\", \"High Angle: Vulnerability, overview, diminished subject.\" These map technical choices to specific, checkable effects, unlike 'high quality, 4k, professional photo'.",
    technicalVocabulary: [
      "24mm wide-angle", "35-50mm standard", "85mm short telephoto", "135-300mm long telephoto",
      "f/1.4-f/1.8 shallow depth of field", "f/8-f/11 landscape sharpness",
      "eye-level", "low-angle", "high-angle", "worm's-eye view", "dutch angle",
    ],
    goodExamples: ["85mm lens, f/2.0, low-angle, subject dominance"],
    badExamples: ["high quality, 4k, professional photo, best quality"],
    antiPatterns: ["Stacking generic quality adjectives instead of naming a lens/aperture/angle choice and its intended effect."],
    constraints: [],
    tags: ["camera", "lens"],
    confidence: 0.8,
    status: "active",
  },
  {
    id: "real-lighting-vocabulary",
    sourceDocument: "03-Technical Language- The Bridge Between Vision and AI.pdf",
    title: "Describe lighting by source, direction, quality and color temperature, not just brightness",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Specify light source (window, strobe, neon), direction (front/side/back-lit), quality (hard/soft/diffused) and color temperature rather than only brightness ('good lighting').",
    rationale:
      "The source names this as a 'fatal mistake': \"Wrong: 'Good lighting' / Right: 'Key light from large softbox positioned 45° camera right, fill light from silver reflector camera left at 1/4 power, subtle rim light from behind for edge separation.'\" It also documents concrete color-temperature vocabulary: warm tungsten (2700K), neutral daylight (5600K), cool LED (6500K).",
    technicalVocabulary: [
      "hard light", "soft light", "directional light", "diffused light",
      "backlighting / rim light", "side lighting", "2700K warm tungsten", "5600K neutral daylight", "6500K cool LED",
    ],
    goodExamples: ["Key light from a large softbox at 45° camera right, fill from a silver reflector camera left, subtle rim light for edge separation."],
    badExamples: ["Good lighting.", "well lit, bright"],
    antiPatterns: ["Describing lighting only in terms of brightness."],
    constraints: [],
    tags: ["lighting"],
    confidence: 0.85,
    status: "active",
  },
  {
    id: "real-material-texture-specificity",
    sourceDocument: "03-Technical Language- The Bridge Between Vision and AI.pdf",
    additionalSources: ["Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf"],
    title: "Name concrete surface properties and material states instead of a bare object noun",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Describe surface properties (glossy, matte, brushed, weathered) and texture detail (fabric weave, wood grain, metal scratches) rather than naming only the object.",
    rationale:
      "The source's documented 'fatal mistake': \"Wrong: 'Luxury watch' / Right: 'Swiss luxury watch with brushed steel case showing micro-scratches, sapphire crystal with anti-reflective coating, black leather strap with visible grain texture...'\"",
    technicalVocabulary: ["glossy", "matte", "brushed", "weathered", "patinated", "fabric weave", "wood grain"],
    goodExamples: ["Brushed steel case with micro-scratches, black leather strap with visible grain texture."],
    badExamples: ["Luxury watch.", "cozy, luxurious, elevated interior"],
    antiPatterns: ["Naming an object with no surface/material detail."],
    constraints: [],
    tags: ["materials"],
    confidence: 0.8,
    status: "active",
  },
  {
    id: "real-reference-image-consistency-lock",
    sourceDocument: "Furniture Pipeline.pdf",
    additionalSources: ["Fashion Pipeline.pdf", "Jewelry Pipeline.pdf", "Beverage Pipeline.pdf"],
    title: "Lock a reference image as the structural anchor when generating variants of a real subject",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "When generating multiple variants of the same real subject (a different angle, color, material, or setting), explicitly instruct the model to treat one reference image as a strict structural/geometry lock, and state in words exactly what must stay identical versus what the one named target attribute is allowed to change. End the prompt with an explicit prohibition list naming exactly what must never happen.",
    rationale:
      "This is the shared consistency mechanism across all four e-commerce pipeline documents read this session. Furniture: \"Do NOT change the geometry, color, or style of the furniture.\" Fashion: \"fabric/face material, texture and weight exactly identical — only the [color] change.\" Jewelry closes every phase with a prohibition list: \"Never change [PIECE_TYPE] silhouette... Never hallucinate design details not present in the reference.\" Beverage names it directly: \"No Hallucinated Objects: Every prompt contains an explicit prohibition list.\" Without this explicit lock, variant-generation tends to drift from the original subject.",
    technicalVocabulary: ["structural reference", "geometry lock", "master image", "prohibition list"],
    goodExamples: [
      "Use the attached image as a strict structural reference. Change only the upholstery color to the target; keep stitching pattern, seam placement, and proportions identical.",
    ],
    badExamples: ["Generate the same sofa in navy blue." /* — no explicit lock on what must stay unchanged */],
    antiPatterns: ["Requesting a variant of a real subject without stating what must remain identical, allowing the model to redesign it."],
    constraints: [],
    tags: ["consistency", "product-photography"],
    confidence: 0.75,
    status: "active",
  },

  // ---- text deliverable / seo / ux (first-party — no real source covers this) --
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

  // ---- model quirks (mixed real + first-party) ----------------------------------
  {
    id: "real-gpt-as-structured-prompt-intermediary",
    sourceDocument: "Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf",
    sourcePageOrSection: "Appendix: Advanced Prompt Engineering for AI Image Models Using GPT",
    title: "Use a text/reasoning model to expand a short brief into a structured image prompt",
    domain: "model-quirk",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "A text/reasoning model can act as an intermediate 'visual prompt engine': given a short creative brief, it expands it into a fully structured, technically detailed image prompt (Subject → Action → Setting → Materials → Light → Mood → Camera → Style) before that prompt is sent to an image generator.",
    rationale:
      "Quoting the source's appendix: \"GPT is not just a language model—it can act as a powerful visual prompt generator... It does not generate images itself, but it helps shape your prompt vocabulary with far more control, modularity, and refinement than most direct image generation UIs allow.\" This directly validates this app's own architecture choice for the hero-image-direction/section-image-prompts Website chain steps, which target a text model (not an image model) to produce structured image-direction text.",
    technicalVocabulary: [],
    goodExamples: ["\"Let's build the prompt in parts. First, describe only the subject. Then add the setting. Then mood. Then lens. Each in a new paragraph.\""],
    badExamples: [],
    antiPatterns: ["Sending a one-line creative brief directly to an image model instead of first structuring it."],
    constraints: [],
    tags: ["gpt", "image", "chaining"],
    confidence: 0.7,
    status: "active",
  },
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
      "Third-party image/video model APIs change parameters and syntax often; hard-coding an unconfirmed parameter into a 'best practice' risks producing prompts that reference features that don't exist, which is worse than omitting them. (One real source document does confirm concrete Midjourney-specific flags — --ar, --s, --c, --seed — which corroborates that such parameters are real but tool-specific, not a universal image-model API; see real-negative-prompting-explicit-exclusions.)",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Asserting a specific --flag or API parameter for an image model without confirming it currently exists."],
    constraints: [],
    tags: ["image", "caution"],
    confidence: 0.9,
    status: "active",
  },

  // ---- brand fit (first-party — specific to this app's Studio Brain / Brand DNA model) --
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
  {
    id: "real-consistency-beats-perfection",
    sourceDocument: "02-Mastering Visual Instinct- From Random to Intentional AI Art.pdf",
    title: "One perfect image is worthless for a brand; a repeatable visual system is what matters",
    domain: "brand-fit",
    taskTypes: ["image-prompt", "consistency-review"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Judge a generated image not only on its own merit but on whether it reproduces the same lighting, composition and mood as prior validated outputs for the same brand/subject — a recognizable, repeatable system beats one lucky great image.",
    rationale:
      "Quoting the source directly: \"One 'perfect' image that you can't reproduce is worthless for building a brand or style. But ten solid images that share consistent lighting, composition, and mood? That's a visual language... Your goal isn't to create the perfect image. It's to create a perfect system for creating images.\" This directly corroborates this app's own product decision to require section-image-prompts to stay consistent with the validated hero-image-direction (see WEBSITE_CHAIN section-image-prompts.dependsOnSteps).",
    technicalVocabulary: [],
    goodExamples: [],
    badExamples: [],
    antiPatterns: ["Approving an individually strong image that doesn't match the lighting/composition/mood of already-validated brand images."],
    constraints: [],
    tags: ["consistency", "brand"],
    confidence: 0.75,
    status: "active",
  },

  // ---- structure (chaining — first-party, specific to this app's own chain design) --
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

  // ---- real sources — second reading pass (remaining 13 of the 23 priority documents) --
  {
    id: "real-intentional-imperfection-vs-ai-smoothness",
    sourceDocument: "972181274-7-Master-Prompts-That-Actually-Work.pdf",
    additionalSources: ["Mixed Media Prompts.pdf"],
    title: "Name specific imperfection markers to counter the generic 'AI-smooth' look",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "Deliberately name small, physically-plausible imperfections (a dusty fingerprint, an uneven glaze drip, a torn paper edge, natural skin texture, scanned-paper grain) as part of the prompt — not because they're flaws, but because their presence or absence is what reads as 'real' versus 'obviously AI'.",
    rationale:
      "Quoting the source's own breakdown of what separates amateur from professional prompts: \"Intentional Imperfection: The details that scream 'real' — Dusty fingerprint / Uneven glaze line / Peeling sticker edge / Natural skin texture.\" The companion document states the underlying reason explicitly: \"The signal for 'AI-made' is smoothness. Cleanness. Too-perfect edges, too-even lighting, no visible texture. Both prompts here reject all of it and ask for the opposite... They tell the AI to work with scissors instead of pixels.\"",
    technicalVocabulary: ["dusty fingerprint", "uneven glaze line", "torn paper edge", "scanned paper grain", "film grain"],
    goodExamples: ["A dusty fingerprint near the base, a slight lip irregularity, microbubbles in the glaze."],
    badExamples: ["A perfectly smooth, flawless, pristine ceramic cup."],
    antiPatterns: ["Describing a handmade or lived-in object with only flawless/pristine/perfect language."],
    constraints: [],
    tags: ["texture", "authenticity"],
    confidence: 0.7,
    status: "active",
  },
  {
    id: "real-video-prompt-structure-components",
    sourceDocument: "AI Sora Prompt – Vol. 2.pdf",
    title: "Structure a video prompt as framing/lens, lighting, motion behavior, texture cues, and environment",
    domain: "video-vocabulary",
    taskTypes: ["video-prompt"],
    targetModels: ["sora-video"],
    principle:
      "Build a video prompt from five distinct components: framing and lens choice, lighting style, motion behavior (including how much motion is absent — locked/frozen vs. flowing), texture and realism cues, and background/environmental design — rather than one continuous descriptive paragraph.",
    rationale:
      "The source states this as its own structure explicitly: \"The structure of each variation includes: Framing and lens choice – Lighting style – Motion behavior (or lack of motion) – Texture and realism cues – Background and environmental design.\" Naming what does NOT move is as important as naming what does: the source's own master prompt specifies \"The camera remains locked or deliberately composed... Movement is minimal, hyper-controlled, or frozen mid-air.\"",
    structurePattern: "framing/lens -> lighting -> motion -> texture -> environment",
    technicalVocabulary: ["locked camera", "frozen mid-air", "macro lens", "24mm wide-angle", "motion blur", "film grain"],
    goodExamples: ["Camera locked with a 100mm macro lens. Movement minimal — one droplet slowly elongates; everything else still."],
    badExamples: ["A cinematic video of a dog jumping." /* — no framing, lighting, motion, texture, or environment specified */],
    antiPatterns: ["Describing a video prompt's subject only, with no explicit motion/stillness instruction."],
    constraints: [],
    tags: ["video", "structure"],
    confidence: 0.7,
    status: "active",
  },
  {
    id: "real-explicit-preservation-directive-for-edits",
    sourceDocument: "Grok Imagine Guideline.pdf",
    additionalSources: ["Image Enhancer _ Restorer prompt.pdf"],
    title: "For local edits/enhancement, open with an absolute preservation list before describing the change",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "When the task is a targeted edit or quality enhancement (not full regeneration), open the prompt with an explicit list of what must remain 100% pixel-identical (subject identity, pose, clothing, background, lighting direction), then describe the transformation, then close with a specific negative-prompt list.",
    rationale:
      "Both sources use near-identical structure for this. Grok Imagine Guideline: \"CORE DIRECTIVE: MASKING PRESERVATION... Subject Freeze: The subject's skin, face, hands, feet, hair, and the entire background must remain 100% pixel-identical.\" Image Enhancer/Restorer: \"CORE DIRECTIVE: QUALITY ENHANCEMENT ONLY — ZERO CONTENT ALTERATION... The following must remain 100% pixel-identical: Subject identity... Body... Clothing... Hair... Background... HARD ALTERATION RULE: Do NOT reinterpret, restyle, or modify any visual [content].\" Both close with a long, specific negative-prompt list (e.g. \"altered hair, spotted skin, plastic skin, AI-smoothing effect, changed composition, added elements, removed elements, different lighting direction\").",
    technicalVocabulary: ["pixel-identical", "subject freeze", "hard alteration rule"],
    goodExamples: ["Preserve 100%: facial features, pose, clothing, background, lighting direction. Change only: [named target]."],
    badExamples: ["Make the bed white paper instead." /* — no preservation list, risks the model altering more than intended */],
    antiPatterns: ["Describing only the desired change with no explicit list of what must stay untouched."],
    constraints: [],
    tags: ["editing", "preservation", "negative-constraints"],
    confidence: 0.75,
    status: "active",
  },
  {
    id: "real-locked-aesthetic-single-variable-template",
    sourceDocument: "Adobe Stickers Prompt.pdf",
    additionalSources: ["Marker Style Prompt.pdf", "Risograph Print Style.pdf"],
    title: "Write a style prompt as a fixed aesthetic template with exactly one swappable subject variable",
    domain: "structure",
    taskTypes: ["image-prompt"],
    targetModels: ["openai-image", "nano-banana-image"],
    principle:
      "When a prompt needs to apply the same visual style/aesthetic to many different subjects, write the entire prompt to describe the aesthetic (material, finish, shape logic, surface, palette) and reduce the subject itself to a single named variable used consistently everywhere it appears — never re-describe the aesthetic per subject.",
    rationale:
      "Quoting the source directly: \"The problem with sticker prompts is that most of them describe the object, not the aesthetic... These two do the opposite. The whole prompt describes the aesthetic... The object itself is one variable: [OBJECT].\" The same locked-template structure recurs in the marker-style guide (a fixed 4-step technique applied to any subject) and the risograph guide (a fixed ink/paper/misregistration recipe applied to any input image) — both keep every technical/stylistic rule constant and vary only the subject reference.",
    technicalVocabulary: ["template variable", "locked aesthetic"],
    goodExamples: ["A single [FINISH] sticker representing [OBJECT], with [FIXED STYLE RULES] — replace only [OBJECT] across regenerations."],
    badExamples: ["Writing a brand-new style description from scratch every time the subject changes."],
    antiPatterns: ["Re-deriving style/material/palette rules per-subject instead of reusing one locked template."],
    constraints: [],
    tags: ["template", "consistency"],
    confidence: 0.7,
    status: "active",
  },
  {
    id: "real-bridge-frame-video-transition",
    sourceDocument: "Pixel Transition Workflow.pdf",
    title: "Generate a bridging still to connect two real stills, then let the video model invent only the connecting motion",
    domain: "video-vocabulary",
    taskTypes: ["video-prompt"],
    targetModels: ["sora-video"],
    principle:
      "For a cinematic transition between two real locations/scenes, generate one AI bridging image (e.g. an extreme close-up of a shared visual anchor) locked to the same environment as the first still, then have the video model animate only between still-pairs (start → bridge, bridge → end) rather than generating the whole transition from a single text description.",
    rationale:
      "Quoting the source's own reasoning: \"Good photos are way easier than good video. Let the AI do the move... You don't shoot the move. You shoot two stills and let [the video model] invent the camera path between them.\" And on why locking the bridge image to the source environment matters: \"Locking the phone and environment means Frame B inherits the exact lighting and angle of Frame A. [The model] only has to invent the camera move — not invent the world. That's why it stays consistent.\"",
    structurePattern: "still A -> generated bridge still -> still C, animate A->bridge and bridge->C separately, then stitch",
    technicalVocabulary: ["bridge frame", "start-to-end-frame animation"],
    goodExamples: [],
    badExamples: ["Asking a video model to generate an entire multi-location transition from a single text prompt with no anchor stills."],
    antiPatterns: ["Generating a complex camera move from scratch instead of constraining it between two real/generated anchor frames."],
    constraints: [],
    tags: ["video", "transition"],
    confidence: 0.65,
    status: "active",
  },
  {
    id: "real-edge-only-lens-transform-skeleton",
    sourceDocument: "Lens Transition Effect.pdf",
    title: "For a lens/optical-character restyle, lock the center and push the transformation to the edges only",
    domain: "image-vocabulary",
    taskTypes: ["image-prompt", "video-prompt"],
    targetModels: ["openai-image", "nano-banana-image", "sora-video"],
    principle:
      "When restyling an image or video frame to simulate a different lens (anamorphic, ultra-wide, probe lens), follow a fixed 5-step skeleton: (1) name the lens perspective, (2) state the center stays exactly as-is (subject, composition, sharpness), (3) push the lens character to the outer/edge areas only (distortion, curvature, field of view), (4) allow the periphery to extend/complete with subtle invented content if needed, (5) lock the final framing and aspect ratio.",
    rationale:
      "Quoting the source's documented skeleton directly: \"01 Name the lens perspective you want. 02 Say the center stays exactly as it is—subject, composition, sharpness. 03 Push the lens character to the outer areas: distortion, curvature, field of view. 04 Allow the periphery to extend or complete with subtle invented content if needed. 05 End by locking the framing and aspect ratio.\" It also names why this works: \"The center stays sharp and unchanged—that's why the subject reads correctly.\"",
    structurePattern: "name lens -> lock center -> transform edges -> allow periphery completion -> lock framing",
    technicalVocabulary: ["anamorphic", "probe lens", "ultra-wide", "edge distortion", "field of view"],
    goodExamples: [],
    badExamples: ["Applying a lens-style transformation prompt to the whole frame uniformly, distorting the main subject along with the edges."],
    antiPatterns: ["Not distinguishing which region of the frame a stylistic transformation should and shouldn't touch."],
    constraints: [],
    tags: ["lens", "editing"],
    confidence: 0.65,
    status: "active",
  },
  {
    id: "real-deconstruct-then-rebuild-reference",
    sourceDocument: "UGC Agent One.pdf",
    title: "Deconstruct why a reference works before rebuilding it around a new subject",
    domain: "structure",
    taskTypes: ["general-text", "image-prompt", "consistency-review"],
    targetModels: ["openai-text", "claude-text"],
    principle:
      "Before generating new content in the style of a proven reference, run an explicit two-step process: first analyze the reference to name its structure (hook, emotional trigger, why it works, visual/verbal grammar), then — as a separate step — rebuild that same structure around the new subject, rather than jumping straight to 'make something like this'.",
    rationale:
      "Quoting the source's own two-prompt workflow: Prompt 1 \"Reads a [reference] and breaks it down: hook, emotional trigger, why it converts\"; Prompt 2 \"Takes your product, photos, and offer [and] rebuilds the same ad in your context... same structure, same psychology.\" Separating analysis from synthesis into two explicit steps produces a rebuild grounded in named reasons the original worked, rather than a surface-level imitation.",
    technicalVocabulary: ["hook", "emotional trigger", "visual grammar"],
    goodExamples: ["Step 1: name what makes the reference work. Step 2: reapply that exact structure to the new subject."],
    badExamples: ["Make me something like this reference." /* — skips naming why the reference works before reusing it */],
    antiPatterns: ["Imitating a reference's surface style without first naming the structural reason it's effective."],
    constraints: [],
    tags: ["reference", "structure"],
    confidence: 0.65,
    status: "active",
  },
];

export const SEEDED_PROMPT_KNOWLEDGE = parsePromptKnowledgeItems(RAW_ITEMS);
