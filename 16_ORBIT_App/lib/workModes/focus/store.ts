import { ActiveFocus } from "./contracts";
import { WorkMode } from "../contracts";

/** Storage-agnostic port for ActiveFocus (same pattern as MemoryStore). */
export interface FocusStore {
  listByMode(mode: WorkMode): Promise<ActiveFocus[]>;
  get(id: string): Promise<ActiveFocus | null>;
  save(focus: ActiveFocus): Promise<void>;
}
