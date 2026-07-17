import "server-only";
import { listItems } from "../../studioBrain";
import { memoryService } from "../../agents/server";
import { syncService } from "../../sync/server";
import { WorkMode } from "../contracts";
import { FocusService } from "../focus/service";
import { RedisFocusStore } from "../focus/redisStore";
import { ModeInputs } from "./types";
import { buildModePilotData } from "./build";
import { resolveCurrentPriority } from "./priority";

export function focusService(): FocusService {
  return new FocusService(new RedisFocusStore());
}

/**
 * Gathers the shared inputs for a mode from the existing stores (Studio Brain
 * items, project-scoped agent memory + progress when a focus carries a project).
 * Studio items are filtered to the focus project only for project-scoped modes
 * (client/creation), so no cross-project leak.
 */
export async function gatherModeInputs(mode: WorkMode): Promise<ModeInputs> {
  const focus = await focusService().getActive(mode);
  const projectId = focus?.projectId;

  let studioItems: Awaited<ReturnType<typeof listItems>> = [];
  try {
    studioItems = await listItems();
  } catch {
    studioItems = [];
  }
  if (projectId && (mode === "client" || mode === "creation")) {
    studioItems = studioItems.filter((i) => i.projectId === projectId);
  }

  const [memory, progress] = await Promise.all([
    projectId ? memoryService().list(projectId).catch(() => []) : Promise.resolve([]),
    projectId ? syncService().listProgress(projectId).catch(() => []) : Promise.resolve([]),
  ]);

  return {
    mode,
    now: new Date(),
    studioItems,
    memory,
    progress,
    focus,
    hasProjectContext: Boolean(projectId),
  };
}

export async function computeModePilot(mode: WorkMode) {
  return buildModePilotData(await gatherModeInputs(mode));
}

export async function computeModePriority(mode: WorkMode) {
  return resolveCurrentPriority(await gatherModeInputs(mode));
}
