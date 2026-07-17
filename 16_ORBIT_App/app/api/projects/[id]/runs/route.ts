import { NextRequest, NextResponse } from "next/server";
import { runStore } from "@/lib/agents/server";

export const dynamic = "force-dynamic";

/** GET: orchestration run history for a project (newest first). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const runs = await runStore().listByProject(params.id);
    return NextResponse.json(runs);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
