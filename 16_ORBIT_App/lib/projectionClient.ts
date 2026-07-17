"use client";

import { ProjectionConflict, ProjectionConflictResolution, ProjectionPreview, ProjectionResult } from "./projection/contracts";

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Requête échouée (${res.status})`);
  return body as T;
}

export function previewProjection(projectId: string, memoryEntryId: string): Promise<ProjectionPreview> {
  return fetch(`/api/projects/${projectId}/projections/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memoryEntryId }),
  }).then(parse<ProjectionPreview>);
}

export function applyProjection(
  projectId: string,
  memoryEntryId: string,
  mode: "confirm" | "auto-safe",
  selectedMutationIds?: string[]
): Promise<ProjectionResult> {
  return fetch(`/api/projects/${projectId}/projections/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memoryEntryId, mode, selectedMutationIds }),
  }).then(parse<ProjectionResult>);
}

export function listProjectionConflicts(projectId: string): Promise<ProjectionConflict[]> {
  return fetch(`/api/projects/${projectId}/projection-conflicts`, { cache: "no-store" }).then(parse<ProjectionConflict[]>);
}

export function resolveProjectionConflict(projectId: string, conflictId: string, resolution: ProjectionConflictResolution): Promise<ProjectionConflict> {
  return fetch(`/api/projects/${projectId}/projection-conflicts/${conflictId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution }),
  }).then(parse<ProjectionConflict>);
}
