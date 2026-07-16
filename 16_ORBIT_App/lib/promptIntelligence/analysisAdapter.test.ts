import { describe, expect, it } from "vitest";
import { analyzeOrbitResponse } from "../responseAnalysis/analyze";
import { FULL_WEBSITE_RESPONSE, TEST_BRAND, TEST_BRIEF } from "../responseAnalysis/analyze.fixtures";
import { getWebsiteChainStep } from "./contracts/website";
import { scopeAnalysisToChainStep } from "./analysisAdapter";

describe("Chain-step analysis adapter (reuses analyzeOrbitResponse, no forked pipeline)", () => {
  it("scopes a full 13-deliverable analysis down to a single step's deliverable(s), without re-running analysis", async () => {
    const analysis = await analyzeOrbitResponse(
      {
        projectId: "p1",
        projectName: "Test",
        workflowStep: "website",
        rawResponse: FULL_WEBSITE_RESPONSE,
        source: "manual",
        expectedDeliverables: getWebsiteChainStep("faq")!.deliverableIds,
        skipSemanticAnalysis: true,
      },
      TEST_BRAND,
      TEST_BRIEF,
      []
    );

    // The underlying pipeline still evaluated all 13 deliverables (untouched contract).
    expect(analysis.detectedDeliverables).toHaveLength(13);
    expect(analysis.expectedDeliverables).toEqual(["faq"]);

    const step = getWebsiteChainStep("faq")!;
    const scoped = scopeAnalysisToChainStep(analysis, step);
    expect(scoped.relevantDeliverables).toHaveLength(1);
    expect(scoped.relevantDeliverables[0].id).toBe("faq");
    expect(scoped.allRelevantComplete).toBe(true);
    expect(scoped.stepCompletenessScore).toBe(100);
  });

  it("the consistency-review step (no deliverableIds) is scoped to the full analysis", async () => {
    const analysis = await analyzeOrbitResponse(
      { projectId: "p1", projectName: "Test", workflowStep: "website", rawResponse: FULL_WEBSITE_RESPONSE, source: "manual", skipSemanticAnalysis: true },
      TEST_BRAND,
      TEST_BRIEF,
      []
    );
    const step = getWebsiteChainStep("consistency-review")!;
    const scoped = scopeAnalysisToChainStep(analysis, step);
    expect(scoped.isConsistencyReviewStep).toBe(true);
    expect(scoped.relevantDeliverables).toHaveLength(13);
  });

  it("a missing deliverable for the scoped step is reflected honestly (not hidden by the other 12 being complete)", async () => {
    const partialResponse = FULL_WEBSITE_RESPONSE.replace(/## FAQ[\s\S]*?(?=\n## )/, "");
    const analysis = await analyzeOrbitResponse(
      { projectId: "p1", projectName: "Test", workflowStep: "website", rawResponse: partialResponse, source: "manual", skipSemanticAnalysis: true },
      TEST_BRAND,
      TEST_BRIEF,
      []
    );
    const step = getWebsiteChainStep("faq")!;
    const scoped = scopeAnalysisToChainStep(analysis, step);
    expect(scoped.allRelevantComplete).toBe(false);
    expect(scoped.relevantDeliverables[0].status).toBe("missing");
  });
});
