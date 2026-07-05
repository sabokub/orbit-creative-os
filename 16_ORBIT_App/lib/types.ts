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

export interface Brief {
  project_name: string;
  activity: string;
  audience: string;
  offer: string;
  positioning_goal: string;
  style_keywords: string;
  avoid_keywords: string;
  colors_accent: string;
  references: string;
  competitors: string;
  budget: string;
  timeline: string;
  tools: string;
  format: string;
  channels: string;
  needed_output: string;
  success_criteria: string;
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
  brief: Brief;
  outputs: Partial<Record<WorkflowStep, GeneratedOutput>>;
  reviews: Review[];
  exports: ExportRecord[];
}

export const emptyBrief = (): Brief => ({
  project_name: "",
  activity: "",
  audience: "",
  offer: "",
  positioning_goal: "",
  style_keywords: "",
  avoid_keywords: "",
  colors_accent: "",
  references: "",
  competitors: "",
  budget: "",
  timeline: "",
  tools: "",
  format: "Markdown",
  channels: "Instagram, TikTok, Pinterest, Website",
  needed_output: "",
  success_criteria: "",
});
