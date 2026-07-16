import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/db";
import { ConflictError } from "@/lib/studioBrain";
import { applyAnalysisToStudioBrain } from "@/lib/responseAnalysis/studioBrainSync";
import { diffAgainstPrevious, mergeWithPrevious } from "@/lib/responseAnalysis/versioning";
import { parseAnalysisResult, WORKFLOW_STEPS } from "@/lib/responseAnalysis/schema";
import { detectReviewStatus } from "@/lib/prompts";
import { assertReasonablePayload, requireEnum, requireString, ValidationError } from "@/lib/validation";
import { GeneratedOutput, Project, Review, WorkflowStep } from "@/lib/types";

export const dynamic = "force-dynamic";

const MODES = ["draft", "validate", "raw_only"] as const;
const VERSION_ACTIONS = ["replace", "merge", "new_version", "cancel"] as const;

type Mode = (typeof MODES)[number];
type VersionAction = (typeof VERSION_ACTIONS)[number];

/**
 * The single "commit" point of the response-analysis pipeline. Nothing from
 * POST /api/analyze is ever persisted or applied to Studio Brain until the
 * user explicitly validates here (spec: "nothing permanent before explicit
 * validation"). Handles:
 *  - draft / raw_only / full-validation save modes
 *  - "new version of an existing deliverable" conflict (replace / merge /
 *    new_version / cancel), never silently overwriting a prior save
 *  - optimistic concurrency on the Project record (`ifMatch` = last-seen
 *    `updated_at`)
 *  - idempotent double-validation: resubmitting the same analysis id with
 *    mode "validate" is a no-op on Studio Brain the second time
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw, 260_000);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const projectId = requireString(body.projectId, "projectId");
    const workflowStep = requireEnum(body.workflowStep, WORKFLOW_STEPS, "workflowStep") as WorkflowStep;
    const reviewTarget = typeof body.reviewTarget === "string" ? body.reviewTarget : undefined;
    const mode = requireEnum(body.mode, MODES, "mode") as Mode;
    const versionAction =
      body.versionAction !== undefined ? (requireEnum(body.versionAction, VERSION_ACTIONS, "versionAction") as VersionAction) : undefined;
    const ifMatch = typeof body.ifMatch === "string" ? body.ifMatch : undefined;

    if (workflowStep === "review" && !reviewTarget) {
      throw new ValidationError('Le champ "reviewTarget" est obligatoire pour une relecture.');
    }

    const analysis = parseAnalysisResult(body.analysis);
    if (analysis.projectId !== projectId || analysis.workflowStep !== workflowStep) {
      throw new ValidationError("L'analyse fournie ne correspond pas au projet/étape demandés.");
    }

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }
    if (ifMatch && ifMatch !== project.updated_at) {
      return NextResponse.json(
        { error: `Le projet "${project.name}" a été modifié ailleurs entre-temps. Recharge et réessaie.` },
        { status: 409 }
      );
    }

    const isReview = workflowStep === "review";
    const previousOutput = isReview ? undefined : project.outputs[workflowStep];
    const previousReview = isReview
      ? [...project.reviews].reverse().find((r) => r.target === reviewTarget)
      : undefined;
    const previousContent = previousOutput?.content ?? previousReview?.content;
    const previousAnalysisId = previousOutput?.analysis?.id ?? previousReview?.analysis?.id;

    // Idempotent double-validation: the exact same validated analysis was
    // already saved and applied — resubmitting (double-click, retry after a
    // flaky response) must not create duplicate tasks/decisions/activity.
    const alreadyApplied =
      previousAnalysisId === analysis.id && (previousOutput?.studioBrainApplied || previousReview?.studioBrainApplied);
    if (alreadyApplied && mode === "validate") {
      return NextResponse.json({ project, applyResult: { createdTaskIds: [], completedTaskIds: [], createdDecisionIds: [], skipped: [] }, idempotentNoOp: true });
    }

    const versionDiff = diffAgainstPrevious(previousContent, analysis);
    const needsVersionDecision = versionDiff.hasPreviousVersion && versionDiff.significant && previousAnalysisId !== analysis.id;

    if (needsVersionDecision && !versionAction) {
      return NextResponse.json(
        {
          error: "Une version précédente de ce livrable existe et diffère de la nouvelle réponse. Choisis comment l'intégrer.",
          versionDiff,
          requiresVersionAction: true,
        },
        { status: 409 }
      );
    }

    if (versionAction === "cancel") {
      return NextResponse.json({ cancelled: true, project });
    }

    let content = analysis.rawResponse;
    let previousVersionsForOutput: GeneratedOutput[] | undefined;
    let previousVersionsForReview: Review[] | undefined;

    if (needsVersionDecision && versionAction === "merge" && previousContent) {
      content = mergeWithPrevious(previousContent, analysis);
    }
    if (needsVersionDecision && versionAction === "new_version") {
      if (previousOutput) previousVersionsForOutput = [...(previousOutput.previousVersions || []), { ...previousOutput, previousVersions: undefined }];
      if (previousReview) previousVersionsForReview = [...(previousReview.previousVersions || []), { ...previousReview, previousVersions: undefined }];
    }

    const attachAnalysis = mode !== "raw_only";
    const now = new Date().toISOString();

    let nextProject: Project;
    if (isReview) {
      const status = detectReviewStatus(content);
      const nextReview: Review = {
        target: reviewTarget!,
        content,
        status,
        created_at: now,
        analysis: attachAnalysis ? analysis : undefined,
        previousVersions: previousVersionsForReview,
        studioBrainApplied: false,
      };
      const reviews =
        versionAction === "replace" || versionAction === "merge" || versionAction === "new_version" || !previousReview
          ? [...project.reviews.filter((r) => r !== previousReview), nextReview]
          : [...project.reviews, nextReview];
      nextProject = { ...project, reviews, stage: "review", updated_at: now };
    } else {
      const nextOutput: GeneratedOutput = {
        step: workflowStep,
        content,
        created_at: now,
        analysis: attachAnalysis ? analysis : undefined,
        previousVersions: previousVersionsForOutput,
        studioBrainApplied: false,
      };
      nextProject = { ...project, outputs: { ...project.outputs, [workflowStep]: nextOutput }, stage: workflowStep, updated_at: now };
    }

    let applyResult = { createdTaskIds: [] as string[], completedTaskIds: [] as string[], createdDecisionIds: [] as string[], skipped: [] as string[] };
    if (mode === "validate") {
      applyResult = await applyAnalysisToStudioBrain(analysis);
      if (isReview) {
        nextProject = {
          ...nextProject,
          reviews: nextProject.reviews.map((r) => (r.target === reviewTarget && r.created_at === now ? { ...r, studioBrainApplied: true } : r)),
        };
      } else {
        nextProject = {
          ...nextProject,
          outputs: { ...nextProject.outputs, [workflowStep]: { ...nextProject.outputs[workflowStep]!, studioBrainApplied: true } },
        };
      }
    }

    const saved = await saveProject(nextProject);
    return NextResponse.json({ project: saved, applyResult });
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
