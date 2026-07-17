import { ActiveFocus, FocusHistoryEntry, FocusInput, FocusInputSchema, FocusStatus } from "./contracts";
import { WorkMode } from "../contracts";
import { FocusStore } from "./store";

function genId(): string {
  return `focus-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * FocusService — enforces the invariant "one active focus per mode". Setting a
 * new focus archives any currently active one (kept in history), never deletes
 * it. All lifecycle transitions go through here.
 */
export class FocusService {
  constructor(private readonly store: FocusStore) {}

  async getActive(mode: WorkMode): Promise<ActiveFocus | null> {
    const all = await this.store.listByMode(mode);
    return all.find((f) => f.status === "active" || f.status === "blocked") ?? null;
  }

  async history(mode: WorkMode): Promise<FocusHistoryEntry[]> {
    const all = await this.store.listByMode(mode);
    return all
      .filter((f) => f.status === "archived" || f.status === "completed")
      .map((f) => ({
        id: f.id,
        mode: f.mode,
        title: f.title,
        status: f.status,
        progressPercentage: f.progressPercentage,
        createdAt: f.createdAt,
        endedAt: f.completedAt ?? f.updatedAt,
      }));
  }

  /** Creates a new focus and makes it the single active one for the mode. */
  async setActive(mode: WorkMode, rawInput: FocusInput): Promise<ActiveFocus> {
    const input = FocusInputSchema.parse(rawInput);
    const now = new Date().toISOString();

    // Archive the currently active/blocked focus (kept in history).
    const all = await this.store.listByMode(mode);
    for (const prev of all) {
      if (prev.status === "active" || prev.status === "blocked" || prev.status === "paused") {
        await this.store.save({ ...prev, status: "archived", updatedAt: now });
      }
    }

    const focus: ActiveFocus = {
      id: genId(),
      mode,
      projectId: input.projectId,
      title: input.title,
      description: input.description ?? "",
      status: "active",
      priority: input.priority ?? 3,
      progressPercentage: 0,
      targetDate: input.targetDate,
      successCriteria: input.successCriteria ?? "",
      currentAction: input.currentAction ?? "",
      nextAction: input.nextAction ?? "",
      blockerIds: [],
      createdAt: now,
      updatedAt: now,
    };
    await this.store.save(focus);
    return focus;
  }

  /** Partial update of the active focus (status, progress, actions, blockers). */
  async update(id: string, patch: Partial<Omit<ActiveFocus, "id" | "mode" | "createdAt">>): Promise<ActiveFocus> {
    const current = await this.store.get(id);
    if (!current) throw new Error(`Focus introuvable : ${id}`);
    const next: ActiveFocus = { ...current, ...patch, id: current.id, mode: current.mode, updatedAt: new Date().toISOString() };
    await this.store.save(next);
    return next;
  }

  async setStatus(id: string, status: FocusStatus): Promise<ActiveFocus> {
    const current = await this.store.get(id);
    if (!current) throw new Error(`Focus introuvable : ${id}`);
    const now = new Date().toISOString();
    const next: ActiveFocus = {
      ...current,
      status,
      updatedAt: now,
      completedAt: status === "completed" ? now : current.completedAt,
      progressPercentage: status === "completed" ? 100 : current.progressPercentage,
    };
    await this.store.save(next);
    return next;
  }

  complete(id: string): Promise<ActiveFocus> {
    return this.setStatus(id, "completed");
  }
}
