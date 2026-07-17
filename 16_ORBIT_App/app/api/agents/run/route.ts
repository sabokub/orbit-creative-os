import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { AgentRoleSchema } from "@/lib/agents/contracts";
import { runAgent } from "@/lib/agents/engine";
import { createRuntimeForProject } from "@/lib/agents/server";
import { WorkModeSchema } from "@/lib/workModes/contracts";
import { getWorkModeConfig } from "@/lib/workModes/config";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** Runs a single agent against a project's shared memory. */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw, 20_000);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const projectId = requireString(body.projectId, "projectId");
    const role = AgentRoleSchema.parse(body.role);
    const userIntent = typeof body.userIntent === "string" ? body.userIntent.slice(0, 4000) : undefined;
    const workMode = WorkModeSchema.safeParse(body.workMode);
    const boostTypes = workMode.success ? getWorkModeConfig(workMode.data).contextPolicy.prioritizeMemoryTypes : undefined;

    const project = await getProject(projectId);
    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

    const runtime = createRuntimeForProject(project);
    const result = await runAgent({ projectId, role, userIntent, boostTypes }, runtime);

    const status = result.status === "completed" ? 200 : result.status === "skipped" ? 409 : 502;
    return NextResponse.json({ result }, { status });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
