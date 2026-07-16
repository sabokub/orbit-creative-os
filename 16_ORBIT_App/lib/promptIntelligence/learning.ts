import { PromptVersionRecord } from "./versioning";

/**
 * Learning loop (issue #13, section 14) — deliberately minimal and
 * controlled. Records outcomes and derives *proposed* learning suggestions;
 * it NEVER auto-rewrites the canonical Knowledge Layer (`knowledge/items.ts`
 * stays hand-authored). Suggestions require explicit human validation before
 * they could ever become a `status: "active"` knowledge item — this module
 * only produces the suggestion, it does not apply it anywhere.
 */

export interface LearningSignal {
  chainStepId: string;
  promptVersion: string;
  outcomeStatus: PromptVersionRecord["outcomeStatus"];
  responseAnalysisScore?: number;
  userEditedPrompt: boolean;
  ignoredWarningIds: string[];
  selectedKnowledgeIds: string[];
}

export interface ProposedLearningSuggestion {
  id: string;
  chainStepId: string;
  suggestion: string;
  supportingSignalCount: number;
  averageResponseAnalysisScore?: number;
  requiresHumanValidation: true;
}

export function signalFromVersion(record: PromptVersionRecord, responseAnalysisScore?: number, ignoredWarningIds: string[] = []): LearningSignal {
  return {
    chainStepId: record.chainStepId,
    promptVersion: record.promptVersion,
    outcomeStatus: record.outcomeStatus,
    responseAnalysisScore,
    userEditedPrompt: record.userEdited,
    ignoredWarningIds,
    selectedKnowledgeIds: record.selectedKnowledgeIds,
  };
}

/**
 * Groups accepted signals by chain step and surfaces a suggestion when a
 * step has accumulated enough accepted outcomes with a decent average
 * response-analysis score to be worth a human looking at — nothing more.
 * The threshold (3 accepted signals, average score >= 70) is intentionally
 * simple and documented here rather than hidden in a magic number.
 */
const MIN_SIGNALS_FOR_SUGGESTION = 3;
const MIN_AVERAGE_SCORE_FOR_SUGGESTION = 70;

export function proposeLearningSuggestions(signals: LearningSignal[]): ProposedLearningSuggestion[] {
  const byStep = new Map<string, LearningSignal[]>();
  for (const signal of signals) {
    if (signal.outcomeStatus !== "accepted") continue;
    const list = byStep.get(signal.chainStepId) || [];
    list.push(signal);
    byStep.set(signal.chainStepId, list);
  }

  const suggestions: ProposedLearningSuggestion[] = [];
  for (const [chainStepId, list] of byStep.entries()) {
    if (list.length < MIN_SIGNALS_FOR_SUGGESTION) continue;
    const scored = list.filter((s) => typeof s.responseAnalysisScore === "number");
    const average = scored.length > 0 ? scored.reduce((sum, s) => sum + (s.responseAnalysisScore || 0), 0) / scored.length : undefined;
    if (average !== undefined && average < MIN_AVERAGE_SCORE_FOR_SUGGESTION) continue;

    suggestions.push({
      id: `learning-${chainStepId}`,
      chainStepId,
      suggestion: `L'étape "${chainStepId}" a produit ${list.length} livrable(s) accepté(s)${average !== undefined ? ` avec un score moyen d'analyse de ${Math.round(average)}` : ""}. Ce motif de prompt pourrait être proposé comme référence pour cette étape — validation humaine requise avant tout ajout à la Knowledge Layer.`,
      supportingSignalCount: list.length,
      averageResponseAnalysisScore: average !== undefined ? Math.round(average) : undefined,
      requiresHumanValidation: true,
    });
  }

  return suggestions;
}
