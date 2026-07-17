"use client";

import { WorkMode } from "./workModes/contracts";
import { ActiveFocus, FocusHistoryEntry, FocusInput } from "./workModes/focus/contracts";
import { ModePilotData } from "./workModes/pilot/types";

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Requête échouée (${res.status})`);
  return body as T;
}

export function getPilot(mode: WorkMode): Promise<ModePilotData> {
  return fetch(`/api/work-modes/${mode}/pilot`, { cache: "no-store" }).then(parse<ModePilotData>);
}

export function getFocus(mode: WorkMode): Promise<{ active: ActiveFocus | null; history: FocusHistoryEntry[] }> {
  return fetch(`/api/work-modes/${mode}/focus`, { cache: "no-store" }).then(
    parse<{ active: ActiveFocus | null; history: FocusHistoryEntry[] }>
  );
}

export function setFocus(mode: WorkMode, input: FocusInput): Promise<ActiveFocus> {
  return fetch(`/api/work-modes/${mode}/focus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }).then(parse<ActiveFocus>);
}

export function completeFocus(mode: WorkMode, id: string): Promise<ActiveFocus> {
  return fetch(`/api/work-modes/${mode}/focus/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).then(parse<ActiveFocus>);
}
