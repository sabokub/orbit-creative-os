import "server-only";

/**
 * Lightweight, dependency-free input validation for the API routes.
 *
 * There is no auth layer anywhere in this app (no session/login, no API
 * key check) -- every route below is reachable by anyone with the deployed
 * URL. That is a real gap, out of scope to fix in this pass (it needs a
 * product decision: studio-only basic auth? Vercel access protection?
 * per-user accounts?). What we CAN and do fix here: no mutation route may
 * trust a client payload blindly -- every write is validated, coerced to
 * known shapes, and unknown fields are dropped rather than stored.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

const MAX_SHORT_STRING = 300;
const MAX_LONG_STRING = 20_000;

export function requireString(value: unknown, field: string, maxLength = MAX_SHORT_STRING): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError(`Le champ "${field}" est obligatoire.`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`Le champ "${field}" dépasse la longueur maximale (${maxLength}).`);
  }
  return value;
}

export function optionalString(value: unknown, field: string, maxLength = MAX_LONG_STRING): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new ValidationError(`Le champ "${field}" doit être une chaîne de caractères.`);
  }
  if (value.length > maxLength) {
    throw new ValidationError(`Le champ "${field}" dépasse la longueur maximale (${maxLength}).`);
  }
  return value;
}

export function stringOrDefault(value: unknown, field: string, fallback = "", maxLength = MAX_LONG_STRING): string {
  return optionalString(value, field, maxLength) ?? fallback;
}

export function requireEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`Le champ "${field}" doit être l'une des valeurs : ${allowed.join(", ")}.`);
  }
  return value as T;
}

export function optionalEnum<T extends string>(value: unknown, allowed: readonly T[], field: string): T | undefined {
  if (value === undefined || value === null) return undefined;
  return requireEnum(value, allowed, field);
}

export function requireNumberInRange(value: unknown, min: number, max: number, field: string): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < min || value > max) {
    throw new ValidationError(`Le champ "${field}" doit être un nombre entre ${min} et ${max}.`);
  }
  return value;
}

export function optionalNumberInRange(value: unknown, min: number, max: number, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  return requireNumberInRange(value, min, max, field);
}

export function optionalBoolean(value: unknown, field: string): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value !== "boolean") {
    throw new ValidationError(`Le champ "${field}" doit être un booléen.`);
  }
  return value;
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function optionalIsoDate(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !ISO_DATE_RE.test(value) || Number.isNaN(new Date(value).getTime())) {
    throw new ValidationError(`Le champ "${field}" doit être une date au format AAAA-MM-JJ.`);
  }
  return value;
}

export function optionalStringArray(value: unknown, field: string, maxItems = 50): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
    throw new ValidationError(`Le champ "${field}" doit être une liste de chaînes de caractères.`);
  }
  if (value.length > maxItems) {
    throw new ValidationError(`Le champ "${field}" dépasse le nombre maximal d'éléments (${maxItems}).`);
  }
  return value as string[];
}

/** Guards against giant/pathological JSON payloads before they hit any parsing logic. */
export function assertReasonablePayload(raw: string, maxBytes = 200_000): void {
  if (raw.length > maxBytes) {
    throw new ValidationError("La requête dépasse la taille maximale autorisée.");
  }
}
