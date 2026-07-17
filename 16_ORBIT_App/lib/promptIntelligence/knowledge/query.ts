import { SEEDED_PROMPT_KNOWLEDGE } from "./items";
import { PromptKnowledgeDomain, PromptKnowledgeItem, PromptTargetModel, PromptTaskType } from "./schema";

/**
 * Knowledge Layer — query surface. Everything here is synchronous, local and
 * deterministic (no AI call): filtering the seeded knowledge array is cheap
 * enough that no caching/indexing beyond a plain array scan is warranted at
 * this scale. If the knowledge base grows into the hundreds/thousands of
 * items, this is the module to add indexing to (see README.md "Scaling").
 */

export interface KnowledgeQuery {
  taskTypes?: PromptTaskType[];
  targetModel?: PromptTargetModel;
  domains?: PromptKnowledgeDomain[];
  tags?: string[];
  statuses?: ("active" | "proposed" | "deprecated")[];
  limit?: number;
}

export function allKnowledgeItems(): PromptKnowledgeItem[] {
  return SEEDED_PROMPT_KNOWLEDGE;
}

export function getKnowledgeItem(id: string): PromptKnowledgeItem | undefined {
  return SEEDED_PROMPT_KNOWLEDGE.find((item) => item.id === id);
}

/**
 * Filters + ranks knowledge items by relevance to a query. Relevance is a
 * simple deterministic score (task-type match + model match + domain match +
 * tag overlap + confidence) — no AI ranking, fully explainable.
 */
export function queryKnowledge(query: KnowledgeQuery): { item: PromptKnowledgeItem; relevance: number }[] {
  const statuses = query.statuses ?? ["active"];
  const results: { item: PromptKnowledgeItem; relevance: number }[] = [];

  for (const item of SEEDED_PROMPT_KNOWLEDGE) {
    if (!statuses.includes(item.status)) continue;
    if (query.targetModel && !item.targetModels.includes(query.targetModel)) continue;
    if (query.domains && query.domains.length > 0 && !query.domains.includes(item.domain)) continue;

    let taskTypeMatches = 0;
    if (query.taskTypes && query.taskTypes.length > 0) {
      taskTypeMatches = item.taskTypes.filter((t) => query.taskTypes!.includes(t)).length;
      if (taskTypeMatches === 0) continue;
    }

    let tagMatches = 0;
    if (query.tags && query.tags.length > 0) {
      tagMatches = item.tags.filter((t) => query.tags!.includes(t)).length;
    }

    const relevance = taskTypeMatches * 2 + tagMatches + item.confidence;
    results.push({ item, relevance });
  }

  results.sort((a, b) => b.relevance - a.relevance);
  return query.limit ? results.slice(0, query.limit) : results;
}
