import { StudioItem } from "../../types";
import { MemoryEntry } from "../../agents/contracts";
import { ProgressEntry } from "../../sync/contracts";
import { WorkMode } from "../contracts";
import { ActiveFocus } from "../focus/contracts";

/** Everything a mode calculator reads. Shared across all modes — no per-mode fetch duplication. */
export interface ModeInputs {
  mode: WorkMode;
  now: Date;
  studioItems: StudioItem[];
  /** Project-scoped agent memory (present when the focus/project is known). */
  memory: MemoryEntry[];
  progress: ProgressEntry[];
  focus: ActiveFocus | null;
  /** Whether an active focus carries a projectId (drives memory/progress reliability). */
  hasProjectContext: boolean;
}

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface ChartSpec {
  id: string;
  title: string;
  kind: "segments" | "bars" | "meter";
  data: ChartDatum[];
  /** True when the data is too thin to be trustworthy — UI shows "Données insuffisantes". */
  insufficient: boolean;
  note?: string;
}

export interface CurrentPriority {
  priorityId: string;
  title: string;
  reason: string;
  nextAction: string;
  expectedImpact: string;
  sourceIds: string[];
  /** 0-1 rule-based confidence. */
  confidence: number;
  calculatedAt: string;
}

export interface PilotBlocker {
  id: string;
  title: string;
  impact: string;
  action?: { label: string; href?: string };
}

export interface CrossModeBlocker {
  title: string;
  sourceMode: WorkMode;
  impact: string;
  action?: { label: string; href?: string };
}

export interface PilotProgress {
  percentage: number;
  reliable: boolean;
  method: string;
}

export interface ModePilotData {
  mode: WorkMode;
  modeLabel: string;
  focus: ActiveFocus | null;
  progress: PilotProgress;
  /** Derived one-word status for the card header. */
  status: "on-track" | "at-risk" | "blocked" | "idle" | "done";
  immediatePriority: CurrentPriority | null;
  primaryAction: { label: string; href: string } | null;
  primaryBlocker: PilotBlocker | null;
  nearestDeadline: { title: string; date: string; overdue: boolean } | null;
  charts: ChartSpec[];
  crossModeBlockers: CrossModeBlocker[];
  empty: { message: string; actionLabel: string; actionHref: string } | null;
  calculatedAt: string;
}

/** A mode calculator: turns shared inputs into progress + charts. */
export interface ModeCalculator {
  progress(inputs: ModeInputs): PilotProgress;
  charts(inputs: ModeInputs): ChartSpec[];
  /** Optional empty-state when there is genuinely nothing to show. */
  emptyState?(inputs: ModeInputs): ModePilotData["empty"];
}
