import { describe, expect, it } from "vitest";
import { diffAgainstPrevious, mergeWithPrevious } from "./versioning";
import { analyzeOrbitResponse } from "./analyze";
import { FULL_WEBSITE_RESPONSE, TEST_BRAND, TEST_BRIEF } from "./analyze.fixtures";

async function analyze(raw: string) {
  return analyzeOrbitResponse(
    { projectId: "p1", projectName: "P", workflowStep: "website", rawResponse: raw, source: "manual", skipSemanticAnalysis: true },
    TEST_BRAND,
    TEST_BRIEF,
    []
  );
}

describe("diffAgainstPrevious / mergeWithPrevious — new-version-of-existing-deliverable detection", () => {
  it("hasPreviousVersion is false when there is nothing saved yet", async () => {
    const analysis = await analyze(FULL_WEBSITE_RESPONSE);
    const diff = diffAgainstPrevious(undefined, analysis);
    expect(diff.hasPreviousVersion).toBe(false);
    expect(diff.significant).toBe(false);
  });

  it("is not significant when re-analyzing byte-identical content", async () => {
    const analysis = await analyze(FULL_WEBSITE_RESPONSE);
    const diff = diffAgainstPrevious(FULL_WEBSITE_RESPONSE, analysis);
    expect(diff.hasPreviousVersion).toBe(true);
    expect(diff.significant).toBe(false);
  });

  it("detects an added section, a removed section, and a changed section", async () => {
    const previous = FULL_WEBSITE_RESPONSE.replace("## Ton UX writing", "## Section obsolète\nAncien contenu.\n\n## Ton UX writing");
    const changed = FULL_WEBSITE_RESPONSE.replace("Ton intérieur devient un espace qui te ressemble", "Un intérieur repensé pour raconter ton histoire");
    const analysis = await analyze(changed);
    const diff = diffAgainstPrevious(previous, analysis);
    expect(diff.significant).toBe(true);
    expect(diff.removedSections).toContain("Section obsolète");
    expect(diff.changedSections).toContain("Promesse du hero");
  });

  it("merge preserves a section present in the old version but absent from the new one", async () => {
    const previous = FULL_WEBSITE_RESPONSE + "\n\n## Note interne\nÀ garder pour l'équipe.";
    // New response has everything except the internal note.
    const analysis = await analyze(FULL_WEBSITE_RESPONSE);
    const merged = mergeWithPrevious(previous, analysis);
    expect(merged).toContain("Note interne");
    expect(merged).toContain("À garder pour l'équipe.");
    expect(merged).toContain("Positionnement web");
  });
});
