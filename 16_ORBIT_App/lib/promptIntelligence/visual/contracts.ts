import { z } from "zod";

export const VisualGeneratorSchema = z.enum(["gpt-image", "nano-banana", "midjourney", "sora"]);
export type VisualGenerator = z.infer<typeof VisualGeneratorSchema>;
export const AssetTypeSchema = z.enum(["image", "image-edit", "video"]);
export const ReferenceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["composition", "subject", "identity", "environment", "lighting", "color", "style", "texture", "camera", "motion", "branding"]),
  role: z.string().min(2), importance: z.number().min(0).max(1).default(0.7),
  reuse: z.array(z.string()).default([]), avoid: z.array(z.string()).default([]), source: z.string().optional(),
});
export const CreativeIntentSchema = z.object({
  id: z.string().min(1), projectId: z.string().min(1), rawRequest: z.string().min(3),
  assetType: AssetTypeSchema, objective: z.string().min(2), subject: z.string().min(2),
  environment: z.string().default(""), narrative: z.string().default(""), emotionalIntent: z.string().default(""),
  audience: z.string().default(""), usage: z.string().default(""), platform: z.string().default(""),
  aspectRatio: z.string().regex(/^\d{1,2}:\d{1,2}$/).default("1:1"), duration: z.number().positive().max(60).optional(),
  references: z.array(ReferenceSchema).max(12).default([]), mandatoryElements: z.array(z.string()).default([]),
  forbiddenElements: z.array(z.string()).default([]), preservationConstraints: z.array(z.string()).default([]),
  qualityTarget: z.string().default("production-ready"), generators: z.array(VisualGeneratorSchema).min(1),
});
export type CreativeIntent = z.infer<typeof CreativeIntentSchema>;

export const CanonicalVisualSpecSchema = z.object({
  subject: z.object({ description: z.string(), action: z.string(), appearance: z.string() }),
  environment: z.object({ description: z.string(), materials: z.array(z.string()), spatialComposition: z.string() }),
  direction: z.object({ concept: z.string(), style: z.string(), realism: z.string(), brandCodes: z.array(z.string()) }),
  camera: z.object({ shot: z.string(), angle: z.string(), lens: z.string(), movement: z.string() }),
  lighting: z.object({ source: z.string(), direction: z.string(), quality: z.string(), contrast: z.string() }),
  composition: z.object({ hierarchy: z.string(), negativeSpace: z.string(), depth: z.string(), textZone: z.string() }),
  rendering: z.object({ finish: z.string(), texture: z.string(), color: z.string(), avoidArtifacts: z.array(z.string()) }),
  temporal: z.object({ opening: z.string(), action: z.string(), ending: z.string(), duration: z.number().optional() }).optional(),
  invariants: z.array(z.string()), forbidden: z.array(z.string()), references: z.array(ReferenceSchema),
});
export type CanonicalVisualSpec = z.infer<typeof CanonicalVisualSpecSchema>;

export interface GeneratorCapabilities { image: boolean; edit: boolean; video: boolean; multiReference: boolean; identityPreservation: boolean; textRendering: boolean; seed: boolean; negativePrompt: boolean; cameraMotion: boolean; maxReferences: number; supportedRatios: string[]; maxDuration?: number }
export interface PromptIssue { code: string; severity: "error" | "warning" | "suggestion"; message: string }
export interface PromptPlan { preserve: string[]; reinforce: string[]; simplify: string[]; ambiguities: string[]; adaptations: string[]; variationStrategy: VariationStrategy }
export type VariationStrategy = "conservative" | "balanced" | "exploratory" | "composition-only" | "lighting-only" | "camera-only" | "motion-only";
export interface CompiledVisualPrompt { id: string; version: number; parentId?: string; projectId: string; generator: VisualGenerator; profileVersion: string; status: "draft" | "validated" | "ready" | "generated" | "reviewed" | "approved" | "rejected" | "failed"; body: string; parameters: Record<string, string | number | boolean>; issues: PromptIssue[]; score: Record<string, number>; plan: PromptPlan; explanation: string[]; createdAt: string }
export interface VisualCompilation { intent: CreativeIntent; spec: CanonicalVisualSpec; prompts: CompiledVisualPrompt[]; comparison: { generator: VisualGenerator; fit: number; limitations: string[]; adaptations: string[] }[] }
export interface GenerationRecord { id: string; promptId: string; projectId: string; generator: VisualGenerator; mode: "external" | "provider"; status: "awaiting-external" | "running" | "complete" | "failed"; assetUrl?: string; createdAt: string }
export interface VisualReview { id: string; generationId: string; whatWorked: string[]; whatFailed: string[]; visualDrift: string[]; correctionInstructions: string[]; decision: "approved" | "revise" | "rejected"; createdAt: string }
export interface PromptLearning { id: string; projectId: string; generator: VisualGenerator; scope: "asset" | "generator" | "project"; observation: string; approved: boolean; sourceReviewId: string }

