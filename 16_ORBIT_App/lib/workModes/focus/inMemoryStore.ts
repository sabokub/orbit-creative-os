import { ActiveFocus } from "./contracts";
import { WorkMode } from "../contracts";
import { FocusStore } from "./store";

export class InMemoryFocusStore implements FocusStore {
  private readonly byId = new Map<string, ActiveFocus>();

  async listByMode(mode: WorkMode): Promise<ActiveFocus[]> {
    return [...this.byId.values()]
      .filter((f) => f.mode === mode)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async get(id: string): Promise<ActiveFocus | null> {
    return this.byId.get(id) ?? null;
  }
  async save(focus: ActiveFocus): Promise<void> {
    this.byId.set(focus.id, { ...focus });
  }
}
