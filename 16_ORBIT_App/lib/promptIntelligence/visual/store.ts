import { CompiledVisualPrompt, GenerationRecord, PromptLearning, VisualReview } from "./contracts";

export interface VisualPromptStore {
  listPrompts(projectId: string): Promise<CompiledVisualPrompt[]>;
  getPrompt(id: string): Promise<CompiledVisualPrompt | null>;
  savePrompt(prompt: CompiledVisualPrompt): Promise<void>;
  listGenerations(projectId: string): Promise<GenerationRecord[]>;
  getGeneration(id: string): Promise<GenerationRecord | null>;
  saveGeneration(record: GenerationRecord): Promise<void>;
  listReviews(projectId: string): Promise<VisualReview[]>;
  getReview(id: string): Promise<VisualReview | null>;
  saveReview(projectId: string, review: VisualReview): Promise<void>;
  listLearnings(projectId: string): Promise<PromptLearning[]>;
  saveLearning(learning: PromptLearning): Promise<void>;
}
