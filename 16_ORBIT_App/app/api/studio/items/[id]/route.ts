import { NextRequest, NextResponse } from "next/server";
import { archiveItem, ConflictError, getItem, updateItem } from "@/lib/studioBrain";
import { extractIfMatch, sanitizeUpdateItemPatch } from "@/lib/studioItemValidation";
import { assertReasonablePayload } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await getItem(params.id);
    if (!item) return NextResponse.json({ error: "Élément introuvable." }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw);
    const patch = sanitizeUpdateItemPatch(body);
    const ifMatch = extractIfMatch(body);
    const item = await updateItem(params.id, patch, ifMatch);
    return NextResponse.json(item);
  } catch (err) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const item = await archiveItem(params.id);
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
