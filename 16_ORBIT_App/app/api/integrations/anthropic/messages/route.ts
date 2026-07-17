import { NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/db";
import { buildExternalAssistantContext } from "@/lib/sync/context";
import { syncService } from "@/lib/sync/server";
import { memoryService } from "@/lib/agents/server";
import { assertReasonablePayload, requireString, ValidationError } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Starts/continues a Claude conversation FROM Orbit. Prepared connector: calls
 * the Anthropic API server-side when ANTHROPIC_API_KEY is configured (key never
 * client-side); otherwise returns 501 so the endpoint exists without failing
 * silently. Stores the exchange as a conversation and journals it.
 */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    assertReasonablePayload(raw);
    const body = JSON.parse(raw) as Record<string, unknown>;

    const projectId = requireString(body.projectId, "projectId");
    const message = requireString(body.message, "message", 20_000);
    const objective = typeof body.objective === "string" ? body.objective.slice(0, 2000) : "";

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Connecteur Anthropic non configuré (ANTHROPIC_API_KEY manquant). Utilise l'import manuel en attendant." },
        { status: 501 }
      );
    }

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
      target: "claude",
      memory,
      progress,
    });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 2000,
        system: context.text,
        messages: [{ role: "user", content: message }],
      }),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error((errBody as { error?: { message?: string } }).error?.message || `Requête Anthropic échouée (${res.status})`);
    }
    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    const reply = data.content?.map((c) => c.text || "").join("") || "";

    const { conversation } = await syncService().importConversation({
      projectId,
      source: "anthropic-api",
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
