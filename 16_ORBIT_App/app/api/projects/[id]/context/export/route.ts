import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { ExternalTargetSchema } from "@/lib/sync/contracts";
import { buildExternalAssistantContext } from "@/lib/sync/context";
import { syncService } from "@/lib/sync/server";
import { memoryService } from "@/lib/agents/server";
import { assertReasonablePayload, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * POST: build a COMPACT context package to paste into ChatGPT / Claude /
 * Claude Code. Filters to active truth (approved decisions, constraints,
 * deliverables) + recent progress, under a size cap. Never dumps raw memory.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await req.text().catch(() => "");
    if (raw) assertReasonablePayload(raw, 10_000);
    const body = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    const target = ExternalTargetSchema.parse(body.target);
    const objective = typeof body.objective === "string" ? body.objective.slice(0, 2000) : "";
    const tokenCap = typeof body.tokenCap === "number" ? body.tokenCap : undefined;

    const project = await getProject(params.id);
    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

    const [memory, progress] = await Promise.all([
      memoryService().list(params.id),
      syncService().listProgress(params.id),
    ]);

    const assembled = buildExternalAssistantContext({
      projectId: params.id,
      projectName: project.name,
      objective,
      target,
      memory,
      progress,
      tokenCap,
    });
    return NextResponse.json(assembled);
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
