import { NextRequest, NextResponse } from "next/server";
import { listActivity } from "@/lib/studioBrain";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") || 30);
    const activity = await listActivity(limit);
    return NextResponse.json(activity);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
