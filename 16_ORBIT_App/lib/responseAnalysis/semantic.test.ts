import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_BRAND, TEST_BRIEF } from "./analyze.fixtures";

/**
 * Dedicated coverage for the one-retry-then-fall-back semantic analysis
 * contract, independent of the full pipeline. The OpenAI call is always
 * mocked here — this test never hits the real API.
 */

beforeEach(() => {
  vi.resetModules();
  process.env.OPENAI_API_KEY = "test-key";
});

it("has no key configured -> reports performed:false without calling the model", async () => {
  delete process.env.OPENAI_API_KEY;
  const { runSemanticAnalysis } = await import("./semantic");
  const outcome = await runSemanticAnalysis("Un livrable.", TEST_BRAND, TEST_BRIEF, "Site internet");
  expect(outcome.performed).toBe(false);
  expect(outcome.error).toContain("clé OpenAI");
});

describe("runSemanticAnalysis retry behavior", () => {
  it("succeeds on the first attempt when the model returns valid JSON", async () => {
    const generateJSONWithOpenAI = vi.fn().mockResolvedValue(
      JSON.stringify({
        qualityScore: 70,
        brandCoherenceScore: 70,
        brandCoherenceIssues: [],
        briefCoherenceScore: 70,
        briefCoherenceIssues: [],
        contradictions: [],
        toneMismatch: false,
        vagueCtas: [],
        weakImagePrompts: [],
        recommendations: [],
        summary: "OK.",
      })
    );
    vi.doMock("../openai", () => ({ generateJSONWithOpenAI }));
    const { runSemanticAnalysis } = await import("./semantic");
    const outcome = await runSemanticAnalysis("Un livrable.", TEST_BRAND, TEST_BRIEF, "Site internet");
    expect(outcome.performed).toBe(true);
    expect(generateJSONWithOpenAI).toHaveBeenCalledTimes(1);
  });

  it("retries exactly once after invalid JSON, and succeeds if the retry is valid", async () => {
    const generateJSONWithOpenAI = vi
      .fn()
      .mockResolvedValueOnce("not json at all")
      .mockResolvedValueOnce(
        JSON.stringify({
          qualityScore: 65,
          brandCoherenceScore: 65,
          brandCoherenceIssues: [],
          briefCoherenceScore: 65,
          briefCoherenceIssues: [],
          contradictions: [],
          toneMismatch: false,
          vagueCtas: [],
          weakImagePrompts: [],
          recommendations: [],
          summary: "OK après retry.",
        })
      );
    vi.doMock("../openai", () => ({ generateJSONWithOpenAI }));
    const { runSemanticAnalysis } = await import("./semantic");
    const outcome = await runSemanticAnalysis("Un livrable.", TEST_BRAND, TEST_BRIEF, "Site internet");
    expect(outcome.performed).toBe(true);
    expect(outcome.result?.summary).toBe("OK après retry.");
    expect(generateJSONWithOpenAI).toHaveBeenCalledTimes(2);
  });

  it("fails gracefully (performed:false, explicit error) after both attempts return invalid structure", async () => {
    const generateJSONWithOpenAI = vi.fn().mockResolvedValue(JSON.stringify({ notTheRightShape: true }));
    vi.doMock("../openai", () => ({ generateJSONWithOpenAI }));
    const { runSemanticAnalysis } = await import("./semantic");
    const outcome = await runSemanticAnalysis("Un livrable.", TEST_BRAND, TEST_BRIEF, "Site internet");
    expect(outcome.performed).toBe(false);
    expect(outcome.error).toBeTruthy();
    expect(generateJSONWithOpenAI).toHaveBeenCalledTimes(2);
  });

  it("caps the input sent to the model and never throws on an empty response", async () => {
    const { runSemanticAnalysis } = await import("./semantic");
    const outcome = await runSemanticAnalysis("", TEST_BRAND, TEST_BRIEF, "Site internet");
    expect(outcome.performed).toBe(false);
  });
});
