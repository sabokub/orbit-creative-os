import "server-only";
import { ProjectionService } from "./service";
import { RedisLinkStore, RedisConflictStore, RedisProjectionLogStore } from "./redisStores";

/** Production wiring (Redis-backed, same orbit-hub: namespace as the rest of the app). */
export function projectionService(): ProjectionService {
  return new ProjectionService(new RedisLinkStore(), new RedisConflictStore(), new RedisProjectionLogStore());
}
