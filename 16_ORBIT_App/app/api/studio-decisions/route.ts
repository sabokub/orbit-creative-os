import { NextRequest, NextResponse } from "next/server";
import { getStudioPlan, saveStudioPlan } from "@/lib/studioPlanDb";
import { DecisionItem, DecisionSource } from "@/lib/studioPlan";

export const dynamic = "force-dynamic";

function isSource(value: unknown): value is DecisionSource {
  return value === "conversation" || value === "drive" || value === "github" || value === "vercel" || value === "manual";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body?.title || !body?.summary) {
      return NextResponse.json({ error: "title et summary sont requis" }, { status: 400 });
    }

    const plan = await getStudioPlan();
    const decision: DecisionItem = {
      id: body.id || `decision-${Date.now()}`,
      title: String(body.title),
      summary: String(body.summary),
      source: isSource(body.source) ? body.source : "manual",
      status: "pending",
      createdAt: new Date().toISOString(),
      suggestedAction: body.suggestedAction ? String(body.suggestedAction) : undefined,
      relatedTaskId: body.relatedTaskId ? String(body.relatedTaskId) : undefined,
    };

    const saved = await saveStudioPlan({ ...plan, decisions: [decision, ...plan.decisions] });
    return NextResponse.json({ decision, updatedAt: saved.updatedAt });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
