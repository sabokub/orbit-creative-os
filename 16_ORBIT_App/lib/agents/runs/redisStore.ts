import "server-only";
import { Redis } from "@upstash/redis";
import { OrchestrationRun, OrchestrationRunSchema } from "../contracts";
import { RunStore } from "./store";

const RUNS_INDEX_KEY = (projectId: string) => `orbit-hub:project:${projectId}:runs:index`;
const RUN_KEY = (id: string) => `orbit-hub:run:${id}`;

function hasRedisEnv() {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function client(): Redis {
  if (!hasRedisEnv()) {
    throw new Error(
      "Aucune base connectée. Ajoute une intégration Redis (Upstash) dans Vercel puis relie-la à ce projet, ou lis 16_ORBIT_App/README.md pour le développement local."
    );
  }
  return Redis.fromEnv();
}

function normalize(raw: unknown): OrchestrationRun | null {
  const parsed = OrchestrationRunSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export class RedisRunStore implements RunStore {
  async listByProject(projectId: string): Promise<OrchestrationRun[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(RUNS_INDEX_KEY(projectId))) || [];
    if (ids.length === 0) return [];
    const raw = await Promise.all(ids.map((id) => redis.get(RUN_KEY(id))));
    return raw
      .map((r) => normalize(r))
      .filter((r): r is OrchestrationRun => r !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<OrchestrationRun | null> {
    const redis = client();
    return normalize(await redis.get(RUN_KEY(id)));
  }

  async save(run: OrchestrationRun): Promise<void> {
    const redis = client();
    await redis.set(RUN_KEY(run.id), run);
    const indexKey = RUNS_INDEX_KEY(run.projectId);
    const ids = (await redis.get<string[]>(indexKey)) || [];
    if (!ids.includes(run.id)) {
      ids.push(run.id);
      await redis.set(indexKey, ids);
    }
  }
}
