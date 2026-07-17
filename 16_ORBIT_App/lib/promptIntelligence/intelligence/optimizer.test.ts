import { describe, expect, it } from "vitest";
import { getWebsiteChainStep } from "../contracts/website";
import { BudgetReport, SelectedContextItem } from "../types";
import { getModelProfile } from "./modelProfiles";
import { runPromptOptimizer } from "./optimizer";

function withinBudget(): BudgetReport {
  return {
    estimatedPromptChars: 100,
    estimatedPromptTokens: 25,
    maxChars: 3000,
    maxTokens: 750,
    reservedOutputTokens: 500,
    status: "within_budget",
    bySection: [],
    actionsTaken: [],
    warnings: [],
  };
}

const richContext: SelectedContextItem[] = [
  { key: "brand.audience", label: "Cible", value: "jeunes créatifs", source: "brandDNA", reason: "r", importance: 4, estimatedTokens: 2 },
];

describe("Deterministic prompt optimizer", () => {
  it("flags vague verbs with no measurable target", () => {
    const warnings = runPromptOptimizer({
      finalPrompt: "Améliore ce texte pour le rendre plus impactant. Format de sortie : Markdown.",
      profile: getModelProfile("openai-text"),
      selectedContext: richContext,
      budgetReport: withinBudget(),
      hasAudienceContext: true,
      hasOutputFormatStatement: true,
    });
    expect(warnings.some((w) => w.message.includes("vague"))).toBe(true);
  });

  it("flags a missing output format as critical", () => {
    const warnings = runPromptOptimizer({
      finalPrompt: "Un prompt sans format de sortie explicite.",
      profile: getModelProfile("openai-text"),
      selectedContext: richContext,
      budgetReport: withinBudget(),
      hasAudienceContext: true,
      hasOutputFormatStatement: false,
    });
    const critical = warnings.find((w) => w.message.includes("format de sortie"));
    expect(critical?.severity).toBe("critical");
  });

  it("flags placeholder text left in the prompt itself as critical", () => {
    const warnings = runPromptOptimizer({
      finalPrompt: "Livrable : [Insérer le texte final ici]. Format de sortie : Markdown.",
      profile: getModelProfile("openai-text"),
      selectedContext: richContext,
      budgetReport: withinBudget(),
      hasAudienceContext: true,
      hasOutputFormatStatement: true,
    });
    expect(warnings.some((w) => w.severity === "critical" && w.message.toLowerCase().includes("placeholder"))).toBe(true);
  });

  it("flags weak image vocabulary only for image-kind model profiles", () => {
    const imageWarnings = runPromptOptimizer({
      finalPrompt: "high quality, professional photo. Format de sortie : prompt image.",
      profile: getModelProfile("openai-image"),
      selectedContext: richContext,
      budgetReport: withinBudget(),
      hasAudienceContext: true,
      hasOutputFormatStatement: true,
    });
    expect(imageWarnings.some((w) => w.message.includes("Vocabulaire image faible"))).toBe(true);

    const textWarnings = runPromptOptimizer({
      finalPrompt: "high quality, professional photo. Format de sortie : Markdown.",
      profile: getModelProfile("openai-text"),
      selectedContext: richContext,
      budgetReport: withinBudget(),
      hasAudienceContext: true,
      hasOutputFormatStatement: true,
    });
    expect(textWarnings.some((w) => w.message.includes("Vocabulaire image faible"))).toBe(false);
  });

  it("flags a step covering more than 2 deliverables as a split candidate", () => {
    const threeDeliverableStep = { ...getWebsiteChainStep("faq")!, deliverableIds: ["a", "b", "c"] };
    const warnings = runPromptOptimizer({
      finalPrompt: "Format de sortie : Markdown.",
      step: threeDeliverableStep,
      profile: getModelProfile("openai-text"),
      selectedContext: richContext,
      budgetReport: withinBudget(),
      hasAudienceContext: true,
      hasOutputFormatStatement: true,
    });
    expect(warnings.some((w) => w.message.includes("scinder en étapes"))).toBe(true);
  });

  it("flags no missing-audience warning when audience context is present, and does when it's absent", () => {
    const withAudience = runPromptOptimizer({
      finalPrompt: "Format de sortie : Markdown.",
      profile: getModelProfile("openai-text"),
      selectedContext: richContext,
      budgetReport: withinBudget(),
      hasAudienceContext: true,
      hasOutputFormatStatement: true,
    });
    expect(withAudience.some((w) => w.message.includes("audience"))).toBe(false);

    const withoutAudience = runPromptOptimizer({
      finalPrompt: "Format de sortie : Markdown.",
      profile: getModelProfile("openai-text"),
      selectedContext: [],
      budgetReport: withinBudget(),
      hasAudienceContext: false,
      hasOutputFormatStatement: true,
    });
    expect(withoutAudience.some((w) => w.message.includes("audience"))).toBe(true);
  });
});
