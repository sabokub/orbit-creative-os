import { AnalysisResult, DeliverableResult } from "../responseAnalysis/types";
import { WebsiteChainStep } from "./contracts/types";

/**
 * Thin adapter over the existing response-analysis pipeline
 * (`analyzeOrbitResponse` — untouched, see lib/responseAnalysis/analyze.ts).
 * The Website contract always evaluates all 13 deliverables in one pass;
 * this adapter does not change that computation at all — it only *scopes
 * the presentation* of an already-produced `AnalysisResult` down to the
 * deliverable(s) a single chain step is responsible for, so the chain UI
 * can show "is THIS step's deliverable done" without forking a second
 * analysis path or modifying analyze.ts / the Website contract.
 */
export interface ChainStepAnalysisView {
  stepId: string;
  relevantDeliverables: DeliverableResult[];
  stepCompletenessScore: number;
  allRelevantComplete: boolean;
  isConsistencyReviewStep: boolean;
}

export function scopeAnalysisToChainStep(analysis: AnalysisResult, step: WebsiteChainStep): ChainStepAnalysisView {
  if (step.deliverableIds.length === 0) {
    // Consistency-review step: no single-deliverable contract — the whole
    // analysis (all 13 deliverables) is the relevant picture.
    return {
      stepId: step.id,
      relevantDeliverables: analysis.detectedDeliverables,
      stepCompletenessScore: analysis.completenessScore,
      allRelevantComplete: analysis.missingDeliverables.length === 0 && analysis.partialDeliverables.length === 0,
      isConsistencyReviewStep: true,
    };
  }

  const relevantDeliverables = analysis.detectedDeliverables.filter((d) => step.deliverableIds.includes(d.id));
  const completeCount = relevantDeliverables.filter((d) => d.status === "complete").length;
  const partialCount = relevantDeliverables.filter((d) => d.status === "partial").length;
  const stepCompletenessScore = relevantDeliverables.length
    ? Math.round(((completeCount + partialCount * 0.5) / relevantDeliverables.length) * 100)
    : 0;

  return {
    stepId: step.id,
    relevantDeliverables,
    stepCompletenessScore,
    allRelevantComplete: relevantDeliverables.length > 0 && relevantDeliverables.every((d) => d.status === "complete"),
    isConsistencyReviewStep: false,
  };
}
