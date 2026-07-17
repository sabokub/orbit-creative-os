import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { generateWithOpenAI } from "@/lib/openai";
import { buildExternalAssistantContext } from "@/lib/sync/context";
import { syncService } from "@/lib/sync/server";
import { memoryService } from "@/lib/agents/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Starts/continues an OpenAI conversation FROM Orbit: seeds the compact project
 * context, calls OpenAI server-side (key never leaves the server), stores the
 * exchange as a conversation, and journals it. Extraction of updates reuses the
 * import pipeline.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const projectId = requireString(body.projectId, "projectId");
    const message = requireString(body.message, "message", 20_000);
    const objective = typeof body.objective === "string" ? body.objective.slice(0, 2000) : "";

    const project = await getProject(projectId);
    if (!project) return NextResponse.json({ error: "Projet introuvable." }, { status: 404 });

    const [memory, progress] = await Promise.all([
      memoryService().list(projectId),
      syncService().listProgress(projectId),
    ]);
    const context = buildExternalAssistantContext({
      projectId,
      projectName: project.name,
      objective,
      target: "chatgpt",
      memory,
      progress,
    });

    const reply = await generateWithOpenAI(`${context.text}\n\n=== MESSAGE ===\n${message}`);

    const { conversation } = await syncService().importConversation({
      projectId,
      source: "openai-api",
      title: objective || message.slice(0, 60),
      messages: [
        { role: "user", content: message },
        { role: "assistant", content: reply },
      ],
    });

    return NextResponse.json({ reply, conversationId: conversation.id });
  } catch (err) {
    const status = err instanceof ValidationError ? 400 : 503;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
