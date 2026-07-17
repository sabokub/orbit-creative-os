import { NextRequest, NextResponse } from "next/server";
import { WorkModeSchema } from "@/lib/workModes/contracts";
import { computeModePriority } from "@/lib/workModes/pilot/server";

export const dynamic = "force-dynamic";

/** GET: the single immediate priority for a mode (rule-based, no AI call). */
export async function GET(_req: NextRequest, { params }: { params: { mode: string } }) {
  const parsed = WorkModeSchema.safeParse(params.mode);
  if (!parsed.success) return NextResponse.json({ error: "Mode inconnu." }, { status: 400 });
  try {
    const priority = await computeModePriority(parsed.data);
    return NextResponse.json(priority);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 503 });
  }
}
