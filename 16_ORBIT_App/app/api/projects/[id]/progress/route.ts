import { NextRequest, NextResponse } from "next/server";
import { ConversationSourceSchema, ProgressTypeSchema } from "@/lib/sync/contracts";
import { syncService } from "@/lib/sync/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET: the central progress journal for a project (chronological, newest first). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entries = await syncService().listProgress(params.id);
    return NextResponse.json(entries);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

/** POST: add a manual progress entry (an update typed directly in Orbit). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const entry = await syncService().addProgress({
      projectId: params.id,
      source: body.source ? ConversationSourceSchema.parse(body.source) : "orbit",
      type: body.type ? ProgressTypeSchema.parse(body.type) : "note",
      summary: requireString(body.summary, "summary", 2000),
      details: typeof body.details === "string" ? body.details.slice(0, 20_000) : undefined,
      nextAction: typeof body.nextAction === "string" ? body.nextAction.slice(0, 1000) : undefined,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 400;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
