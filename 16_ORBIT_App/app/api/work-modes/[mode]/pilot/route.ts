import { NextRequest, NextResponse } from "next/server";
import { WorkModeSchema } from "@/lib/workModes/contracts";
import { computeModePilot } from "@/lib/workModes/pilot/server";

export const dynamic = "force-dynamic";

/** GET: the full pilot card data for a mode (level 1 + charts + blockers). */
export async function GET(_req: NextRequest, { params }: { params: { mode: string } }) {
  const parsed = WorkModeSchema.safeParse(params.mode);
  if (!parsed.success) return NextResponse.json({ error: "Mode inconnu." }, { status: 400 });
  try {
    const data = await computeModePilot(parsed.data);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
