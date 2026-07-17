import { getWorkModeConfig } from "../config";
import { ModeInputs, ModePilotData } from "./types";
import { getModeCalculator } from "./calculators";
import { resolveCurrentPriority, priorityHref } from "./priority";
import { resolvePrimaryBlocker, resolveCrossModeBlockers } from "./blockers";

/** Assembles the full pilot card for a mode from shared inputs. */
export function buildModePilotData(inputs: ModeInputs): ModePilotData {
  const calc = getModeCalculator(inputs.mode);
  const config = getWorkModeConfig(inputs.mode);

  const progress = calc.progress(inputs);
  const charts = calc.charts(inputs);
  const empty = calc.emptyState?.(inputs) ?? null;
  const priority = resolveCurrentPriority(inputs);
  const primaryBlocker = resolvePrimaryBlocker(inputs);
  const crossModeBlockers = resolveCrossModeBlockers(inputs);

  const upcoming = inputs.studioItems
    .filter((i) => i.dueDate && i.status !== "done" && i.status !== "archived")
    .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))[0];
  const nearestDeadline = upcoming
    ? { title: upcoming.title, date: upcoming.dueDate!, overdue: new Date(upcoming.dueDate!).getTime() < inputs.now.getTime() }
    : null;

  const primaryAction = empty
    ? { label: empty.actionLabel, href: empty.actionHref }
    : { label: inputs.focus ? "Continuer" : "Démarrer", href: priorityHref(inputs, priority) };

  let status: ModePilotData["status"];
  if (primaryBlocker) status = "blocked";
  else if (progress.reliable && progress.percentage >= 100) status = "done";
  else if (inputs.studioItems.length === 0 && !inputs.focus) status = "idle";
  else if (crossModeBlockers.length > 0 || nearestDeadline?.overdue) status = "at-risk";
  else status = "on-track";

  return {
    mode: inputs.mode,
    modeLabel: config.label,
    focus: inputs.focus,
    progress,
    status,
    immediatePriority: empty ? null : priority,
    primaryAction,
    primaryBlocker,
    nearestDeadline,
    charts,
    crossModeBlockers,
    empty,
    calculatedAt: inputs.now.toISOString(),
  };
}
