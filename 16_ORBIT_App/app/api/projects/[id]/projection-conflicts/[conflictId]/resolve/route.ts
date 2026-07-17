import { NextRequest, NextResponse } from "next/server";
import { PROJECTION_CONFLICT_RESOLUTIONS } from "@/lib/projection/contracts";
import { z } from "zod";
import { projectionService } from "@/lib/projection/server";
import { assertReasonablePayload, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

const ResolutionSchema = z.enum(PROJECTION_CONFLICT_RESOLUTIONS);

/** POST: resolve a projection conflict — keep / replace / merge (never a silent overwrite). */
export async function POST(req: NextRequest, { params }: { params: { id: string; conflictId: string } }) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const resolution = ResolutionSchema.parse(body.resolution);

    const conflict = await projectionService().resolveConflict(params.id, params.conflictId, resolution);
    return NextResponse.json(conflict);
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
