import { describe, expect, it } from "vitest";
import { proposeLearningSuggestions, signalFromVersion } from "./learning";
import { recordFromBuildResult } from "./versioning";
import { buildOrbitPrompt } from "./generation/builder";
import { TEST_BRAND, TEST_BRIEF } from "../responseAnalysis/analyze.fixtures";

function acceptedRecord() {
  const result = buildOrbitPrompt({
    projectId: "p1",
    projectName: "Test",
    module: "website",
    workflowStep: "website",
    chainStepId: "faq",
    targetModel: "openai-text",
    brandDNA: TEST_BRAND,
    brief: TEST_BRIEF,
    previousValidatedOutputs: {},
  });
  return recordFromBuildResult(result, { outcomeStatus: "accepted" });
}

describe("Learning loop (minimal, human-gated)", () => {
  it("never proposes a suggestion below the minimum accepted-signal threshold", () => {
    const signals = [signalFromVersion(acceptedRecord(), 90), signalFromVersion(acceptedRecord(), 85)];
    expect(proposeLearningSuggestions(signals)).toHaveLength(0);
  });

  it("proposes a suggestion once enough accepted signals with a good average score accumulate, always requiring human validation", () => {
    const signals = [signalFromVersion(acceptedRecord(), 90), signalFromVersion(acceptedRecord(), 85), signalFromVersion(acceptedRecord(), 88)];
    const suggestions = proposeLearningSuggestions(signals);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].requiresHumanValidation).toBe(true);
    expect(suggestions[0].chainStepId).toBe("faq");
    expect(suggestions[0].supportingSignalCount).toBe(3);
  });

  it("does not propose a suggestion when the average response-analysis score is too low, even with enough signals", () => {
    const signals = [signalFromVersion(acceptedRecord(), 40), signalFromVersion(acceptedRecord(), 45), signalFromVersion(acceptedRecord(), 30)];
    expect(proposeLearningSuggestions(signals)).toHaveLength(0);
  });

  it("ignores rejected/pending signals entirely — only accepted outcomes ever count toward a suggestion", () => {
    const rejected = { ...acceptedRecord(), outcomeStatus: "rejected" as const };
    const signals = [signalFromVersion(rejected, 95), signalFromVersion(rejected, 95), signalFromVersion(rejected, 95)];
    expect(proposeLearningSuggestions(signals)).toHaveLength(0);
  });
});
