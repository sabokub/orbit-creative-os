import { z } from "zod";
import { WorkModeSchema } from "../contracts";

/**
 * ActiveFocus — the single principal objective of a work mode. Exactly one
 * focus is `active` per mode at a time (enforced by the service); replacing it
 * keeps the previous one in history rather than deleting it.
 */

export const FOCUS_STATUSES = ["draft", "active", "paused", "blocked", "completed", "archived"] as const;
export type FocusStatus = (typeof FOCUS_STATUSES)[number];
export const FocusStatusSchema = z.enum(FOCUS_STATUSES);

export const FocusActionSchema = z.object({
  label: z.string().min(1).max(200),
  /** Concrete destination so the primary button actually acts (never decorative). */
  href: z.string().max(500).optional(),
  kind: z.enum(["task", "project", "prompt", "content", "deliverable", "decision", "review", "custom"]).default("custom"),
});
export type FocusAction = z.infer<typeof FocusActionSchema>;

export const FocusProgressSchema = z.object({
  percentage: z.number().min(0).max(100),
  /** False when the underlying data is too thin to compute a trustworthy number. */
  reliable: z.boolean(),
  computedAt: z.string(),
});
export type FocusProgress = z.infer<typeof FocusProgressSchema>;

export const ActiveFocusSchema = z.object({
  id: z.string().min(1),
  mode: WorkModeSchema,
  projectId: z.string().optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(4000).default(""),
  status: FocusStatusSchema,
  /** 1 (low) – 5 (critical). */
  priority: z.number().int().min(1).max(5).default(3),
  progressPercentage: z.number().min(0).max(100).default(0),
  targetDate: z.string().optional(),
  successCriteria: z.string().max(2000).default(""),
  currentAction: z.string().max(500).default(""),
  nextAction: z.string().max(500).default(""),
  blockerIds: z.array(z.string().max(200)).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
});
export type ActiveFocus = z.infer<typeof ActiveFocusSchema>;

export const FocusHistoryEntrySchema = z.object({
  id: z.string().min(1),
  mode: WorkModeSchema,
  title: z.string().min(1).max(300),
  status: FocusStatusSchema,
  progressPercentage: z.number().min(0).max(100),
  createdAt: z.string(),
  endedAt: z.string(),
});
export type FocusHistoryEntry = z.infer<typeof FocusHistoryEntrySchema>;

/** Input to create/replace a focus — server fills id/status/timestamps. */
export const FocusInputSchema = z.object({
  projectId: z.string().optional(),
  title: z.string().min(1).max(300),
  description: z.string().max(4000).optional(),
  priority: z.number().int().min(1).max(5).optional(),
  targetDate: z.string().optional(),
  successCriteria: z.string().max(2000).optional(),
  currentAction: z.string().max(500).optional(),
  nextAction: z.string().max(500).optional(),
});
export type FocusInput = z.infer<typeof FocusInputSchema>;
