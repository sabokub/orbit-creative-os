import { NextRequest, NextResponse } from "next/server";
import { listProjects, saveProject } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { DEFAULT_BRAND_PROFILE, WORKFLOW_TYPE_LABELS } from "@/lib/brandProfile";
import { Project, ProjectBrief } from "@/lib/types";

export const dynamic = "force-dynamic";

interface CreateProjectInput extends Omit<ProjectBrief, "brandProfileId"> {
  name: string;
}

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json(projects);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as CreateProjectInput;
    if (!input.name?.trim()) {
      return NextResponse.json({ error: "Le nom du projet est obligatoire." }, { status: 400 });
    }
    const id = slugify(input.name);
    const now = new Date().toISOString();
    const brief: ProjectBrief = {
      brandProfileId: DEFAULT_BRAND_PROFILE.id,
      workflowType: input.workflowType,
      projectGoal: input.projectGoal,
      specificContext: input.specificContext,
      deliverableType: input.deliverableType,
      references: input.references,
      constraints: input.constraints,
      channels: input.channels,
      format: input.format,
      successCriteria: input.successCriteria,
    };
    const project: Project = {
      id,
      name: input.name,
      type: WORKFLOW_TYPE_LABELS[input.workflowType] || input.workflowType,
      stage: "brief",
      created_at: now,
      updated_at: now,
      brief,
      outputs: {},
      reviews: [],
      exports: [],
    };
    await saveProject(project);
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
