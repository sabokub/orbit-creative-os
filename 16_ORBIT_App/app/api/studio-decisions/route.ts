import { NextRequest, NextResponse } from "next/server";
import { createDecision } from "@/lib/studioBrain";
import { DecisionSource } from "@/lib/types";
import { assertReasonablePayload, optionalString, requireString } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * External decision inbox. Accepts decisions surfaced from outside the app
 * itself — conversations, Google Drive, GitHub, Vercel, or manual entry —
 * and stores them as pending Decisions in Studio Brain so they show up
 * alongside app-native decisions on the homepage and the Launch page.
 */
function isSource(value: unknown): value is DecisionSource {
  return value === "conversation" || value === "drive" || value === "github" || value === "vercel" || value === "manual";
}

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw || "{}");

    // Accept both the external-inbox shape (title/summary) and the native
    // Decision shape (question/context) so any caller can use this endpoint.
    const question = requireString(body.title ?? body.question, "title", 300);
    const context = optionalString(body.summary ?? body.context, "summary", 2000);
    const suggestedAction = optionalString(body.suggestedAction, "suggestedAction", 300);
    const relatedItemId = optionalString(body.relatedTaskId ?? body.relatedItemId, "relatedTaskId", 200);
    const source = isSource(body.source) ? body.source : "manual";
    const options =
      Array.isArray(body.options) && body.options.length > 0 && body.options.every((o: unknown) => typeof o === "string")
        ? (body.options as string[])
        : suggestedAction
        ? [suggestedAction, "Ignorer pour l'instant"]
        : ["Vérifier maintenant", "Ignorer pour l'instant"];

    const decision = await createDecision({
      question,
      context,
      options,
      source,
      relatedItemId,
    });

    return NextResponse.json({ decision }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
