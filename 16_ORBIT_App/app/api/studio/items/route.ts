import { NextRequest, NextResponse } from "next/server";
import { createItem, listItems } from "@/lib/studioBrain";
import { sanitizeStudioItemInput } from "@/lib/studioItemValidation";
import { assertReasonablePayload } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const items = await listItems();
    return NextResponse.json(items);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const input = sanitizeStudioItemInput(JSON.parse(raw));
    const item = await createItem(input);
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
