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
}

export interface Review {
  target: string;
  content: string;
  status: ReviewStatus;
  created_at: string;
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
