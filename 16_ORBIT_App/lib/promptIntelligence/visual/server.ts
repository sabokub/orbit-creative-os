import "server-only";
import { memoryService } from "../../agents/server";
import { projectionService } from "../../projection/server";
import { syncService } from "../../sync/server";
import { RedisVisualPromptStore } from "./redisStore";
import { VisualPromptService } from "./service";

export function visualPromptService(): VisualPromptService {
  return new VisualPromptService(new RedisVisualPromptStore());
}

export async function approveVisualPrompt(promptId: string) {
  return visualPromptService().approvePrompt({
    promptId,
    memory: memoryService(),
    projection: projectionService(),
    sync: syncService(),
  });
}
