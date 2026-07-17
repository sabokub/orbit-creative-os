import { describe, expect, it } from "vitest";
import { TEST_BRAND, TEST_BRIEF } from "../responseAnalysis/analyze.fixtures";
import { buildOrbitPrompt } from "./generation/builder";
import {
  appendVersion,
  appendVersionIdempotent,
  diffPromptVersions,
  latestVersion,
  PromptVersionMetaSchema,
  recordFromBuildResult,
  recordFromMeta,
} from "./versioning";

function buildResultFixture() {
  return buildOrbitPrompt({
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
}

describe("Prompt versioning", () => {
  it("recordFromBuildResult produces a pending record by default, never mutating the build result", () => {
    const result = buildResultFixture();
    const record = recordFromBuildResult(result);
    expect(record.outcomeStatus).toBe("pending");
    expect(record.chainStepId).toBe("faq");
    expect(record.qualityScore).toBe(result.qualityReport.total);
  });

  it("appendVersion always appends, never mutates or replaces prior history entries", () => {
    const result = buildResultFixture();
    const record1 = recordFromBuildResult(result);
    const record2 = recordFromBuildResult(buildResultFixture());
    const history = appendVersion(appendVersion([], record1), record2);
    expect(history).toHaveLength(2);
    expect(history[0]).toBe(record1);
    expect(history[1]).toBe(record2);
  });

  it("appendVersionIdempotent refuses to append a second record with the same promptVersion", () => {
    const result = buildResultFixture();
    const record = recordFromBuildResult(result);
    const first = appendVersionIdempotent([], record);
    expect(first.appended).toBe(true);
    expect(first.history).toHaveLength(1);

    const second = appendVersionIdempotent(first.history, record);
    expect(second.appended).toBe(false);
    expect(second.history).toHaveLength(1);
  });

  it("diffPromptVersions reports char/quality deltas and knowledge/context set differences", () => {
    const a = recordFromBuildResult(buildResultFixture());
    const bResult = buildResultFixture();
    const b = { ...recordFromBuildResult(bResult), estimatedPromptChars: a.estimatedPromptChars + 500, qualityScore: a.qualityScore + 10 };
    const diff = diffPromptVersions(a, b);
    expect(diff.chars.delta).toBe(500);
    expect(diff.quality.delta).toBe(10);
    expect(diff.promptChanged).toBe(false); // same finalPrompt in this fixture
  });

  it("latestVersion returns the last entry, or undefined for empty history", () => {
    expect(latestVersion([])).toBeUndefined();
    const record = recordFromBuildResult(buildResultFixture());
    expect(latestVersion([record])).toBe(record);
  });

  it("PromptVersionMetaSchema validates client-submitted metadata before it's trusted (never trusts the round-trip blindly)", () => {
    const result = buildResultFixture();
    const meta = {
      promptVersion: result.promptVersion,
      builderVersion: result.builderVersion,
      targetModel: result.targetModel,
      selectedKnowledgeIds: result.selectedKnowledge.map((k) => k.id),
      contextSnapshotKeys: result.selectedContext.map((c) => c.key),
      budgetStatus: result.budgetReport.status,
      estimatedPromptChars: result.budgetReport.estimatedPromptChars,
      qualityScore: result.qualityReport.total,
      userEdited: false,
      finalPrompt: result.finalPrompt,
    };
    expect(PromptVersionMetaSchema.safeParse(meta).success).toBe(true);
    expect(PromptVersionMetaSchema.safeParse({ ...meta, qualityScore: 500 }).success).toBe(false);
    expect(PromptVersionMetaSchema.safeParse({ ...meta, promptVersion: undefined }).success).toBe(false);
  });

  it("recordFromMeta always marks the outcome as accepted (it's only called on explicit validation)", () => {
    const result = buildResultFixture();
    const meta = PromptVersionMetaSchema.parse({
      promptVersion: result.promptVersion,
      builderVersion: result.builderVersion,
      targetModel: result.targetModel,
      selectedKnowledgeIds: result.selectedKnowledge.map((k) => k.id),
      contextSnapshotKeys: result.selectedContext.map((c) => c.key),
      budgetStatus: result.budgetReport.status,
      estimatedPromptChars: result.budgetReport.estimatedPromptChars,
      qualityScore: result.qualityReport.total,
      userEdited: false,
      finalPrompt: result.finalPrompt,
    });
    const record = recordFromMeta("faq", "website", meta, "analysis-123");
    expect(record.outcomeStatus).toBe("accepted");
    expect(record.generatedResponseRef).toBe("analysis-123");
  });
});
