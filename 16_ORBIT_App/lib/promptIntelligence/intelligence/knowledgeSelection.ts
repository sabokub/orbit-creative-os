import { queryKnowledge } from "../knowledge/query";
import { PromptTargetModel } from "../knowledge/schema";
import { WebsiteChainStep } from "../contracts/types";
import { SelectedKnowledgeItem } from "../types";
import { estimateTokens } from "./budget";

const MAX_KNOWLEDGE_ITEMS_PER_STEP = 6;

/**
 * Selects the knowledge items relevant to a Website chain step (issue #13
 * section 1/4): filtered by the step's declared task types + the target
 * model, ranked by the deterministic relevance score in
 * `knowledge/query.ts`, capped to a small number so the prompt only
 * *references* rules (source trace) rather than dumping their full content
 * into the prompt sent to the model (see `generation/sections.ts` —
 * `methodRules` renders short principle statements, not full rationale/
 * examples).
 */
export function selectKnowledgeForWebsiteStep(step: WebsiteChainStep, targetModel: PromptTargetModel): SelectedKnowledgeItem[] {
  const ranked = queryKnowledge({
    taskTypes: step.knowledgeTaskTypes,
    targetModel,
    domains: step.knowledgeDomains,
    limit: MAX_KNOWLEDGE_ITEMS_PER_STEP,
  });

  return ranked.map(({ item, relevance }) => ({
    id: item.id,
    title: item.title,
    sourceDocument: item.sourceDocument,
    sourcePageOrSection: item.sourcePageOrSection,
    relevance: Math.round(relevance * 100) / 100,
    reason: `Domaine "${item.domain}", correspond aux types de tâche de l'étape "${step.title}" et au modèle cible "${targetModel}".`,
    estimatedTokens: estimateTokens(item.principle),
  }));
}
