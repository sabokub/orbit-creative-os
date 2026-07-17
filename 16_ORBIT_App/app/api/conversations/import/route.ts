import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { ConversationSourceSchema } from "@/lib/sync/contracts";
import { syncService } from "@/lib/sync/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Imports a pasted / file conversation. Deterministic offline extraction runs
 * immediately; nothing becomes active project truth here — extracted items are
 * returned for human confirmation.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const projectId = requireString(body.projectId, "projectId");
    const source = ConversationSourceSchema.parse(body.source);
    const rawContent = requireString(body.content, "content", 200_000);
    const title = typeof body.title === "string" ? body.title.slice(0, 300) : undefined;

    const project = await getProject(projectId);
    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

    const { conversation, analysis } = await syncService().importConversation({
      projectId,
      source,
      rawContent,
      title,
    });
    return NextResponse.json({ conversation, analysis }, { status: 201 });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 400;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
