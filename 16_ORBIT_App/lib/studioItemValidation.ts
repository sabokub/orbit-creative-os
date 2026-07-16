import "server-only";
import { CONTENT_CHANNELS, ItemKind, ItemStatus, StudioItemInput, UpdateItemPatch } from "./types";
import {
  optionalBoolean,
  optionalEnum,
  optionalIsoDate,
  optionalNumberInRange,
  optionalString,
  optionalStringArray,
  requireEnum,
  requireNumberInRange,
  requireString,
  stringOrDefault,
  ValidationError,
} from "./validation";

const KINDS: ItemKind[] = ["task", "content"];
const STATUSES: ItemStatus[] = ["backlog", "today", "in_progress", "blocked", "done", "archived"];

/**
 * Builds a fully-typed, safe StudioItemInput from an untrusted JSON body --
 * every field is validated/coerced and anything not listed here (including
 * attempts to smuggle `id`, `createdAt`, etc.) is silently dropped.
 */
export function sanitizeStudioItemInput(raw: unknown): StudioItemInput {
  if (!raw || typeof raw !== "object") throw new ValidationError("Corps de requête invalide.");
  const r = raw as Record<string, unknown>;

  return {
    kind: requireEnum(r.kind, KINDS, "kind"),
    title: requireString(r.title, "title"),
    description: stringOrDefault(r.description, "description"),
    category: stringOrDefault(r.category, "category", "Général"),
    channel: optionalEnum(r.channel, CONTENT_CHANNELS, "channel"),
    projectId: optionalString(r.projectId, "projectId"),
    estimateMinutes: requireNumberInRange(r.estimateMinutes, 1, 100_000, "estimateMinutes"),
    urgency: requireNumberInRange(r.urgency, 1, 5, "urgency"),
    impact: requireNumberInRange(r.impact, 1, 5, "impact"),
    launchCritical: optionalBoolean(r.launchCritical, "launchCritical"),
    dueDate: optionalIsoDate(r.dueDate, "dueDate"),
    dependsOn: optionalStringArray(r.dependsOn, "dependsOn"),
    notes: optionalString(r.notes, "notes"),
    status: optionalEnum(r.status, STATUSES, "status"),
    order: optionalNumberInRange(r.order, 0, 1_000_000, "order"),
  };
}

/** Same idea for PATCH: every field is optional, but whatever is present must be well-typed. */
export function sanitizeUpdateItemPatch(raw: unknown): UpdateItemPatch {
  if (!raw || typeof raw !== "object") throw new ValidationError("Corps de requête invalide.");
  const r = raw as Record<string, unknown>;
  const patch: UpdateItemPatch = {};

  if (r.title !== undefined) patch.title = requireString(r.title, "title");
  if (r.description !== undefined) patch.description = stringOrDefault(r.description, "description");
  if (r.category !== undefined) patch.category = stringOrDefault(r.category, "category", "Général");
  if (r.channel !== undefined) patch.channel = optionalEnum(r.channel, CONTENT_CHANNELS, "channel");
  if (r.projectId !== undefined) patch.projectId = optionalString(r.projectId, "projectId");
  if (r.estimateMinutes !== undefined) patch.estimateMinutes = requireNumberInRange(r.estimateMinutes, 1, 100_000, "estimateMinutes");
  if (r.urgency !== undefined) patch.urgency = requireNumberInRange(r.urgency, 1, 5, "urgency");
  if (r.impact !== undefined) patch.impact = requireNumberInRange(r.impact, 1, 5, "impact");
  if (r.launchCritical !== undefined) patch.launchCritical = optionalBoolean(r.launchCritical, "launchCritical");
  if (r.dueDate !== undefined) patch.dueDate = optionalIsoDate(r.dueDate, "dueDate");
  if (r.dependsOn !== undefined) patch.dependsOn = optionalStringArray(r.dependsOn, "dependsOn");
  if (r.notes !== undefined) patch.notes = optionalString(r.notes, "notes");
  if (r.status !== undefined) patch.status = requireEnum(r.status, STATUSES, "status");
  if (r.order !== undefined) patch.order = requireNumberInRange(r.order, 0, 1_000_000, "order");

  return patch;
}

/** Optimistic-concurrency token, sent alongside a patch: `{ ...fields, ifMatch }`. */
export function extractIfMatch(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  return typeof r.ifMatch === "string" ? r.ifMatch : undefined;
}
