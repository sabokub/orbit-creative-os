import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { getBrandProfile } from "@/lib/brandProfile";
import { listItems } from "@/lib/studioBrain";
import { buildOrbitPrompt } from "@/lib/promptIntelligence/generation/builder";
import { toValidatedOutputsRecord } from "@/lib/promptIntelligence/types";
import { websiteChainStepIds } from "@/lib/promptIntelligence/contracts/website";
import { PROMPT_TARGET_MODELS } from "@/lib/promptIntelligence/knowledge/schema";
import { assertReasonablePayload, requireEnum, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Canonical prompt-build endpoint. Both the manual-copy path ("Copy prompt"
 * in the Prompt Lab UI) and the API-generation path (POST /api/generate,
 * when a chainStepId is supplied) call `buildOrbitPrompt` — this route is
 * the one place that assembles the inputs (project/brand/brief/studio
 * items/previously-validated chain outputs) and hands them to the builder.
 * Nothing is persisted here — this is read-only, like POST /api/analyze.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw, 20_000);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const projectId = requireString(body.projectId, "projectId");
    const chainStepId = requireEnum(body.chainStepId, websiteChainStepIds() as readonly string[], "chainStepId");
    const targetModel = requireEnum(body.targetModel, PROMPT_TARGET_MODELS, "targetModel");
    const userIntent = typeof body.userIntent === "string" ? body.userIntent.slice(0, 2000) : undefined;
    const desiredOutputFormat = typeof body.desiredOutputFormat === "string" ? body.desiredOutputFormat.slice(0, 500) : undefined;

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const brand = getBrandProfile(project.brief.brandProfileId);

    let studioItems: Awaited<ReturnType<typeof listItems>> = [];
    try {
      studioItems = await listItems();
    } catch {
      studioItems = [];
    }

    const previousValidatedOutputs = toValidatedOutputsRecord(project.websiteChainOutputs);

    const result = buildOrbitPrompt({
      projectId,
      projectName: project.name,
      module: "website",
      workflowStep: "website",
      chainStepId,
      targetModel,
      userIntent,
      brandDNA: brand,
      brief: project.brief,
      studioItems,
      previousValidatedOutputs,
      desiredOutputFormat,
    });

    return NextResponse.json({ result });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
