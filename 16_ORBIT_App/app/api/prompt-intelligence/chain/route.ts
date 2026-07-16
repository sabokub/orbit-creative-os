import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { WEBSITE_CHAIN } from "@/lib/promptIntelligence/contracts/website";
import { ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Read-only endpoint the Prompt Lab UI uses to render the 13-step Website
 * chain alongside per-project state: which steps already have a validated
 * output, and the prompt-version history recorded for each (see
 * lib/promptIntelligence/versioning.ts, lib/types.ts Project.websitePromptChain).
 */
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) throw new ValidationError('Le paramètre "projectId" est obligatoire.');

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const steps = WEBSITE_CHAIN.map((step) => ({
      ...step,
      hasValidatedOutput: Boolean(project.websiteChainOutputs?.[step.id]?.trim()),
      versionCount: project.websitePromptChain?.[step.id]?.length || 0,
    }));

    return NextResponse.json({ steps });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
