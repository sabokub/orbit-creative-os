import { NextRequest, NextResponse } from "next/server";
import { syncService } from "@/lib/sync/server";

export const dynamic = "force-dynamic";

/** GET: aggregate sync status per project (counts, last update per source, conflicts). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const status = await syncService().syncStatus(params.id);
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
