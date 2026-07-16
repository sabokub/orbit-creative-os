import { describe, expect, it } from "vitest";
import { TEST_BRAND, TEST_BRIEF } from "../../responseAnalysis/analyze.fixtures";
import { getWebsiteChainStep } from "../contracts/website";
import { selectWebsiteStepContext } from "./contextSelection";

describe("Website chain context selection", () => {
  it("only includes Brand DNA fields the step's contract declares relevant (plus the always-included avoid list)", () => {
    const step = getWebsiteChainStep("sitemap")!;
    const { selected, omitted } = selectWebsiteStepContext(step, TEST_BRAND, TEST_BRIEF, {});

    const selectedBrandKeys = selected.filter((c) => c.source === "brandDNA").map((c) => c.key);
    expect(selectedBrandKeys).toContain("brand.avoid"); // always-included safety field
    expect(selectedBrandKeys).toContain("brand.offer"); // declared relevant for sitemap
    expect(selectedBrandKeys).not.toContain("brand.photographyDirection"); // irrelevant for sitemap

    const omittedBrandKeys = omitted.filter((c) => c.source === "brandDNA").map((c) => c.key);
    expect(omittedBrandKeys).toContain("brand.photographyDirection");
  });

  it("never blindly injects the full project — brief fields not in the core set are omitted with a reason", () => {
    const step = getWebsiteChainStep("sitemap")!;
    const { omitted } = selectWebsiteStepContext(step, TEST_BRAND, TEST_BRIEF, {});
    const omittedBriefKeys = omitted.filter((c) => c.source === "projectBrief").map((c) => c.key);
    expect(omittedBriefKeys).toContain("brief.references");
    expect(omittedBriefKeys.every((k) => omitted.find((c) => c.key === k)?.omittedReason)).toBe(true);
  });

  it("includes only declared prior-step dependencies as context, and lists non-dependency validated outputs as omitted", () => {
    const step = getWebsiteChainStep("homepage-ia")!; // depends on website-positioning, hero-promise, sitemap
    const previousValidatedOutputs = {
      "website-positioning": "Positionnement validé.",
      "hero-promise": "Promesse validée.",
      sitemap: "- Accueil\n- Contact",
      faq: "FAQ non liée à cette étape.",
    };
    const { selected, omitted } = selectWebsiteStepContext(step, TEST_BRAND, TEST_BRIEF, previousValidatedOutputs);

    const selectedPriorKeys = selected.filter((c) => c.source === "priorOutput").map((c) => c.key);
    expect(selectedPriorKeys.sort()).toEqual(["prior.hero-promise", "prior.sitemap", "prior.website-positioning"].sort());

    const omittedPriorKeys = omitted.filter((c) => c.source === "priorOutput").map((c) => c.key);
    expect(omittedPriorKeys).toContain("prior.faq");
  });

  it("first step of the chain has no prior-decision context to select", () => {
    const step = getWebsiteChainStep("website-positioning")!;
    const { selected } = selectWebsiteStepContext(step, TEST_BRAND, TEST_BRIEF, {});
    expect(selected.filter((c) => c.source === "priorOutput")).toHaveLength(0);
  });

  it("only surfaces launch-critical Studio Brain items, never the full backlog", () => {
    const step = getWebsiteChainStep("website-positioning")!;
    const studioItems = [
      { id: "1", kind: "task" as const, title: "Tâche critique", description: "", status: "today" as const, order: 0, category: "x", estimateMinutes: 30, urgency: 5, impact: 5, launchCritical: true, dependsOn: [], createdAt: "", updatedAt: "" },
      { id: "2", kind: "task" as const, title: "Tâche non critique", description: "", status: "backlog" as const, order: 0, category: "x", estimateMinutes: 30, urgency: 1, impact: 1, launchCritical: false, dependsOn: [], createdAt: "", updatedAt: "" },
    ];
    const { selected, omitted } = selectWebsiteStepContext(step, TEST_BRAND, TEST_BRIEF, {}, studioItems);
    const studioSelected = selected.find((c) => c.source === "studioBrain");
    expect(studioSelected?.value).toContain("Tâche critique");
    expect(studioSelected?.value).not.toContain("Tâche non critique");
    expect(omitted.some((c) => c.key === "studioBrain.rest")).toBe(true);
  });
});
