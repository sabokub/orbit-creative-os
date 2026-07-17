import "server-only";
import { Redis } from "@upstash/redis";
import {
  CompiledVisualPrompt,
  CompiledVisualPromptSchema,
  GenerationRecord,
  GenerationRecordSchema,
  PromptLearning,
  PromptLearningSchema,
  VisualReview,
  VisualReviewSchema,
} from "./contracts";
import { VisualPromptStore } from "./store";

const PROMPT_INDEX = (projectId: string) => `orbit-hub:project:${projectId}:visual-prompts:index`;
const PROMPT_KEY = (id: string) => `orbit-hub:visual-prompt:${id}`;
const GENERATION_INDEX = (projectId: string) => `orbit-hub:project:${projectId}:visual-generations:index`;
const GENERATION_KEY = (id: string) => `orbit-hub:visual-generation:${id}`;
const REVIEW_INDEX = (projectId: string) => `orbit-hub:project:${projectId}:visual-reviews:index`;
const REVIEW_KEY = (id: string) => `orbit-hub:visual-review:${id}`;
const LEARNING_INDEX = (projectId: string) => `orbit-hub:project:${projectId}:visual-learnings:index`;
const LEARNING_KEY = (id: string) => `orbit-hub:visual-learning:${id}`;

function hasRedisEnv() {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function client(): Redis {
  if (!hasRedisEnv()) {
    throw new Error("No Redis database is connected for Visual Lab persistence.");
  }
  return Redis.fromEnv();
}

async function addToIndex(redis: Redis, key: string, id: string): Promise<void> {
  const ids = (await redis.get<string[]>(key)) || [];
  if (!ids.includes(id)) await redis.set(key, [...ids, id]);
}

export class RedisVisualPromptStore implements VisualPromptStore {
  async listPrompts(projectId: string): Promise<CompiledVisualPrompt[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(PROMPT_INDEX(projectId))) || [];
    const raw = await Promise.all(ids.map((id) => redis.get(PROMPT_KEY(id))));
    return raw
      .map((value) => CompiledVisualPromptSchema.safeParse(value))
      .flatMap((parsed) => (parsed.success ? [parsed.data] : []))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getPrompt(id: string): Promise<CompiledVisualPrompt | null> {
    const parsed = CompiledVisualPromptSchema.safeParse(await client().get(PROMPT_KEY(id)));
    return parsed.success ? parsed.data : null;
  }

  async savePrompt(prompt: CompiledVisualPrompt): Promise<void> {
    const redis = client();
    await redis.set(PROMPT_KEY(prompt.id), prompt);
    await addToIndex(redis, PROMPT_INDEX(prompt.projectId), prompt.id);
  }

  async listGenerations(projectId: string): Promise<GenerationRecord[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(GENERATION_INDEX(projectId))) || [];
    const raw = await Promise.all(ids.map((id) => redis.get(GENERATION_KEY(id))));
    return raw
      .map((value) => GenerationRecordSchema.safeParse(value))
      .flatMap((parsed) => (parsed.success ? [parsed.data] : []))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getGeneration(id: string): Promise<GenerationRecord | null> {
    const parsed = GenerationRecordSchema.safeParse(await client().get(GENERATION_KEY(id)));
    return parsed.success ? parsed.data : null;
  }

  async saveGeneration(record: GenerationRecord): Promise<void> {
    const redis = client();
    await redis.set(GENERATION_KEY(record.id), record);
    await addToIndex(redis, GENERATION_INDEX(record.projectId), record.id);
  }

  async listReviews(projectId: string): Promise<VisualReview[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(REVIEW_INDEX(projectId))) || [];
    const raw = await Promise.all(ids.map((id) => redis.get(REVIEW_KEY(id))));
    return raw
      .map((value) => VisualReviewSchema.safeParse(value))
      .flatMap((parsed) => (parsed.success ? [parsed.data] : []))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getReview(id: string): Promise<VisualReview | null> {
    const parsed = VisualReviewSchema.safeParse(await client().get(REVIEW_KEY(id)));
    return parsed.success ? parsed.data : null;
  }

  async saveReview(projectId: string, review: VisualReview): Promise<void> {
    const redis = client();
    await redis.set(REVIEW_KEY(review.id), review);
    await addToIndex(redis, REVIEW_INDEX(projectId), review.id);
  }

  async listLearnings(projectId: string): Promise<PromptLearning[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(LEARNING_INDEX(projectId))) || [];
    const raw = await Promise.all(ids.map((id) => redis.get(LEARNING_KEY(id))));
    return raw
      .map((value) => PromptLearningSchema.safeParse(value))
      .flatMap((parsed) => (parsed.success ? [parsed.data] : []))
      .sort((a, b) => b.id.localeCompare(a.id));
  }

  async saveLearning(learning: PromptLearning): Promise<void> {
    const redis = client();
    await redis.set(LEARNING_KEY(learning.id), learning);
    await addToIndex(redis, LEARNING_INDEX(learning.projectId), learning.id);
  }
}
