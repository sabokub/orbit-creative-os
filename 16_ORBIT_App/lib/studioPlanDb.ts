import "server-only";
import { Redis } from "@upstash/redis";
import { DEFAULT_STUDIO_PLAN, StudioPlan } from "./studioPlan";

const STUDIO_PLAN_KEY = "orbit-hub:studio-plan";

function hasRedisEnv() {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function client(): Redis {
  if (!hasRedisEnv()) {
    throw new Error("Aucune base Redis connectée pour le plan 24March.");
  }
  return Redis.fromEnv();
}

export async function getStudioPlan(): Promise<StudioPlan> {
  const redis = client();
  const stored = await redis.get<StudioPlan>(STUDIO_PLAN_KEY);
  if (stored) return stored;
  await redis.set(STUDIO_PLAN_KEY, DEFAULT_STUDIO_PLAN);
  return DEFAULT_STUDIO_PLAN;
}

export async function saveStudioPlan(plan: StudioPlan): Promise<StudioPlan> {
  const nextPlan: StudioPlan = { ...plan, updatedAt: new Date().toISOString() };
  await client().set(STUDIO_PLAN_KEY, nextPlan);
  return nextPlan;
}
