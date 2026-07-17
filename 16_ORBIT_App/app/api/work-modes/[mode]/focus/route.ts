import { NextRequest, NextResponse } from "next/server";
import { WorkModeSchema } from "@/lib/workModes/contracts";
import { FocusInputSchema, FocusStatusSchema } from "@/lib/workModes/focus/contracts";
import { focusService } from "@/lib/workModes/pilot/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

function mode(params: { mode: string }) {
  const parsed = WorkModeSchema.safeParse(params.mode);
  if (!parsed.success) throw new ValidationError("Mode inconnu.");
  return parsed.data;
}

/** GET: the active focus + history for a mode. */
export async function GET(_req: NextRequest, { params }: { params: { mode: string } }) {
  try {
    const m = mode(params);
    const svc = focusService();
    const [active, history] = await Promise.all([svc.getActive(m), svc.history(m)]);
    return NextResponse.json({ active, history });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}

/** POST: set a new active focus (archives the previous active one). */
export async function POST(req: NextRequest, { params }: { params: { mode: string } }) {
  try {
    const m = mode(params);
    const raw = await req.text();
    assertReasonablePayload(raw);
    const input = FocusInputSchema.parse(JSON.parse(raw));
    const focus = await focusService().setActive(m, input);
    return NextResponse.json(focus, { status: 201 });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 400;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}

/** PATCH: update the active focus (status, progress, actions). */
export async function PATCH(req: NextRequest, { params }: { params: { mode: string } }) {
  try {
    mode(params);
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const id = requireString(body.id, "id");
    const svc = focusService();
    if (body.status !== undefined) {
      const status = FocusStatusSchema.parse(body.status);
      const updated = await svc.setStatus(id, status);
      return NextResponse.json(updated);
    }
    const patch: Record<string, unknown> = {};
    if (typeof body.progressPercentage === "number") patch.progressPercentage = body.progressPercentage;
    if (typeof body.currentAction === "string") patch.currentAction = body.currentAction;
    if (typeof body.nextAction === "string") patch.nextAction = body.nextAction;
    const updated = await svc.update(id, patch);
    return NextResponse.json(updated);
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 400;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
