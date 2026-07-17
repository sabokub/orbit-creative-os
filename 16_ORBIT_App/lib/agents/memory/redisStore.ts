import "server-only";
import { Redis } from "@upstash/redis";
import { MemoryEntry, MemoryEntrySchema } from "../contracts";
import { MemoryStore } from "./store";

/**
 * Redis-backed MemoryStore. Same Upstash database and `orbit-hub:` namespace
 * as lib/db.ts and lib/studioBrain.ts — one database backs the whole app.
 * Follows the identical index-key + per-id-key layout used everywhere else.
 */
const MEMORY_INDEX_KEY = (projectId: string) => `orbit-hub:project:${projectId}:memory:index`;
const MEMORY_KEY = (id: string) => `orbit-hub:memory:${id}`;

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

/** Drops records that no longer match the schema instead of throwing downstream. */
function normalize(raw: unknown): MemoryEntry | null {
  const parsed = MemoryEntrySchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export class RedisMemoryStore implements MemoryStore {
  async listByProject(projectId: string): Promise<MemoryEntry[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(MEMORY_INDEX_KEY(projectId))) || [];
    if (ids.length === 0) return [];
    const raw = await Promise.all(ids.map((id) => redis.get(MEMORY_KEY(id))));
    return raw
      .map((r) => normalize(r))
      .filter((e): e is MemoryEntry => e !== null)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async get(id: string): Promise<MemoryEntry | null> {
    const redis = client();
    return normalize(await redis.get(MEMORY_KEY(id)));
  }

  async save(entry: MemoryEntry): Promise<void> {
    const redis = client();
    await redis.set(MEMORY_KEY(entry.id), entry);
    const indexKey = MEMORY_INDEX_KEY(entry.projectId);
    const ids = (await redis.get<string[]>(indexKey)) || [];
    if (!ids.includes(entry.id)) {
      ids.push(entry.id);
      await redis.set(indexKey, ids);
    }
  }
}
