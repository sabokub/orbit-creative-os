import { describe, expect, it } from "vitest";
import { BudgetReport, PromptSection, SelectedContextItem } from "../types";
import { scorePrompt } from "./scoring";

function baseBudget(status: BudgetReport["status"] = "within_budget"): BudgetReport {
  return {
    estimatedPromptChars: 1000,
    estimatedPromptTokens: 250,
    maxChars: 3000,
    maxTokens: 750,
    reservedOutputTokens: 500,
    status,
    bySection: [],
    actionsTaken: [],
    warnings: [],
  };
}

const sections: PromptSection[] = ["role", "objective", "currentTask", "requiredDeliverable", "outputStructure", "constraints", "verificationChecklist"].map(
  (id) => ({ id: id as PromptSection["id"], title: id, content: "content", charCount: 7 })
);

const context: SelectedContextItem[] = [
  { key: "brand.avoid", label: "À éviter", value: "x", source: "brandDNA", reason: "r", importance: 5, estimatedTokens: 1 },
  { key: "brief.projectGoal", label: "Objectif", value: "y", source: "projectBrief", reason: "r", importance: 4, estimatedTokens: 1 },
];

describe("Deterministic prompt quality scoring", () => {
  it("produces exactly 10 explainable dimensions summing to a 0-100 total, marked deterministic", () => {
    const report = scorePrompt({
      finalPrompt: "some prompt",
      sections,
      selectedContext: context,
      selectedKnowledge: [],
      budgetReport: baseBudget(),
      warnings: [],
      hasOutputFormatStatement: true,
      hasAudienceContext: true,
      hasVerificationChecklist: true,
    });
    expect(report.dimensions).toHaveLength(10);
    expect(report.deterministic).toBe(true);
    expect(report.total).toBeGreaterThanOrEqual(0);
    expect(report.total).toBeLessThanOrEqual(100);
    for (const d of report.dimensions) {
      expect(d.explanation.length).toBeGreaterThan(0);
    }
  });

  it("scores lower when the output format is missing (explainable via the output-definition dimension)", () => {
    const withFormat = scorePrompt({
      finalPrompt: "p",
      sections,
      selectedContext: context,
      selectedKnowledge: [],
      budgetReport: baseBudget(),
      warnings: [],
      hasOutputFormatStatement: true,
      hasAudienceContext: true,
      hasVerificationChecklist: true,
    });
    const withoutFormat = scorePrompt({
      finalPrompt: "p",
      sections,
      selectedContext: context,
      selectedKnowledge: [],
      budgetReport: baseBudget(),
      warnings: [],
      hasOutputFormatStatement: false,
      hasAudienceContext: true,
      hasVerificationChecklist: true,
    });
    expect(withoutFormat.total).toBeLessThan(withFormat.total);
    const dim = withoutFormat.dimensions.find((d) => d.id === "output-definition");
    expect(dim?.score).toBeLessThan(withFormat.dimensions.find((d) => d.id === "output-definition")!.score);
  });

  it("penalizes budget non-compliance via the budget-compliance and model-fit dimensions", () => {
    const overBudget = scorePrompt({
      finalPrompt: "p",
      sections,
      selectedContext: context,
      selectedKnowledge: [],
      budgetReport: baseBudget("over_budget"),
      warnings: [],
      hasOutputFormatStatement: true,
      hasAudienceContext: true,
      hasVerificationChecklist: true,
    });
    const within = scorePrompt({
      finalPrompt: "p",
      sections,
      selectedContext: context,
      selectedKnowledge: [],
      budgetReport: baseBudget("within_budget"),
      warnings: [],
      hasOutputFormatStatement: true,
      hasAudienceContext: true,
      hasVerificationChecklist: true,
    });
    expect(overBudget.total).toBeLessThan(within.total);
  });

  it("never attaches a semantic score unless a caller explicitly provides one (no AI judgment mixed in silently)", () => {
    const report = scorePrompt({
      finalPrompt: "p",
      sections,
      selectedContext: context,
      selectedKnowledge: [],
      budgetReport: baseBudget(),
      warnings: [],
      hasOutputFormatStatement: true,
      hasAudienceContext: true,
      hasVerificationChecklist: true,
    });
    expect(report.semantic).toBeUndefined();
  });
});
