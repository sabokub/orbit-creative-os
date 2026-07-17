import { NextRequest, NextResponse } from "next/server";
import { projectionService } from "@/lib/projection/server";
import { memoryService } from "@/lib/agents/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST: preview the Studio Brain mutations an approved output would produce — read-only. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const memoryEntryId = requireString(body.memoryEntryId, "memoryEntryId");

    const preview = await projectionService().preview(params.id, memoryEntryId, memoryService());
    return NextResponse.json(preview);
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
