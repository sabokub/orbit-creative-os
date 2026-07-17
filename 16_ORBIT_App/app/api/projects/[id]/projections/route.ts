import { NextRequest, NextResponse } from "next/server";
import { projectionService } from "@/lib/projection/server";

export const dynamic = "force-dynamic";

/** GET: history of applied projections for a project (newest first). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const results = await projectionService().listResults(params.id);
    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
