import { describe, expect, it } from "vitest";
import { WEBSITE_CONTRACT } from "../../responseAnalysis/contracts/website";
import { getWebsiteChainStep, nextWebsiteChainStepId, WEBSITE_CHAIN, websiteChainStepIds, WEBSITE_DELIVERABLE_HEADINGS } from "./website";

describe("Website prompt chain contract", () => {
  it("has exactly 13 steps, matching the issue's numbered list", () => {
    expect(WEBSITE_CHAIN).toHaveLength(13);
    expect(WEBSITE_CHAIN.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });

  it("every deliverableId used by a chain step exists in the existing WEBSITE_CONTRACT (reused, not forked)", () => {
    const validIds = new Set(WEBSITE_CONTRACT.deliverables.map((d) => d.id));
    for (const step of WEBSITE_CHAIN) {
      for (const id of step.deliverableIds) {
        expect(validIds.has(id)).toBe(true);
      }
    }
  });

  it("every one of the 13 WEBSITE_CONTRACT deliverables is covered by exactly one chain step", () => {
    const covered = WEBSITE_CHAIN.flatMap((s) => s.deliverableIds);
    const contractIds = WEBSITE_CONTRACT.deliverables.map((d) => d.id);
    expect(new Set(covered)).toEqual(new Set(contractIds));
    expect(covered).toHaveLength(contractIds.length);
  });

  it("the final step (consistency-review) has no single-deliverable contract by design", () => {
    const last = WEBSITE_CHAIN[WEBSITE_CHAIN.length - 1];
    expect(last.id).toBe("consistency-review");
    expect(last.deliverableIds).toEqual([]);
  });

  it("dependsOnSteps only ever reference earlier steps in the chain (no forward/circular dependency)", () => {
    const orderById = new Map(WEBSITE_CHAIN.map((s) => [s.id, s.order]));
    for (const step of WEBSITE_CHAIN) {
      for (const depId of step.dependsOnSteps) {
        expect(orderById.get(depId)).toBeLessThan(step.order);
      }
    }
  });

  it("nextWebsiteChainStepId advances in order and returns undefined after the last step", () => {
    expect(nextWebsiteChainStepId("website-positioning")).toBe("hero-promise");
    expect(nextWebsiteChainStepId("consistency-review")).toBeUndefined();
    expect(nextWebsiteChainStepId("not-a-real-step")).toBeUndefined();
  });

  it("getWebsiteChainStep / websiteChainStepIds are consistent", () => {
    expect(websiteChainStepIds()).toHaveLength(13);
    expect(getWebsiteChainStep("faq")?.title).toBe("FAQ");
  });

  it("every deliverable heading instruction maps to a real deliverable id", () => {
    const validIds = new Set(WEBSITE_CONTRACT.deliverables.map((d) => d.id));
    for (const id of Object.keys(WEBSITE_DELIVERABLE_HEADINGS)) {
      expect(validIds.has(id)).toBe(true);
    }
  });
});
