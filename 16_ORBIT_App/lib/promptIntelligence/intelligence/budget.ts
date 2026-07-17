import { WebsiteChainStep } from "../contracts/types";
import { ModelProfile } from "./modelProfiles";
import { BudgetReport, BudgetSectionUsage, OmittedContextItem, PromptSection, PromptSectionId, SelectedContextItem, SelectedKnowledgeItem } from "../types";

/**
 * Prompt budget system (issue #13, section 5). Deterministic, local — no AI
 * call. `estimateTokens` uses a simple chars/4 heuristic, the same order of
 * magnitude commonly used for English/French text with GPT-style
 * tokenizers; it is explicitly an estimate, never presented as exact.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface PromptBudgetConfig {
  maxChars: number;
  maxEstimatedTokens: number;
  reservedOutputTokens: number;
  sectionBudgets: Partial<Record<PromptSectionId, number>>;
}

/** Default budget for a Website chain step, scaled off its `recommendedBudgetChars` and the target model's length target. */
export function defaultBudgetForWebsiteStep(step: WebsiteChainStep, profile: ModelProfile): PromptBudgetConfig {
  const maxChars = Math.max(step.recommendedBudgetChars, profile.lengthTargetChars);
  return {
    maxChars,
    maxEstimatedTokens: estimateTokens("x".repeat(maxChars)),
    reservedOutputTokens: 1500,
    sectionBudgets: {
      role: 200,
      objective: 300,
      currentTask: 400,
      projectContext: Math.round(maxChars * 0.22),
      brandDNA: Math.round(maxChars * 0.22),
      priorDecisions: Math.round(maxChars * 0.2),
      requiredDeliverable: 500,
      methodRules: Math.round(maxChars * 0.12),
      outputStructure: 300,
      constraints: 300,
      verificationChecklist: 300,
    },
  };
}

export interface BudgetComputeInput {
  sections: PromptSection[];
  selectedContext: SelectedContextItem[];
  omittedContext: OmittedContextItem[];
  selectedKnowledge: SelectedKnowledgeItem[];
  budget: PromptBudgetConfig;
}

export interface BudgetComputeResult {
  report: BudgetReport;
  compressedSections: PromptSection[];
  compressedContext: SelectedContextItem[];
  compressedKnowledge: SelectedKnowledgeItem[];
}

const COMPRESSED_PRIOR_OUTPUT_CHARS = 500;
const COMPRESSED_REFERENCE_CHARS = 300;

function totalChars(sections: PromptSection[]): number {
  return sections.reduce((sum, s) => sum + s.charCount, 0);
}

function rebuildSectionContent(id: PromptSectionId, sections: PromptSection[], newContentBySectionId: Map<PromptSectionId, string>): PromptSection[] {
  return sections.map((s) => (s.id === id && newContentBySectionId.has(id) ? { ...s, content: newContentBySectionId.get(id)!, charCount: newContentBySectionId.get(id)!.length } : s));
}

/**
 * Applies the budget: computes usage, and if over budget, applies compression
 * in the exact order mandated by the issue:
 *   1. remove duplicate context
 *   2. remove low-relevance context
 *   3. compress previous deliverables
 *   4. summarize long reference material
 *   5. recommend splitting into another step (warning only — never silently
 *      truncates the final prompt text itself).
 *
 * `rebuildSections` is a callback the caller provides to regenerate prompt
 * sections from a (possibly trimmed) context/knowledge set, so this module
 * never has to know how sections are rendered.
 */
