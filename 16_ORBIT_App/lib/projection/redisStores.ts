import "server-only";
import { Redis } from "@upstash/redis";
import { ProjectionConflict, ProjectionConflictSchema, ProjectionResult, ProjectionResultSchema, StudioBrainLink, StudioBrainLinkSchema } from "./contracts";
import { ConflictStore, LinkStore, ProjectionLogStore } from "./stores";

/** Same Upstash DB / `orbit-hub:` namespace as the rest of the app. */
const LINK_INDEX = (p: string) => `orbit-hub:project:${p}:projection-links:index`;
const LINK_KEY = (id: string) => `orbit-hub:projection-link:${id}`;
const CONFLICT_INDEX = (p: string) => `orbit-hub:project:${p}:projection-conflicts:index`;
const CONFLICT_KEY = (id: string) => `orbit-hub:projection-conflict:${id}`;
const LOG_INDEX = (p: string) => `orbit-hub:project:${p}:projection-log:index`;
const LOG_KEY = (id: string) => `orbit-hub:projection-log:${id}`;

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

export class RedisLinkStore implements LinkStore {
  async get(dedupeKey: string): Promise<StudioBrainLink | null> {
    const parsed = StudioBrainLinkSchema.safeParse(await client().get(LINK_KEY(dedupeKey)));
    return parsed.success ? parsed.data : null;
  }

  async save(link: StudioBrainLink): Promise<void> {
    const redis = client();
    await redis.set(LINK_KEY(link.id), link);
    const key = LINK_INDEX(link.projectId);
    const ids = (await redis.get<string[]>(key)) || [];
    if (!ids.includes(link.id)) {
      ids.push(link.id);
      await redis.set(key, ids);
    }
  }

  async listByProject(projectId: string): Promise<StudioBrainLink[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(LINK_INDEX(projectId))) || [];
    if (ids.length === 0) return [];
    const raw = await Promise.all(ids.map((id) => redis.get(LINK_KEY(id))));
    return raw.map((r) => StudioBrainLinkSchema.safeParse(r)).flatMap((r) => (r.success ? [r.data] : []));
  }
}

export class RedisConflictStore implements ConflictStore {
  async get(id: string): Promise<ProjectionConflict | null> {
    const parsed = ProjectionConflictSchema.safeParse(await client().get(CONFLICT_KEY(id)));
    return parsed.success ? parsed.data : null;
  }

  async save(conflict: ProjectionConflict): Promise<void> {
    const redis = client();
    await redis.set(CONFLICT_KEY(conflict.id), conflict);
    const key = CONFLICT_INDEX(conflict.projectId);
    const ids = (await redis.get<string[]>(key)) || [];
    if (!ids.includes(conflict.id)) {
      ids.push(conflict.id);
      await redis.set(key, ids);
    }
  }

  async listByProject(projectId: string): Promise<ProjectionConflict[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(CONFLICT_INDEX(projectId))) || [];
    if (ids.length === 0) return [];
    const raw = await Promise.all(ids.map((id) => redis.get(CONFLICT_KEY(id))));
    return raw
      .map((r) => ProjectionConflictSchema.safeParse(r))
      .flatMap((r) => (r.success ? [r.data] : []))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findOpenByDedupeKey(projectId: string, dedupeKey: string): Promise<ProjectionConflict | null> {
    const all = await this.listByProject(projectId);
    return all.find((c) => c.status === "open" && c.mutation.deduplicationKey === dedupeKey) ?? null;
  }
}

export class RedisProjectionLogStore implements ProjectionLogStore {
  async save(result: ProjectionResult): Promise<void> {
    const redis = client();
    await redis.set(LOG_KEY(result.id), result);
    const key = LOG_INDEX(result.projectId);
    const ids = (await redis.get<string[]>(key)) || [];
    if (!ids.includes(result.id)) {
      ids.push(result.id);
      await redis.set(key, ids);
    }
  }

  async listByProject(projectId: string): Promise<ProjectionResult[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(LOG_INDEX(projectId))) || [];
    if (ids.length === 0) return [];
    const raw = await Promise.all(ids.map((id) => redis.get(LOG_KEY(id))));
    return raw
      .map((r) => ProjectionResultSchema.safeParse(r))
      .flatMap((r) => (r.success ? [r.data] : []))
      .sort((a, b) => b.calculatedAt.localeCompare(a.calculatedAt));
  }
}
