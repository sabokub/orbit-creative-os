import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { getBrandProfile } from "@/lib/brandProfile";
import { listItems } from "@/lib/studioBrain";
import { analyzeOrbitResponse } from "@/lib/responseAnalysis/analyze";
import { diffAgainstPrevious } from "@/lib/responseAnalysis/versioning";
import { ANALYSIS_SOURCES, WORKFLOW_STEPS } from "@/lib/responseAnalysis/schema";
import { assertReasonablePayload, requireEnum, requireString, ValidationError } from "@/lib/validation";
import { WorkflowStep } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_RAW_RESPONSE_BYTES = 130_000;

/**
 * Canonical analysis endpoint. Both the "Générer avec OpenAI" flow and the
 * manual-paste flow call this route with the exact same request shape and
 * get back the exact same `AnalysisResult` — nothing is persisted here.
 * Persistence + Studio Brain application only happens in
 * POST /api/analyze/apply, after explicit user validation.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw, 200_000);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const projectId = requireString(body.projectId, "projectId");
    const workflowStep = requireEnum(body.workflowStep, WORKFLOW_STEPS, "workflowStep") as WorkflowStep;
    const source = requireEnum(body.source, ANALYSIS_SOURCES, "source");
    const promptId = typeof body.promptId === "string" ? body.promptId.slice(0, 200) : undefined;
    const reviewTarget = typeof body.reviewTarget === "string" ? body.reviewTarget : undefined;
    const rawResponseField = body.rawResponse;
    if (typeof rawResponseField !== "string") {
      throw new ValidationError('Le champ "rawResponse" est obligatoire.');
    }
    if (Buffer.byteLength(rawResponseField, "utf8") > MAX_RAW_RESPONSE_BYTES) {
      throw new ValidationError(
        `La réponse dépasse la taille maximale autorisée (${MAX_RAW_RESPONSE_BYTES} caractères environ).`
      );
    }
    const expectedDeliverables = Array.isArray(body.expectedDeliverables)
      ? body.expectedDeliverables.filter((v): v is string => typeof v === "string")
      : undefined;
    const skipSemanticAnalysis = body.skipSemanticAnalysis === true;

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const brand = getBrandProfile(project.brief.brandProfileId);

    let currentStudioItems: Awaited<ReturnType<typeof listItems>> = [];
    try {
      currentStudioItems = await listItems();
    } catch {
      // Best-effort: dedupe against current Studio Brain state is a nicety,
      // not a hard requirement of the analysis itself — a Redis hiccup here
      // must not block the (much more valuable) structural/semantic analysis.
      currentStudioItems = [];
    }

    const analysis = await analyzeOrbitResponse(
      {
        projectId,
        projectName: project.name,
        workflowStep,
        promptId,
        rawResponse: rawResponseField,
        source,
        expectedDeliverables,
        skipSemanticAnalysis,
      },
      brand,
      project.brief,
      currentStudioItems
    );

    const previousContent =
      workflowStep === "review"
        ? project.reviews.filter((r) => r.target === reviewTarget).slice(-1)[0]?.content
        : project.outputs[workflowStep]?.content;
    const versionDiff = diffAgainstPrevious(previousContent, analysis);

    return NextResponse.json({ analysis, versionDiff });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
