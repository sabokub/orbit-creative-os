import { NextRequest, NextResponse } from "next/server";
import { createDecision, listDecisions } from "@/lib/studioBrain";
import { assertReasonablePayload, optionalString, requireString } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const decisions = await listDecisions();
    return NextResponse.json(decisions);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const question = requireString(body.question, "question", 500);
    const context = optionalString(body.context, "context", 2000);
    const relatedItemId = optionalString(body.relatedItemId, "relatedItemId");
    const options = Array.isArray(body.options) ? body.options.filter((o): o is string => typeof o === "string" && o.trim().length > 0) : [];
    if (options.length === 0) {
      return NextResponse.json({ error: "Il faut au moins une option de résolution." }, { status: 400 });
    }
    const decision = await createDecision({ question, context, relatedItemId, options });
    return NextResponse.json(decision, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
