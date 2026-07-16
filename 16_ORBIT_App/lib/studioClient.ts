"use client";

import {
  ActivityEntry,
  Decision,
  IntegrationId,
  IntegrationSyncState,
  StudioItem,
  StudioItemInput,
  StudioNotification,
  UpdateItemPatch,
} from "./types";

/** Thrown when the server rejects a write because the item changed elsewhere first (see ifMatch below). */
export class StudioConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudioConflictError";
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.error || `La requête a échoué (${res.status})`;
    if (res.status === 409) throw new StudioConflictError(message);
    throw new Error(message);
  }
  return res.json();
}

export async function listStudioItems(): Promise<StudioItem[]> {
  const res = await fetch("/api/studio/items", { cache: "no-store" });
  return parse<StudioItem[]>(res);
}

export async function createStudioItem(input: StudioItemInput): Promise<StudioItem> {
  const res = await fetch("/api/studio/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parse<StudioItem>(res);
}

/**
 * @param ifMatch the `updatedAt` this client last observed for the item.
 *   When provided, the server rejects the write with a 409 (surfaced as
 *   StudioConflictError) if the item was modified elsewhere since -- this is
 *   the optimistic-concurrency guard against two tabs/users racing on the
 *   same item.
 */
export async function updateStudioItem(id: string, patch: UpdateItemPatch, ifMatch?: string): Promise<StudioItem> {
  const res = await fetch(`/api/studio/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ifMatch ? { ...patch, ifMatch } : patch),
  });
  return parse<StudioItem>(res);
}

export async function archiveStudioItem(id: string): Promise<StudioItem> {
  const res = await fetch(`/api/studio/items/${id}`, { method: "DELETE" });
  return parse<StudioItem>(res);
}

export async function listDecisions(): Promise<Decision[]> {
  const res = await fetch("/api/studio/decisions", { cache: "no-store" });
  return parse<Decision[]>(res);
}

export async function resolveDecision(id: string, resolution: string): Promise<Decision> {
  const res = await fetch(`/api/studio/decisions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution }),
  });
  return parse<Decision>(res);
}

export async function listActivity(limit = 30): Promise<ActivityEntry[]> {
  const res = await fetch(`/api/studio/activity?limit=${limit}`, { cache: "no-store" });
  return parse<ActivityEntry[]>(res);
}

export async function listNotifications(): Promise<StudioNotification[]> {
  const res = await fetch("/api/studio/notifications", { cache: "no-store" });
  return parse<StudioNotification[]>(res);
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch("/api/studio/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function listIntegrations(): Promise<IntegrationSyncState[]> {
  const res = await fetch("/api/studio/integrations", { cache: "no-store" });
  return parse<IntegrationSyncState[]>(res);
}

export async function runIntegrationSync(id: IntegrationId): Promise<IntegrationSyncState> {
  const res = await fetch("/api/studio/integrations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  return parse<IntegrationSyncState>(res);
}
