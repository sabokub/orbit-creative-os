import { NextRequest, NextResponse } from "next/server";
import {
  MemoryStatusSchema,
  MemoryTypeSchema,
  MemorySourceSchema,
} from "@/lib/agents/contracts";
import { memoryService } from "@/lib/agents/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** GET: full structured project memory (all categories). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entries = await memoryService().list(params.id);
    return NextResponse.json(entries);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

/**
 * POST: two shapes.
 *  - { action: "setStatus", id, status } → transition an entry (approve/reject/review).
 *  - otherwise create a manual entry { type, source?, title, content, data? }.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const service = memoryService();

    if (body.action === "setStatus") {
      const id = requireString(body.id, "id");
      const status = MemoryStatusSchema.parse(body.status);
      const entry = await service.setStatus(id, status);
      return NextResponse.json(entry);
    }

    const entry = await service.create({
      projectId: params.id,
      type: MemoryTypeSchema.parse(body.type),
      source: body.source ? MemorySourceSchema.parse(body.source) : "user",
      title: requireString(body.title, "title", 200),
      content: requireString(body.content, "content", 20_000),
      data: body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : undefined,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 400;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
