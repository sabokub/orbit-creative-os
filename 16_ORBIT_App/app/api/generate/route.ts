import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { getBrandProfile } from "@/lib/brandProfile";
import { buildPrompt } from "@/lib/prompts";
import { generateWithOpenAI } from "@/lib/openai";
import { WorkflowStep } from "@/lib/types";
import { buildOrbitPrompt } from "@/lib/promptIntelligence/generation/builder";
import { getWebsiteChainStep } from "@/lib/promptIntelligence/contracts/website";
import { listItems } from "@/lib/studioBrain";
import { TargetModel, toValidatedOutputsRecord } from "@/lib/promptIntelligence/types";

export const dynamic = "force-dynamic";

/**
 * "Générer avec OpenAI" endpoint. Two paths, same OpenAI call:
 *  - Legacy path (no chainStepId): unchanged behavior, still calls
 *    lib/prompts.ts buildPrompt — every non-Website step, and Website when
 *    used without the chain.
 *  - Website chain path (chainStepId provided): calls buildOrbitPrompt, the
 *    exact same canonical builder the manual-copy path
 *    (POST /api/prompt-intelligence/build) uses, so both paths always
 *    produce the same prompt for equivalent input.
 */
export async function POST(req: NextRequest) {
  try {
    const { projectId, step, reviewTarget, chainStepId, targetModel } = (await req.json()) as {
      projectId: string;
      step: WorkflowStep;
      reviewTarget?: string;
      chainStepId?: string;
      targetModel?: TargetModel;
    };

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const brand = getBrandProfile(project.brief.brandProfileId);

    if (step === "website" && chainStepId) {
      const chainStep = getWebsiteChainStep(chainStepId);
      if (!chainStep) {
        return NextResponse.json({ error: `Étape de chaîne Website inconnue : "${chainStepId}".` }, { status: 400 });
      }
      let studioItems: Awaited<ReturnType<typeof listItems>> = [];
      try {
        studioItems = await listItems();
      } catch {
        studioItems = [];
      }
      const buildResult = buildOrbitPrompt({
        projectId,
        projectName: project.name,
        module: "website",
        workflowStep: "website",
        chainStepId,
        targetModel: targetModel || chainStep.targetModel,
        brandDNA: brand,
        brief: project.brief,
        studioItems,
        previousValidatedOutputs: toValidatedOutputsRecord(project.websiteChainOutputs),
      });
      const output = await generateWithOpenAI(buildResult.finalPrompt);
      return NextResponse.json({ output, buildResult });
    }

    const priorOutputs = Object.fromEntries(
      Object.entries(project.outputs).map(([k, v]) => [k, v?.content || ""])
    ) as Partial<Record<WorkflowStep, string>>;

    const prompt = buildPrompt(step, brand, project.name, project.brief, priorOutputs, reviewTarget);
    const output = await generateWithOpenAI(prompt);

    return NextResponse.json({ output });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
