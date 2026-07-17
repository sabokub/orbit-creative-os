import "server-only";
import { Redis } from "@upstash/redis";
import { ActiveFocus, ActiveFocusSchema } from "./contracts";
import { WorkMode } from "../contracts";
import { FocusStore } from "./store";

const FOCUS_INDEX = (mode: WorkMode) => `orbit-hub:workmode:${mode}:focus:index`;
const FOCUS_KEY = (id: string) => `orbit-hub:focus:${id}`;

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

export class RedisFocusStore implements FocusStore {
  async listByMode(mode: WorkMode): Promise<ActiveFocus[]> {
    const redis = client();
    const ids = (await redis.get<string[]>(FOCUS_INDEX(mode))) || [];
    if (ids.length === 0) return [];
    const raw = await Promise.all(ids.map((id) => redis.get(FOCUS_KEY(id))));
    return raw
      .map((r) => ActiveFocusSchema.safeParse(r))
      .flatMap((r) => (r.success ? [r.data] : []))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(id: string): Promise<ActiveFocus | null> {
    const parsed = ActiveFocusSchema.safeParse(await client().get(FOCUS_KEY(id)));
    return parsed.success ? parsed.data : null;
  }

  async save(focus: ActiveFocus): Promise<void> {
    const redis = client();
    await redis.set(FOCUS_KEY(focus.id), focus);
    const key = FOCUS_INDEX(focus.mode);
    const ids = (await redis.get<string[]>(key)) || [];
    if (!ids.includes(focus.id)) {
      ids.push(focus.id);
      await redis.set(key, ids);
    }
  }
}
