import { NextRequest, NextResponse } from "next/server";
import { projectionService } from "@/lib/projection/server";

export const dynamic = "force-dynamic";

/** GET: all projection conflicts for a project (open + resolved, newest first). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conflicts = await projectionService().listConflicts(params.id);
    return NextResponse.json(conflicts);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
