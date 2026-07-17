import { NextResponse } from "next/server";
import { approveVisualPrompt } from "@/lib/promptIntelligence/visual/server";

export async function POST(_request: Request, { params }: { params: { promptId: string } }) {
  try {
    return NextResponse.json(await approveVisualPrompt(params.promptId));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to approve prompt" }, { status: 400 });
  }
}
