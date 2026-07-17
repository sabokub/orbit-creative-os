import { NextRequest, NextResponse } from "next/server";
import { syncService } from "@/lib/sync/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST: preview extraction (decisions/tasks/progress) from text — no persistence. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const text = requireString(body.content, "content", 200_000);
    const analysis = syncService().analyzeText(params.id, text);
    return NextResponse.json(analysis);
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 400;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