export const PromptIssueSchema = z.object({
  code: z.string(),
  severity: z.enum(["error", "warning", "suggestion"]),
  message: z.string(),
});

export const PromptPlanSchema = z.object({
  preserve: z.array(z.string()),
  reinforce: z.array(z.string()),
  simplify: z.array(z.string()),
  ambiguities: z.array(z.string()),
  adaptations: z.array(z.string()),
  variationStrategy: z.enum([
    "conservative",
    "balanced",
    "exploratory",
    "composition-only",
    "lighting-only",
    "camera-only",
    "motion-only",
  ]),
});

export const CompiledVisualPromptSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().min(1),
  parentId: z.string().optional(),
  projectId: z.string().min(1),
  generator: VisualGeneratorSchema,
  profileVersion: z.string(),
  status: z.enum(["draft", "validated", "ready", "generated", "reviewed", "approved", "rejected", "failed"]),
  body: z.string().min(1),
  parameters: z.record(z.union([z.string(), z.number(), z.boolean()])),
  issues: z.array(PromptIssueSchema),
  score: z.record(z.number()),
  plan: PromptPlanSchema,
  explanation: z.array(z.string()),
  createdAt: z.string(),
});

export const VisualCompilationSchema = z.object({
  intent: CreativeIntentSchema,
  spec: CanonicalVisualSpecSchema,
  prompts: z.array(CompiledVisualPromptSchema),
  comparison: z.array(
    z.object({
      generator: VisualGeneratorSchema,
      fit: z.number(),
      limitations: z.array(z.string()),
      adaptations: z.array(z.string()),
    })
  ),
});

export const GenerationRecordSchema = z.object({
  id: z.string().min(1),
  promptId: z.string().min(1),
  projectId: z.string().min(1),
  generator: VisualGeneratorSchema,
  mode: z.enum(["external", "provider"]),
  status: z.enum(["awaiting-external", "running", "complete", "failed"]),
  assetUrl: z.string().optional(),
  createdAt: z.string(),
});

export const VisualReviewSchema = z.object({
  id: z.string().min(1),
  generationId: z.string().min(1),
  whatWorked: z.array(z.string()),
  whatFailed: z.array(z.string()),
  visualDrift: z.array(z.string()),
  correctionInstructions: z.array(z.string()),
  decision: z.enum(["approved", "revise", "rejected"]),
  createdAt: z.string(),
});

export const PromptLearningSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  generator: VisualGeneratorSchema,
  scope: z.enum(["asset", "generator", "project"]),
  observation: z.string().min(1),
  approved: z.boolean(),
  sourceReviewId: z.string().min(1),
});

export const SavePromptRequestSchema = z.object({ prompt: CompiledVisualPromptSchema });
export const CreateGenerationRequestSchema = z.object({ promptId: z.string().min(1) });
export const AttachAssetRequestSchema = z.object({ assetUrl: z.string().min(1) });
export const CreateReviewRequestSchema = z.object({
  generationId: z.string().min(1),
  whatWorked: z.array(z.string()).default([]),
  whatFailed: z.array(z.string()).default([]),
  visualDrift: z.array(z.string()).default([]),
  correctionInstructions: z.array(z.string()).default([]),
  decision: z.enum(["approved", "revise", "rejected"]),
  learningObservation: z.string().optional(),
  learningScope: z.enum(["asset", "generator", "project"]).default("asset"),
});
