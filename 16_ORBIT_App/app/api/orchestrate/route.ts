import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { AgentRoleSchema, OrchestrationModeSchema } from "@/lib/agents/contracts";
import { orchestrate } from "@/lib/agents/orchestrator";
import { createRuntimeForProject, runStore } from "@/lib/agents/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Runs an orchestration: single / sequence / full pipeline / review. */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw, 20_000);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const projectId = requireString(body.projectId, "projectId");
    const mode = OrchestrationModeSchema.parse(body.mode);
    const roles = Array.isArray(body.roles) ? body.roles.map((r) => AgentRoleSchema.parse(r)) : undefined;
    const userIntent = typeof body.userIntent === "string" ? body.userIntent.slice(0, 4000) : undefined;

    const project = await getProject(projectId);
    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

    const runtime = createRuntimeForProject(project);
    const run = await orchestrate({ projectId, mode, roles, userIntent }, { runtime, runStore: runStore() });

    return NextResponse.json({ run }, { status: run.status === "completed" ? 200 : 502 });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
