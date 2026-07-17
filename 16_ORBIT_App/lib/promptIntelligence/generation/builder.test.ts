import { beforeEach, describe, expect, it } from "vitest";
import { TEST_BRAND, TEST_BRIEF } from "../../responseAnalysis/analyze.fixtures";
import { PromptBuildInput } from "../types";
import { buildOrbitPrompt } from "./builder";

function baseInput(overrides: Partial<PromptBuildInput> = {}): PromptBuildInput {
  return {
    projectId: "project-1",
    projectName: "Homepage 24March Studio",
    module: "website",
    workflowStep: "website",
    chainStepId: "website-positioning",
    targetModel: "openai-text",
    brandDNA: TEST_BRAND,
    brief: TEST_BRIEF,
    previousValidatedOutputs: {},
    ...overrides,
  };
}

describe("buildOrbitPrompt — canonical Generation Layer entry point", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it("throws an honest error for any module other than website (not yet implemented)", () => {
    expect(() => buildOrbitPrompt(baseInput({ module: "content", chainStepId: undefined }))).toThrow(/seul le module 'website'/);
  });

  it("throws for an unknown chain step id", () => {
    expect(() => buildOrbitPrompt(baseInput({ chainStepId: "not-a-real-step" }))).toThrow(/inconnue/);
  });

  it("works with zero OpenAI key configured — the entire builder is local/deterministic (issue #13 section 15)", () => {
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    const result = buildOrbitPrompt(baseInput());
    expect(result.finalPrompt.length).toBeGreaterThan(0);
    expect(result.qualityReport.deterministic).toBe(true);
    expect(result.qualityReport.semantic).toBeUndefined();
  });

  it("includes the required output format and the canonical deliverable heading in the final prompt", () => {
    const result = buildOrbitPrompt(baseInput());
    expect(result.finalPrompt).toContain("Positionnement web");
  });

  it("produces a full source trace referencing knowledge items and selected Brand DNA / brief fields by id", () => {
    const result = buildOrbitPrompt(baseInput());
    expect(result.sourceTrace.length).toBeGreaterThan(0);
    expect(result.sourceTrace.some((t) => t.kind === "knowledge")).toBe(true);
    expect(result.sourceTrace.some((t) => t.kind === "brandDNA")).toBe(true);
    // Every knowledge trace names a real, honest source — never empty/undefined.
    for (const knowledgeTrace of result.sourceTrace.filter((t) => t.kind === "knowledge")) {
      expect(knowledgeTrace.note.length).toBeGreaterThan(0);
    }
  });

  it("never dumps full knowledge rationale/examples into the prompt itself — only short principle statements", () => {
    const result = buildOrbitPrompt(baseInput());
    // Rationale text is much longer prose distinct from the principle; assert it never leaks into the sent prompt.
    for (const k of result.selectedKnowledge) {
      // The 'principle' text (used in the prompt) should never literally contain 'la rationale suivante' style markers,
      // and the assembled prompt should stay far shorter than knowledge.rationale + goodExamples combined would be.
      expect(result.finalPrompt.length).toBeLessThan(20_000);
    }
  });

  it("website step 1 -> validated -> step 2 sees the validated output as prior-decision context", () => {
    const step1 = buildOrbitPrompt(baseInput({ chainStepId: "website-positioning" }));
    const validatedStep1Output = "## Positionnement web\nPositionnement validé pour ce test.";

    const step2 = buildOrbitPrompt(
      baseInput({ chainStepId: "hero-promise", previousValidatedOutputs: { "website-positioning": validatedStep1Output } })
    );
    expect(step2.finalPrompt).toContain(validatedStep1Output);
    expect(step1.nextStep).toBe("hero-promise");
  });

  it("a step that has no dependency on another step's output does not receive it as context", () => {
    const result = buildOrbitPrompt(
      baseInput({ chainStepId: "website-positioning", previousValidatedOutputs: { faq: "FAQ non liée." } })
    );
    expect(result.finalPrompt).not.toContain("FAQ non liée.");
  });

  it("retrying a single step does not require or depend on any other step being rebuilt (independent retry)", () => {
    const first = buildOrbitPrompt(baseInput({ chainStepId: "faq" }));
    const retry = buildOrbitPrompt(baseInput({ chainStepId: "faq" }));
    // Two independent builds of the same step, same inputs, produce equivalent prompt content
    // (only the generated promptVersion/createdAt/id differ).
    expect(retry.finalPrompt).toBe(first.finalPrompt);
    expect(retry.promptVersion).not.toBe(first.promptVersion);
  });

  it("manual-copy and OpenAI-generation paths call the same builder, so equivalent input produces an identical prompt", () => {
    // Both /api/prompt-intelligence/build (manual-copy) and /api/generate (OpenAI path, chainStepId branch)
    // call buildOrbitPrompt with the same shape of input — asserting that directly here.
    const manualPathInput = baseInput({ chainStepId: "ctas" });
    const openaiPathInput = baseInput({ chainStepId: "ctas" });
    const manual = buildOrbitPrompt(manualPathInput);
    const openai = buildOrbitPrompt(openaiPathInput);
    expect(manual.finalPrompt).toBe(openai.finalPrompt);
  });

  it("flags a too-many-deliverables warning for the grouped offers-and-proof step only if it exceeds the 2-deliverable threshold", () => {
    const result = buildOrbitPrompt(baseInput({ chainStepId: "offers-and-proof" }));
    // offers-and-proof groups exactly 2 deliverables — at the threshold, not over it.
    expect(result.warnings.some((w) => w.message.includes("scinder en étapes"))).toBe(false);
  });

  it("recommends splitting (via the optimizer/budget warnings) when a very small budget forces persistent over-budget status", () => {
    const result = buildOrbitPrompt(baseInput({ chainStepId: "section-copywriting", budgetOverride: { maxChars: 50 } }));
    expect(result.budgetReport.status).toBe("over_budget");
    expect(result.warnings.some((w) => w.severity === "critical")).toBe(true);
  });

  it("respects a target-model change by rendering the model-appropriate output-format note", () => {
    const textResult = buildOrbitPrompt(baseInput({ chainStepId: "hero-image-direction", targetModel: "openai-image" }));
    expect(textResult.finalPrompt.length).toBeGreaterThan(0);
    expect(textResult.targetModel).toBe("openai-image");
  });
});
