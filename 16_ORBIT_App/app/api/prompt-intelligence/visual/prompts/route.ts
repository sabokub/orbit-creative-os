import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { visualPromptService } from "@/lib/promptIntelligence/visual/server";

export async function GET(request: NextRequest) {
  const projectId = request.nextUrl.searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  try {
    return NextResponse.json({ prompts: await visualPromptService().listPrompts(projectId) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to list prompts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({ prompt: await visualPromptService().savePrompt(await request.json()) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof ZodError ? error.flatten() : error instanceof Error ? error.message : "Invalid prompt" },
      { status: 400 }
    );
  }
}
