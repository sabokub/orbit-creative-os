import { WorkflowStep } from "../types";
import { allModuleContracts } from "./contracts";
import { foldText } from "./markdown";
import { DocumentType, ExtractedSection } from "./types";

export interface DetectionResult {
  documentType: DocumentType;
  confidence: number;
  matchesExpectedModule: boolean;
  scoresByModule: Record<WorkflowStep, number>;
}

/**
 * Which module a response most likely belongs to, purely from structural
 * signal (heading keyword overlap against every module's contract) — no AI
 * call. Confidence is the winning module's matched-heading ratio.
 */
export function detectDocumentType(sections: ExtractedSection[], expectedStep: WorkflowStep): DetectionResult {
  const foldedHeadings = sections.map((s) => foldText(s.heading));
  const scoresByModule = {} as Record<WorkflowStep, number>;

  for (const contract of allModuleContracts()) {
    let matched = 0;
    for (const deliverable of contract.deliverables) {
      const hit = foldedHeadings.some((heading) =>
        deliverable.headingKeywords.some((kw) => heading.includes(foldText(kw)))
      );
      if (hit) matched += 1;
    }
    scoresByModule[contract.workflowStep] = contract.deliverables.length > 0 ? matched / contract.deliverables.length : 0;
  }

  let bestStep: WorkflowStep | null = null;
  let bestScore = 0;
  for (const step of Object.keys(scoresByModule) as WorkflowStep[]) {
    if (scoresByModule[step] > bestScore) {
      bestScore = scoresByModule[step];
      bestStep = step;
    }
  }

  if (!bestStep || bestScore === 0) {
    return { documentType: "unknown", confidence: 0, matchesExpectedModule: false, scoresByModule };
  }

  return {
    documentType: bestStep,
    confidence: Math.round(bestScore * 100) / 100,
    matchesExpectedModule: bestStep === expectedStep,
    scoresByModule,
  };
}
