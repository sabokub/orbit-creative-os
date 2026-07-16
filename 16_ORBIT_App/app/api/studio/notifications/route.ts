import { NextRequest, NextResponse } from "next/server";
import { listNotifications, markNotificationRead } from "@/lib/studioBrain";
import { requireString } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notifications = await listNotifications();
    return NextResponse.json(notifications);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = (await req.json()) as { id?: string };
    const id = requireString(body.id, "id");
    await markNotificationRead(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
