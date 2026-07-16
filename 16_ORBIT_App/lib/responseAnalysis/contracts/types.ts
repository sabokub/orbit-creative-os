import { WorkflowStep } from "../../types";
import { ExtractedSection } from "../types";

export interface DeliverableEvaluation {
  status: "complete" | "partial" | "missing";
  reasons: string[];
}

export interface DeliverableSpec {
  id: string;
  label: string;
  /** Keyword fragments (folded, accent-insensitive) used to match this deliverable's heading. */
  headingKeywords: string[];
  /** Given the matched section (or undefined if no heading matched), decide completeness. */
  evaluate: (section: ExtractedSection | undefined, fullText: string) => DeliverableEvaluation;
}

export interface ModuleContract {
  workflowStep: WorkflowStep;
  /** Whether this module has a fully implemented contract (Website) vs. a scaffold stub. */
  implemented: boolean;
  deliverables: DeliverableSpec[];
}

/** Finds the best-matching section for a deliverable's heading keywords, or undefined if none matches well enough. */
export function findMatchingSection(
  sections: ExtractedSection[],
  keywords: string[],
  foldFn: (s: string) => string
): ExtractedSection | undefined {
  let best: { section: ExtractedSection; score: number } | undefined;
  for (const section of sections) {
    const folded = foldFn(section.heading);
    let score = 0;
    for (const kw of keywords) {
      if (folded.includes(foldFn(kw))) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { section, score };
    }
  }
  return best?.section;
}
