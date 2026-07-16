import { NextRequest, NextResponse } from "next/server";
import { getStudioPlan, saveStudioPlan } from "@/lib/studioPlanDb";
import { StudioPlan } from "@/lib/studioPlan";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const plan = await getStudioPlan();
    return NextResponse.json(plan, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const input = (await req.json()) as StudioPlan;
    const plan = await saveStudioPlan(input);
    return NextResponse.json(plan, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
