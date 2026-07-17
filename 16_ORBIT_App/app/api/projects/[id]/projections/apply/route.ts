import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { projectionService } from "@/lib/projection/server";
import { memoryService } from "@/lib/agents/server";
import { syncService } from "@/lib/sync/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

const ApplyModeSchema = z.enum(["confirm", "auto-safe"]);

/**
 * POST: apply a projection to Studio Brain. mode="auto-safe" applies only
 * mutations that don't require confirmation; mode="confirm" applies exactly
 * the mutations in `selectedMutationIds` (obtained from a prior /preview call
 * — mutation ids are deterministic, so they always match).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;
    const memoryEntryId = requireString(body.memoryEntryId, "memoryEntryId");
    const mode = ApplyModeSchema.parse(body.mode);
    const selectedMutationIds = Array.isArray(body.selectedMutationIds) ? body.selectedMutationIds.filter((x): x is string => typeof x === "string") : undefined;

    const result = await projectionService().apply(params.id, memoryEntryId, mode, selectedMutationIds, memoryService(), syncService());
    return NextResponse.json(result);
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
