import "server-only";
import { Redis } from "@upstash/redis";
import {
  ExternalConversation,
  ExternalConversationSchema,
  ProgressEntry,
  ProgressEntrySchema,
} from "./contracts";
import { ConversationStore, ProgressStore } from "./stores";

/** Same Upstash DB / `orbit-hub:` namespace as the rest of the app. */
const CONV_INDEX = (p: string) => `orbit-hub:project:${p}:conversations:index`;
const CONV_KEY = (id: string) => `orbit-hub:conversation:${id}`;
const PROG_INDEX = (p: string) => `orbit-hub:project:${p}:progress:index`;
const PROG_KEY = (id: string) => `orbit-hub:progress:${id}`;

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

export class RedisConversationStore implements ConversationStore {
  async listByProject(projectId: string): Promise<ExternalConversation[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(CONV_INDEX(projectId))) || [];
    if (ids.length === 0) return [];
    const raw = await Promise.all(ids.map((id) => redis.get(CONV_KEY(id))));
    return raw
      .map((r) => ExternalConversationSchema.safeParse(r))
      .flatMap((r) => (r.success ? [r.data] : []))
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  }

  async get(id: string): Promise<ExternalConversation | null> {
    const parsed = ExternalConversationSchema.safeParse(await client().get(CONV_KEY(id)));
    return parsed.success ? parsed.data : null;
  }

  async save(conversation: ExternalConversation): Promise<void> {
    const redis = client();
    await redis.set(CONV_KEY(conversation.id), conversation);
    const key = CONV_INDEX(conversation.projectId);
    const ids = (await redis.get<string[]>(key)) || [];
    if (!ids.includes(conversation.id)) {
      ids.push(conversation.id);
      await redis.set(key, ids);
    }
  }

  async remove(id: string, projectId: string): Promise<void> {
    const redis = client();
    await redis.del(CONV_KEY(id));
    const key = CONV_INDEX(projectId);
    const ids = (await redis.get<string[]>(key)) || [];
    await redis.set(key, ids.filter((x) => x !== id));
  }
}

export class RedisProgressStore implements ProgressStore {
  async listByProject(projectId: string): Promise<ProgressEntry[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(PROG_INDEX(projectId))) || [];
    if (ids.length === 0) return [];
    const raw = await Promise.all(ids.map((id) => redis.get(PROG_KEY(id))));
    return raw
      .map((r) => ProgressEntrySchema.safeParse(r))
      .flatMap((r) => (r.success ? [r.data] : []))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async save(entry: ProgressEntry): Promise<void> {
    const redis = client();
    await redis.set(PROG_KEY(entry.id), entry);
    const key = PROG_INDEX(entry.projectId);
    const ids = (await redis.get<string[]>(key)) || [];
    if (!ids.includes(entry.id)) {
      ids.push(entry.id);
      await redis.set(key, ids);
    }
  }

  async hasDedupeKey(projectId: string, dedupeKey: string): Promise<boolean> {
    const entries = await this.listByProject(projectId);
    return entries.some((e) => e.dedupeKey === dedupeKey);
  }
}
