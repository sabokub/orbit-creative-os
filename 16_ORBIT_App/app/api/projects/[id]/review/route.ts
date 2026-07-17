import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { orchestrate } from "@/lib/agents/orchestrator";
import { createRuntimeForProject, runStore } from "@/lib/agents/server";
import { assertReasonablePayload } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST: run Orbit Critic over the project's current outputs. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await req.text().catch(() => "");
    if (raw) assertReasonablePayload(raw, 20_000);
    const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const userIntent = typeof body.userIntent === "string" ? body.userIntent.slice(0, 4000) : undefined;

    const project = await getProject(params.id);
    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

    const runtime = createRuntimeForProject(project);
    const run = await orchestrate(
      { projectId: params.id, mode: "review", userIntent },
      { runtime, runStore: runStore() }
    );

    return NextResponse.json({ run }, { status: run.status === "completed" ? 200 : 502 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