export function applyBudget(
  input: BudgetComputeInput,
  rebuildSections: (context: SelectedContextItem[], knowledge: SelectedKnowledgeItem[]) => PromptSection[]
): BudgetComputeResult {
  const actionsTaken: string[] = [];
  const warnings: string[] = [];
  let context = [...input.selectedContext];
  let knowledge = [...input.selectedKnowledge];
  let sections = input.sections;
  let chars = totalChars(sections);

  const overBudget = () => chars > input.budget.maxChars;

  // Step 1 — remove duplicate context (same value string appearing more than once).
  if (overBudget()) {
    const seenValues = new Set<string>();
    const deduped: SelectedContextItem[] = [];
    let removed = 0;
    for (const item of context) {
      const norm = item.value.trim();
      if (norm && seenValues.has(norm)) {
        removed += 1;
        continue;
      }
      if (norm) seenValues.add(norm);
      deduped.push(item);
    }
    if (removed > 0) {
      context = deduped;
      sections = rebuildSections(context, knowledge);
      chars = totalChars(sections);
      actionsTaken.push(`Suppression de ${removed} élément(s) de contexte dupliqué(s).`);
    }
  }

  // Step 2 — remove low-relevance context (importance <= 1).
  if (overBudget()) {
    const before = context.length;
    context = context.filter((item) => item.importance > 1);
    const removed = before - context.length;
    if (removed > 0) {
      sections = rebuildSections(context, knowledge);
      chars = totalChars(sections);
      actionsTaken.push(`Suppression de ${removed} élément(s) de contexte à faible pertinence (importance <= 1).`);
    }
  }

  // Step 3 — compress previous deliverables (source === "priorOutput"), keep a
  // clearly-marked excerpt rather than dropping the dependency entirely.
  if (overBudget()) {
    let compressedCount = 0;
    context = context.map((item) => {
      if (item.source !== "priorOutput") return item;
      if (item.value.length <= COMPRESSED_PRIOR_OUTPUT_CHARS) return item;
      compressedCount += 1;
      return {
        ...item,
        value: `${item.value.slice(0, COMPRESSED_PRIOR_OUTPUT_CHARS)}\n[...extrait compressé pour respecter le budget — voir la version complète validée dans l'historique du projet...]`,
        reason: `${item.reason} (compressé pour respecter le budget de l'étape.)`,
        estimatedTokens: estimateTokens(item.value.slice(0, COMPRESSED_PRIOR_OUTPUT_CHARS)),
      };
    });
    if (compressedCount > 0) {
      sections = rebuildSections(context, knowledge);
      chars = totalChars(sections);
      actionsTaken.push(`Compression de ${compressedCount} livrable(s) précédent(s) à ${COMPRESSED_PRIOR_OUTPUT_CHARS} caractères.`);
    }
  }

  // Step 4 — summarize long reference material (brief.references / brief.constraints style fields).
  if (overBudget()) {
    let summarized = 0;
    context = context.map((item) => {
      if (item.source !== "projectBrief") return item;
      if (item.value.length <= COMPRESSED_REFERENCE_CHARS) return item;
      summarized += 1;
      return {
        ...item,
        value: `${item.value.slice(0, COMPRESSED_REFERENCE_CHARS)}... [résumé pour respecter le budget]`,
        estimatedTokens: estimateTokens(item.value.slice(0, COMPRESSED_REFERENCE_CHARS)),
      };
    });
    if (summarized > 0) {
      sections = rebuildSections(context, knowledge);
      chars = totalChars(sections);
      actionsTaken.push(`Résumé de ${summarized} élément(s) de contexte de brief trop long(s).`);
    }
  }

  // Step 5 — if still over budget, never truncate the final prompt silently: warn and recommend splitting.
  const status: BudgetReport["status"] = chars > input.budget.maxChars ? "over_budget" : actionsTaken.length > 0 ? "compressed" : "within_budget";
  if (status === "over_budget") {
    const overPercent = Math.round(((chars - input.budget.maxChars) / input.budget.maxChars) * 100);
    warnings.push(
      `Le prompt dépasse le budget recommandé pour cette étape de ${overPercent}%. Le prompt n'est PAS tronqué automatiquement — envisage de scinder cette étape en deux prompts plus ciblés.`
    );
  }

  const bySection: BudgetSectionUsage[] = sections.map((s) => {
    const budgetChars = input.budget.sectionBudgets[s.id];
    return {
      id: s.id,
      chars: s.charCount,
      percentOfTotal: chars > 0 ? Math.round((s.charCount / chars) * 100) : 0,
      overBudget: budgetChars !== undefined && s.charCount > budgetChars,
      budgetChars,
    };
  });

  for (const usage of bySection) {
    if (usage.overBudget) {
      warnings.push(`La section "${usage.id}" dépasse son budget dédié (${usage.chars} / ${usage.budgetChars} caractères).`);
    }
  }

  const report: BudgetReport = {
    estimatedPromptChars: chars,
    estimatedPromptTokens: estimateTokens("x".repeat(chars)),
    maxChars: input.budget.maxChars,
    maxTokens: input.budget.maxEstimatedTokens,
    reservedOutputTokens: input.budget.reservedOutputTokens,
    status,
    bySection,
    actionsTaken,
    warnings,
  };

  return { report, compressedSections: sections, compressedContext: context, compressedKnowledge: knowledge };
}
