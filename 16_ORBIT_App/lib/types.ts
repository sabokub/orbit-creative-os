import type { AnalysisResult } from "./responseAnalysis/types";

export type Stage =
  | "brief"
  | "strategy"
  | "creative"
  | "website"
  | "content"
  | "images"
  | "review"
  | "exported";

export type ReviewStatus = "Approved" | "Needs revision" | "Blocked" | "Not reviewed";

export type WorkflowStep = "strategy" | "creative" | "website" | "content" | "images" | "review";

export type WorkflowType = "website" | "content" | "images" | "review" | "brand-kit";

export interface BrandProfile {
  id: string;
  name: string;
  activity: string;
  positioning: string;
  audience: string;
  offer: string;
  brandPromise: string;
  messagePillars: string[];
  visualDirection: string;
  toneOfVoice: string;
  colors: string;
  photographyDirection: string;
  contentDirection: string;
  websiteDirection: string;
  imagePromptRules: string;
  avoid: string[];
  successCriteria: string;
}

/**
 * Marque = contexte fixe (Brand Profile). Livrable = contexte variable (Project Brief).
 * Tous les générateurs reçoivent les deux, jamais un brief qui mélange les deux.
 */
export interface ProjectBrief {
  brandProfileId: string;
  workflowType: WorkflowType;
  projectGoal: string;
  specificContext: string;
  deliverableType: string;
  references: string;
  constraints: string;
  channels: string;
  format: string;
  successCriteria: string;
}

export interface GeneratedOutput {
  step: WorkflowStep;
  content: string;
  created_at: string;
  /**
   * Canonical analysis-pipeline result attached at save time, when the
   * output went through `analyzeOrbitResponse` + explicit user validation.
   * Optional and absent on outputs saved before the response-analysis
   * engine existed — those render as "not analyzed" rather than an error.
   */
  analysis?: AnalysisResult;
  /** Prior saved versions, kept when the user explicitly chose "save as new version" over an existing deliverable. */
  previousVersions?: GeneratedOutput[];
  /** True once the accepted Studio Brain changes for `analysis` have actually been applied — makes double-validation a safe no-op instead of a duplicate apply. */
  studioBrainApplied?: boolean;
}

export interface Review {
  target: string;
  content: string;
  status: ReviewStatus;
  created_at: string;
  /** Same canonical analysis result as GeneratedOutput.analysis, when available. */
  analysis?: AnalysisResult;
  previousVersions?: Review[];
  studioBrainApplied?: boolean;
}

export interface ExportRecord {
  target: string;
  format: "markdown" | "google-doc" | "pdf";
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  stage: Stage;
  created_at: string;
  updated_at: string;
  brief: ProjectBrief;
  outputs: Partial<Record<WorkflowStep, GeneratedOutput>>;
  reviews: Review[];
  exports: ExportRecord[];
}

export const emptyProjectBrief = (brandProfileId: string): ProjectBrief => ({
  brandProfileId,
  workflowType: "website",
  projectGoal: "",
  specificContext: "",
  deliverableType: "",
  references: "",
  constraints: "",
  channels: "Instagram, TikTok, Pinterest, Website",
  format: "Markdown",
  successCriteria: "",
});

/* ------------------------------------------------------------------------ *
 * Studio Brain — unified data model for ORBIT V3.
 * Tasks and content items share the exact same lifecycle, scoring and
 * dependency model: both are "StudioItem"s distinguished by `kind`.
 * ------------------------------------------------------------------------ */

/** The one hard date constraint of the studio right now: nothing lands after this. */
export const STUDIO_LAUNCH_CUTOFF = "2026-08-31";
/** Moment the countdown clock targets (morning after the cutoff day). */
export const STUDIO_LAUNCH_MOMENT = "2026-09-01T09:00:00+02:00";

export type ItemKind = "task" | "content";

/**
 * backlog     -> not started, not scheduled for today
 * today       -> pulled into the active "do this now" set
 * in_progress -> actively being worked
 * blocked     -> at least one dependency is not done
 * done        -> completed, leaves the active lists
 * archived    -> removed from view but never deleted (history/archive page)
 */
export type ItemStatus = "backlog" | "today" | "in_progress" | "blocked" | "done" | "archived";

export const ACTIVE_STATUSES: ItemStatus[] = ["backlog", "today", "in_progress", "blocked"];

export type ContentChannel =
  | "Reels"
  | "TikTok"
  | "Stories"
  | "Pinterest"
  | "Journal"
  | "Emails"
  | "Guide"
  | "Behind the scenes"
  | "Lifestyle"
  | "Launch";

export const CONTENT_CHANNELS: ContentChannel[] = [
  "Reels",
  "TikTok",
  "Stories",
  "Pinterest",
  "Journal",
  "Emails",
  "Guide",
  "Behind the scenes",
  "Lifestyle",
  "Launch",
];

export interface StudioItem {
  id: string;
  kind: ItemKind;
  title: string;
  description: string;
  status: ItemStatus;
  /** Manual ordering within its kind/status bucket — preserved across lifecycle transitions. */
  order: number;
  /** Free-form category for tasks (e.g. "Site web", "Automatisation"); channel name for content. */
  category: string;
  channel?: ContentChannel;
  projectId?: string;
  estimateMinutes: number;
  /** 1 (low) – 5 (high) */
  urgency: number;
  /** 1 (low) – 5 (high) */
  impact: number;
  launchCritical: boolean;
  /** ISO date, must never be after STUDIO_LAUNCH_CUTOFF. */
  dueDate?: string;
  /** IDs of StudioItems that must be `done` before this one can start. */
  dependsOn: string[];
  createdAt: string;
  updatedAt: string;
  doneAt?: string;
  archivedAt?: string;
  notes?: string;
}

export type StudioItemInput = Omit<StudioItem, "id" | "createdAt" | "updatedAt" | "status" | "order"> &
  Partial<Pick<StudioItem, "status" | "order">>;

/** Partial patch applied to an existing StudioItem (status transitions, edits, reordering). */
export type UpdateItemPatch = Partial<Omit<StudioItem, "id" | "createdAt">>;

export interface PriorityResult {
  score: number;
  label: "Faible" | "Moyenne" | "Haute" | "Critique";
  explanation: string;
}

export type DecisionStatus = "pending" | "resolved";

/** Where an inbound decision originated — surfaced in the decision inbox UI. */
export type DecisionSource = "conversation" | "drive" | "github" | "vercel" | "manual";

export interface Decision {
  id: string;
  question: string;
  context?: string;
  options: string[];
  status: DecisionStatus;
  resolution?: string;
  relatedItemId?: string;
  /** External origin of the decision when it wasn't created from the app UI itself. */
  source?: DecisionSource;
  createdAt: string;
  resolvedAt?: string;
}

export type ActivityType =
  | "created"
  | "status_changed"
  | "unblocked"
  | "decision_resolved"
  | "note"
  | "archived";

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  message: string;
  itemId?: string;
  createdAt: string;
}

export interface StudioNotification {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
  itemId?: string;
}

export type IntegrationId = "github" | "vercel" | "redis" | "drive" | "calendar";

export type IntegrationStatus = "connected" | "not_connected" | "error";

export interface IntegrationSyncState {
  id: IntegrationId;
  label: string;
  status: IntegrationStatus;
  lastSyncedAt?: string;
  detail: string;
}
