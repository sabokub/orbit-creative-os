import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { visualPromptService } from "@/lib/promptIntelligence/visual/server";

export async function PATCH(request: Request, { params }: { params: { generationId: string } }) {
  try {
    return NextResponse.json({
      generation: await visualPromptService().attachAsset(params.generationId, await request.json()),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof ZodError ? error.flatten() : error instanceof Error ? error.message : "Invalid asset" },
      { status: 400 }
    );
  }
}
