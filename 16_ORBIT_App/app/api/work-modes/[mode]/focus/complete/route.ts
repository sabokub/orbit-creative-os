import { NextRequest, NextResponse } from "next/server";
import { WorkModeSchema } from "@/lib/workModes/contracts";
import { focusService } from "@/lib/workModes/pilot/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/** POST: mark the active focus completed (moves it to history at 100%). */
export async function POST(req: NextRequest, { params }: { params: { mode: string } }) {
  const parsed = WorkModeSchema.safeParse(params.mode);
  if (!parsed.success) return NextResponse.json({ error: "Mode inconnu." }, { status: 400 });
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const id = requireString(body.id, "id");
    const focus = await focusService().complete(id);
    return NextResponse.json(focus);
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 400;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
