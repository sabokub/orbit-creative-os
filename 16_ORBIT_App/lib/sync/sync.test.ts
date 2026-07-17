import { describe, it, expect } from "vitest";
import {
  ClaudeCodeReportSchema,
  ProgressEntrySchema,
  SessionReportSchema,
} from "./contracts";
import { analyzeConversationText, normalizeConversation } from "./ingest";
import { SyncService } from "./service";
import { InMemoryConversationStore, InMemoryProgressStore } from "./inMemoryStores";
import { buildExternalAssistantContext } from "./context";
import { MemoryEntry } from "../agents/contracts";

const P = "proj-sync";

function service() {
  return new SyncService(new InMemoryConversationStore(), new InMemoryProgressStore());
}

describe("ingest — deterministic extraction", () => {
  it("classifies decisions, tasks, validations and blockers", () => {
    const text = [
      "On décide de partir sur une homepage minimaliste.",
      "TODO: intégrer le formulaire de contact.",
      "C'est validé pour la palette bordeaux.",
      "Il y a un bug sur le build Vercel.",
    ].join("\n");
    const a = analyzeConversationText(P, text);
    const kinds = a.items.map((i) => i.kind);
    expect(kinds).toContain("decision");
    expect(kinds).toContain("task");
    expect(kinds).toContain("validation");
    expect(kinds).toContain("technical-issue");
    // Only truth-changing kinds require confirmation.
    expect(a.items.find((i) => i.kind === "decision")?.requiresConfirmation).toBe(true);
    expect(a.items.find((i) => i.kind === "task")?.requiresConfirmation).toBe(false);
  });

  it("flags a validation+rejection contradiction", () => {
    const a = analyzeConversationText(P, "On valide le concept.\nFinalement on rejette cette direction.");
    expect(a.contradictions.length).toBeGreaterThan(0);
  });

  it("keeps raw content for traceability", () => {
    const conv = normalizeConversation({ projectId: P, source: "chatgpt", rawContent: "hello world", title: "T" });
    expect(conv.rawContent).toBe("hello world");
    expect(conv.provenance.source).toBe("chatgpt");
  });
});

describe("SyncService — import & journal", () => {
  it("imports a conversation and journals it", async () => {
    const svc = service();
    const { conversation, analysis } = await svc.importConversation({
      projectId: P,
      source: "claude",
      rawContent: "On décide de lancer avant septembre. TODO: écrire le guide.",
    });
    expect(conversation.syncStatus).toBe("analyzed");
    expect(analysis.items.length).toBeGreaterThan(0);
    const progress = await svc.listProgress(P);
    expect(progress.some((p) => p.type === "import")).toBe(true);
  });

  it("ingests a Claude Code report and dedupes on re-send", async () => {
    const svc = service();
    const report = ClaudeCodeReportSchema.parse({
      projectId: P,
      sessionId: "sess-1",
      objective: "Ajouter le moteur d'agents",
      featuresCompleted: ["engine", "orchestrator"],
      filesCreated: ["lib/agents/engine.ts"],
      commits: ["abc1234"],
      branch: "feature/agents",
      buildResult: "ok",
    });
    const first = await svc.ingestClaudeCodeReport(report);
    expect(first.duplicate).toBe(false);
    expect(first.entry?.type).toBe("dev-session");
    expect(first.entry?.commitSha).toBe("abc1234");

    const second = await svc.ingestClaudeCodeReport(report);
    expect(second.duplicate).toBe(true);
    expect(second.entry).toBeNull();

    const progress = await svc.listProgress(P);
    expect(progress.filter((p) => p.source === "claude-code")).toHaveLength(1);
  });

  it("ingests a session report and returns memory candidates for confirmation", async () => {
    const svc = service();
    const report = SessionReportSchema.parse({
      projectId: P,
      source: "chatgpt",
      sessionTitle: "Atelier positionnement",
      decisions: ["Cible = créatifs urbains"],
      memoryCandidates: ["Le studio vise le premium accessible"],
    });
    const { entry, memoryCandidates } = await svc.ingestSessionReport(report);
    expect(ProgressEntrySchema.safeParse(entry).success).toBe(true);
    expect(memoryCandidates).toHaveLength(1);
  });

  it("computes aggregate sync status", async () => {
    const svc = service();
    await svc.importConversation({ projectId: P, source: "chatgpt", rawContent: "note" });
    const status = await svc.syncStatus(P);
    expect(status.conversationCount).toBe(1);
    expect(status.progressCount).toBeGreaterThan(0);
    expect(status.lastUpdatedBySource.chatgpt).toBeDefined();
  });
});

describe("buildExternalAssistantContext", () => {
  const memory: MemoryEntry[] = [
    { id: "m1", projectId: P, type: "decision", source: "user", title: "Décision", content: "Homepage minimaliste", status: "approved", version: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    { id: "m2", projectId: P, type: "constraint", source: "user", title: "Contrainte", content: "Lancer avant septembre", status: "draft", version: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    { id: "m3", projectId: P, type: "deliverable", source: "agent", title: "Vieux", content: "obsolète", status: "superseded", version: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  ];

  it("includes active truth, excludes superseded, respects the size cap", () => {
    const res = buildExternalAssistantContext({
      projectId: P,
      projectName: "24March",
      objective: "Construire le site",
      target: "claude-code",
      memory,
      progress: [],
      tokenCap: 300,
    });
    expect(res.text).toContain("Homepage minimaliste");
    expect(res.text).toContain("Lancer avant septembre");
    expect(res.text).not.toContain("obsolète");
    expect(res.estimatedTokens).toBeLessThanOrEqual(300);
  });

  it("adapts the response-format section to the target", () => {
    const res = buildExternalAssistantContext({ projectId: P, projectName: "X", objective: "o", target: "chatgpt", memory: [], progress: [] });
    expect(res.text).toContain("sessionReport");
  });
});
