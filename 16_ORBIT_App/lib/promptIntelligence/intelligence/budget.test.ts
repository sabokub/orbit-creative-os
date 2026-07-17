import { describe, expect, it } from "vitest";
import { PromptSection, SelectedContextItem } from "../types";
import { applyBudget, estimateTokens } from "./budget";

function ctx(overrides: Partial<SelectedContextItem>): SelectedContextItem {
  return {
    key: "x",
    label: "X",
    value: "value",
    source: "brandDNA",
    reason: "test",
    importance: 3,
    estimatedTokens: 1,
    ...overrides,
  };
}

function renderSections(context: SelectedContextItem[]): PromptSection[] {
  const content = context.map((c) => c.value).join("\n");
  return [{ id: "projectContext", title: "Contexte", content, charCount: content.length }];
}

describe("Prompt budget system", () => {
  it("estimateTokens is a simple, documented chars/4 heuristic", () => {
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });

  it("reports within_budget with no compression when under the limit", () => {
    const context = [ctx({ key: "a", value: "short" })];
    const sections = renderSections(context);
    const { report, compressedContext } = applyBudget(
      { sections, selectedContext: context, omittedContext: [], selectedKnowledge: [], budget: { maxChars: 1000, maxEstimatedTokens: 250, reservedOutputTokens: 100, sectionBudgets: {} } },
      renderSections
    );
    expect(report.status).toBe("within_budget");
    expect(report.actionsTaken).toHaveLength(0);
    expect(compressedContext).toHaveLength(1);
  });

  it("step 1: removes duplicate context (identical values) before anything else", () => {
    const context = [
      ctx({ key: "a", value: "x".repeat(50), importance: 3 }),
      ctx({ key: "b", value: "x".repeat(50), importance: 3 }), // exact duplicate of "a"
    ];
    const sections = renderSections(context);
    const { report, compressedContext } = applyBudget(
      { sections, selectedContext: context, omittedContext: [], selectedKnowledge: [], budget: { maxChars: 60, maxEstimatedTokens: 20, reservedOutputTokens: 10, sectionBudgets: {} } },
      renderSections
    );
    expect(report.actionsTaken[0]).toMatch(/dupliqué/);
    expect(compressedContext).toHaveLength(1);
  });

  it("step 2: removes low-relevance context (importance <= 1) when duplicates alone aren't enough", () => {
    const context = [
      ctx({ key: "a", value: "y".repeat(40), importance: 5 }),
      ctx({ key: "b", value: "z".repeat(40), importance: 1 }), // low relevance, distinct value
    ];
    const sections = renderSections(context);
    const { report, compressedContext } = applyBudget(
      { sections, selectedContext: context, omittedContext: [], selectedKnowledge: [], budget: { maxChars: 45, maxEstimatedTokens: 15, reservedOutputTokens: 10, sectionBudgets: {} } },
      renderSections
    );
    expect(report.actionsTaken.some((a) => a.includes("faible pertinence"))).toBe(true);
    expect(compressedContext.find((c) => c.key === "b")).toBeUndefined();
    expect(compressedContext.find((c) => c.key === "a")).toBeDefined();
  });

  it("step 3: compresses long previous-deliverable context rather than dropping the dependency entirely", () => {
    const longPrior = "p".repeat(2000);
    const context = [ctx({ key: "prior.step1", value: longPrior, source: "priorOutput", importance: 5 })];
    const sections = renderSections(context);
    const { report, compressedContext } = applyBudget(
      { sections, selectedContext: context, omittedContext: [], selectedKnowledge: [], budget: { maxChars: 500, maxEstimatedTokens: 125, reservedOutputTokens: 10, sectionBudgets: {} } },
      renderSections
    );
    expect(report.actionsTaken.some((a) => a.includes("livrable"))).toBe(true);
    const compressed = compressedContext.find((c) => c.key === "prior.step1");
    expect(compressed?.value.length).toBeLessThan(longPrior.length);
    expect(compressed?.value).toContain("compressé");
  });

  it("step 4: summarizes long brief/reference context", () => {
    const longRef = "r".repeat(2000);
    const context = [ctx({ key: "brief.references", value: longRef, source: "projectBrief", importance: 5 })];
    const sections = renderSections(context);
    const { report, compressedContext } = applyBudget(
      { sections, selectedContext: context, omittedContext: [], selectedKnowledge: [], budget: { maxChars: 500, maxEstimatedTokens: 125, reservedOutputTokens: 10, sectionBudgets: {} } },
      renderSections
    );
    expect(report.actionsTaken.some((a) => a.includes("Résumé"))).toBe(true);
    expect(compressedContext[0].value.length).toBeLessThan(longRef.length);
  });

  it("step 5: when still over budget after every compression step, warns and recommends splitting — never truncates the final prompt silently", () => {
    const context = [ctx({ key: "irreducible", value: "z".repeat(5000), source: "brandDNA", importance: 5 })];
    const sections = renderSections(context);
    const { report, compressedSections } = applyBudget(
      { sections, selectedContext: context, omittedContext: [], selectedKnowledge: [], budget: { maxChars: 200, maxEstimatedTokens: 50, reservedOutputTokens: 10, sectionBudgets: {} } },
      renderSections
    );
    expect(report.status).toBe("over_budget");
    expect(report.warnings.some((w) => w.toLowerCase().includes("scinder"))).toBe(true);
    // The content is NOT truncated — the full 5000-char value is still present in the rendered section.
    expect(compressedSections[0].content.length).toBeGreaterThanOrEqual(5000);
  });

  it("flags a section that exceeds its own dedicated budget", () => {
    const context = [ctx({ key: "a", value: "a".repeat(100) })];
    const sections = renderSections(context);
    const { report } = applyBudget(
      { sections, selectedContext: context, omittedContext: [], selectedKnowledge: [], budget: { maxChars: 1000, maxEstimatedTokens: 250, reservedOutputTokens: 10, sectionBudgets: { projectContext: 50 } } },
      renderSections
    );
    expect(report.bySection[0].overBudget).toBe(true);
    expect(report.warnings.some((w) => w.includes("dépasse son budget dédié"))).toBe(true);
  });
});
