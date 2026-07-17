import { NextRequest, NextResponse } from "next/server";
import { syncService } from "@/lib/sync/server";

export const dynamic = "force-dynamic";

/** GET: imported conversations for a project (newest first). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const conversations = await syncService().listConversations(params.id);
    return NextResponse.json(conversations);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
