import { NextRequest, NextResponse } from "next/server";
import { listProjects, saveProject } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { Brief, Project } from "@/lib/types";

export const dynamic = "force-dynamic";

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
    const brief = (await req.json()) as Brief;
    if (!brief.project_name?.trim()) {
      return NextResponse.json({ error: "project_name is required" }, { status: 400 });
    }
    const id = slugify(brief.project_name);
    const now = new Date().toISOString();
    const project: Project = {
      id,
      name: brief.project_name,
      type: (brief.activity || "").slice(0, 60),
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
