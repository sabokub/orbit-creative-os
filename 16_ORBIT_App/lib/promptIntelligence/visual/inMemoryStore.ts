import {
  CompiledVisualPrompt,
  GenerationRecord,
  PromptLearning,
  VisualReview,
} from "./contracts";
import { VisualPromptStore } from "./store";

export class InMemoryVisualPromptStore implements VisualPromptStore {
  private readonly prompts = new Map<string, CompiledVisualPrompt>();
  private readonly generations = new Map<string, GenerationRecord>();
  private readonly reviews = new Map<string, VisualReview & { projectId: string }>();
  private readonly learnings = new Map<string, PromptLearning>();

  async listPrompts(projectId: string): Promise<CompiledVisualPrompt[]> {
    return [...this.prompts.values()]
      .filter((prompt) => prompt.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getPrompt(id: string): Promise<CompiledVisualPrompt | null> {
    return this.prompts.get(id) ?? null;
  }

  async savePrompt(prompt: CompiledVisualPrompt): Promise<void> {
    this.prompts.set(prompt.id, { ...prompt });
  }

  async listGenerations(projectId: string): Promise<GenerationRecord[]> {
    return [...this.generations.values()]
      .filter((record) => record.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getGeneration(id: string): Promise<GenerationRecord | null> {
    return this.generations.get(id) ?? null;
  }

  async saveGeneration(record: GenerationRecord): Promise<void> {
    this.generations.set(record.id, { ...record });
  }

  async listReviews(projectId: string): Promise<VisualReview[]> {
    return [...this.reviews.values()]
      .filter((review) => review.projectId === projectId)
      .map(({ projectId: _projectId, ...review }) => review)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getReview(id: string): Promise<VisualReview | null> {
    const review = this.reviews.get(id);
    if (!review) return null;
    const { projectId: _projectId, ...rest } = review;
    return rest;
  }

  async saveReview(projectId: string, review: VisualReview): Promise<void> {
    this.reviews.set(review.id, { ...review, projectId });
  }

  async listLearnings(projectId: string): Promise<PromptLearning[]> {
    return [...this.learnings.values()]
      .filter((learning) => learning.projectId === projectId)
      .sort((a, b) => b.id.localeCompare(a.id));
  }

  async saveLearning(learning: PromptLearning): Promise<void> {
    this.learnings.set(learning.id, { ...learning });
  }
}
