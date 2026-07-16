import { NextRequest, NextResponse } from "next/server";
import { ConflictError, resolveDecision } from "@/lib/studioBrain";
import { requireString } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = (await req.json()) as { resolution?: string };
    const resolution = requireString(body.resolution, "resolution", 500);
    const decision = await resolveDecision(params.id, resolution);
    return NextResponse.json(decision);
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
