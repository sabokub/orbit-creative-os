import "server-only";
import { SyncService } from "./service";
import { RedisConversationStore, RedisProgressStore } from "./redisStores";

/** Production wiring for the sync layer (Redis-backed). */
export function syncService(): SyncService {
  return new SyncService(new RedisConversationStore(), new RedisProgressStore());
}

/**
 * Shared secret guard for the Claude Code ingestion endpoint. The secret lives
 * only in server env (ORBIT_INGEST_SECRET) and is never sent to the client.
 * Returns true when the request is authorized.
 */
export function verifyIngestSecret(provided: string | null): boolean {
  const expected = process.env.ORBIT_INGEST_SECRET;
  if (!expected) return false; // fail closed: no secret configured ⇒ endpoint refuses
  return typeof provided === "string" && provided.length > 0 && provided === expected;
}
