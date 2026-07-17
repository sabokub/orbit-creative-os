Exit code: 0
Wall time: 1.5 seconds
Output:
# Visual Prompt Intelligence

This is the visual vertical of the existing `lib/promptIntelligence` engine. It does not replace the Website prompt chain.

`CreativeIntent -> CanonicalVisualSpec -> PromptPlan -> GeneratorAdapter -> CompiledVisualPrompt -> GenerationRecord -> VisualReview -> PromptLearning`

- The canonical spec is generator-neutral.
- GPT Image, Nano Banana, Midjourney and Sora are capability profiles and adapters in one registry.
- Validation and scores are deterministic. Scores measure specification quality, not beauty.
- Unsupported requests remain visible as errors or warnings.
- Variants keep a parent link and modify a declared axis only.
- Provider calls are deliberately separate from compilation. The MVP supports external export/import without exposing a key.
- Learnings remain unapproved proposals until a person validates them.
- Approved agent prompt outputs continue to use the existing projection rule in `lib/projection/rules/promptIntelligence.ts`.

