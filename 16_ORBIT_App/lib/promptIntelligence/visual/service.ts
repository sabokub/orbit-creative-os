import type { MemoryService } from "../../agents/memory/service";
import type { ProjectionService } from "../../projection/service";
import type { SyncService } from "../../sync/service";
import {
  AttachAssetRequestSchema,
  CompiledVisualPrompt,
  CreateGenerationRequestSchema,
  CreateReviewRequestSchema,
  GenerationRecord,
  PromptLearning,
  SavePromptRequestSchema,
  VisualReview,
} from "./contracts";
import {
  appendPromptVersion,
  attachExternalAsset,
  captureReview,
  createExternalGeneration,
  proposeLearning,
} from "./workflow";
import { VisualPromptStore } from "./store";

function toPromptIntelligenceOutput(prompt: CompiledVisualPrompt) {
  return {
    prompts: [
      {
        title: `${prompt.generator} visual prompt`,
        blocks: {
          objective: prompt.plan.reinforce[1] || "Generate the approved visual asset.",
          subject: prompt.plan.reinforce[0] || "Approved visual prompt",
          environment: "",
          composition: "",
          light: "",
          camera: "",
          material: "",
          style: prompt.explanation.join(" | "),
          constraints: prompt.plan.preserve,
          negatives: prompt.issues.filter((issue) => issue.severity === "warning").map((issue) => issue.message),
        },
        adaptations: [{ generator: prompt.generator, prompt: prompt.body }],
      },
    ],
  };
}

export class VisualPromptService {
  constructor(private readonly store: VisualPromptStore) {}

  listPrompts(projectId: string): Promise<CompiledVisualPrompt[]> {
    return this.store.listPrompts(projectId);
  }

  listGenerations(projectId: string): Promise<GenerationRecord[]> {
    return this.store.listGenerations(projectId);
  }

  listReviews(projectId: string): Promise<VisualReview[]> {
    return this.store.listReviews(projectId);
  }

  listLearnings(projectId: string): Promise<PromptLearning[]> {
    return this.store.listLearnings(projectId);
  }

  async savePrompt(raw: unknown): Promise<CompiledVisualPrompt> {
    const { prompt } = SavePromptRequestSchema.parse(raw);
    const history = await this.store.listPrompts(prompt.projectId);
    const nextHistory = appendPromptVersion(history, prompt);
    for (const item of nextHistory) await this.store.savePrompt(item);
    return prompt;
  }

  async createGeneration(raw: unknown): Promise<GenerationRecord> {
    const input = CreateGenerationRequestSchema.parse(raw);
    const prompt = await this.store.getPrompt(input.promptId);
    if (!prompt) throw new Error("Visual prompt not found.");
    const record = createExternalGeneration(prompt);
    await this.store.saveGeneration(record);
    await this.store.savePrompt({ ...prompt, status: "generated" });
    return record;
  }

  async attachAsset(generationId: string, raw: unknown): Promise<GenerationRecord> {
    const input = AttachAssetRequestSchema.parse(raw);
    const current = await this.store.getGeneration(generationId);
    if (!current) throw new Error("Generation not found.");
    const next = attachExternalAsset(current, input.assetUrl);
    await this.store.saveGeneration(next);
    return next;
  }

  async createReview(raw: unknown): Promise<{ review: VisualReview; learning?: PromptLearning }> {
    const input = CreateReviewRequestSchema.parse(raw);
    const generation = await this.store.getGeneration(input.generationId);
    if (!generation) throw new Error("Generation not found.");
    const prompt = await this.store.getPrompt(generation.promptId);
    if (!prompt) throw new Error("Visual prompt not found.");

    const review = captureReview(generation.id, {
      whatWorked: input.whatWorked,
      whatFailed: input.whatFailed,
      visualDrift: input.visualDrift,
      correctionInstructions: input.correctionInstructions,
      decision: input.decision,
    });
    await this.store.saveReview(generation.projectId, review);
    await this.store.savePrompt({ ...prompt, status: input.decision === "approved" ? "approved" : "reviewed" });

    if (!input.learningObservation) return { review };
    const learning = proposeLearning(
      generation.projectId,
      generation.generator,
      review,
      input.learningObservation,
      input.learningScope
    );
    await this.store.saveLearning(learning);
    return { review, learning };
  }

  async approvePrompt(params: {
    promptId: string;
    memory: MemoryService;
    projection: ProjectionService;
    sync: SyncService;
  }) {
    const prompt = await this.store.getPrompt(params.promptId);
    if (!prompt) throw new Error("Visual prompt not found.");
    const approvedPrompt: CompiledVisualPrompt = { ...prompt, status: "approved" };
    await this.store.savePrompt(approvedPrompt);

    const output = toPromptIntelligenceOutput(approvedPrompt);
    const entry = await params.memory.recordAgentOutput({
      projectId: prompt.projectId,
      agentRole: "prompt-intelligence",
      type: "deliverable",
      title: `Visual prompt ${prompt.generator}`,
      content: prompt.body,
      data: output,
      source: "agent",
    });
    const approvedEntry = await params.memory.setStatus(entry.id, "approved");
    const projection = await params.projection.apply(
      prompt.projectId,
      approvedEntry.id,
      "auto-safe",
      undefined,
      params.memory,
      params.sync
    );
    return { prompt: approvedPrompt, memoryEntry: approvedEntry, projection };
  }
}
