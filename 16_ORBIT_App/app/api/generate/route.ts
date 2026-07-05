import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { getBrandProfile } from "@/lib/brandProfile";
import { buildPrompt } from "@/lib/prompts";
import { generateWithOpenAI } from "@/lib/openai";
import { WorkflowStep } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { projectId, step, reviewTarget } = (await req.json()) as {
      projectId: string;
      step: WorkflowStep;
      reviewTarget?: string;
    };

    const project = await getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });
    }

    const brand = getBrandProfile(project.brief.brandProfileId);
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
