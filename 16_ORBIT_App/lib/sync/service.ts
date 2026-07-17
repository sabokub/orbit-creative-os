import {
  ClaudeCodeReport,
  ConversationAnalysis,
  ConversationSource,
  ExternalConversation,
  ProgressEntry,
  ProgressEntrySchema,
  ProgressType,
  SessionReport,
  SyncStatusReport,
} from "./contracts";
import { ConversationStore, ProgressStore } from "./stores";
import {
  analyzeConversationText,
  conversationText,
  NormalizeInput,
  normalizeConversation,
} from "./ingest";

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * SyncService — orchestrates conversation ingestion and the central progress
 * journal on top of storage-agnostic ports. Every write keeps provenance, and
 * truth-changing items are only ever surfaced for confirmation (extraction),
 * never auto-promoted to active memory here.
 */
export class SyncService {
  constructor(
    private readonly conversations: ConversationStore,
    private readonly progress: ProgressStore
  ) {}

  /* -------- Conversations -------- */

  async importConversation(input: NormalizeInput): Promise<{
    conversation: ExternalConversation;
    analysis: ConversationAnalysis;
  }> {
    const conversation = normalizeConversation(input);
    const analysis = analyzeConversationText(input.projectId, conversationText(conversation));
    conversation.metadata = { extractedItems: analysis.items.length, contradictions: analysis.contradictions.length };
    await this.conversations.save(conversation);

    await this.addProgress({
      projectId: input.projectId,
      source: input.source,
      type: "import",
      summary: `Conversation importée : ${conversation.title}`,
      details: analysis.summary,
      references: [conversation.id],
      author: input.author,
    });

    return { conversation, analysis };
  }

  analyzeText(projectId: string, text: string): ConversationAnalysis {
    return analyzeConversationText(projectId, text);
  }

  listConversations(projectId: string): Promise<ExternalConversation[]> {
    return this.conversations.listByProject(projectId);
  }

  async removeConversation(id: string, projectId: string): Promise<void> {
    await this.conversations.remove(id, projectId);
  }

  /* -------- Progress journal -------- */

  listProgress(projectId: string): Promise<ProgressEntry[]> {
    return this.progress.listByProject(projectId);
  }

  async addProgress(
    input: Partial<ProgressEntry> & { projectId: string; source: ConversationSource; type: ProgressType; summary: string }
  ): Promise<ProgressEntry> {
    const entry: ProgressEntry = ProgressEntrySchema.parse({
      ...input,
      id: input.id ?? genId("prog"),
      date: input.date ?? new Date().toISOString(),
    });
    await this.progress.save(entry);
    return entry;
  }

  /* -------- Claude Code report -------- */

  /**
   * Ingests a Claude Code end-of-session report as a journal entry. Idempotent:
   * the same session+commit is never journaled twice. Verification stays
   * "declared" — a Claude claim is not proof; GitHub verification is layered
   * later (see contracts VerificationLevel).
   */
  async ingestClaudeCodeReport(report: ClaudeCodeReport): Promise<{ duplicate: boolean; entry: ProgressEntry | null }> {
    const dedupeKey = `cc:${report.sessionId}:${report.commits.join(",") || report.branch || "nocommit"}`;
    if (await this.progress.hasDedupeKey(report.projectId, dedupeKey)) {
      return { duplicate: true, entry: null };
    }
    const entry = await this.addProgress({
      projectId: report.projectId,
      source: "claude-code",
      sessionId: report.sessionId,
      type: "dev-session",
      summary: report.objective || report.nextStep || "Session Claude Code",
      details: [report.analysis, report.plan].filter(Boolean).join("\n\n") || undefined,
      decisions: report.technicalDecisions,
      tasksCompleted: report.featuresCompleted,
      tasksCreated: report.featuresPartial,
      filesChanged: [...report.filesCreated, ...report.filesModified, ...report.filesDeleted],
      featuresAdded: report.featuresCompleted,
      issues: report.remainingErrors,
      blockers: report.risks,
      testsRun: report.testsResult,
      buildStatus: report.buildResult,
      nextAction: report.nextStep,
      references: [...report.routesChanged, ...report.deployments],
      commitSha: report.commits[0],
      pullRequest: report.pullRequests[0],
      branch: report.branch,
      dedupeKey,
    });
    return { duplicate: false, entry };
  }

  /** Ingests a generic ChatGPT/Claude session report. Returns memoryCandidates needing confirmation. */
  async ingestSessionReport(report: SessionReport): Promise<{ entry: ProgressEntry; memoryCandidates: string[] }> {
    const entry = await this.addProgress({
      projectId: report.projectId,
      source: report.source,
      type: "note",
      summary: report.sessionTitle || "Rapport de session",
      details: report.summary,
      decisions: report.decisions,
      tasksCreated: report.tasksCreated,
      tasksCompleted: report.tasksCompleted,
      issues: report.risks,
      nextAction: report.nextActions[0],
    });
    return { entry, memoryCandidates: report.memoryCandidates };
  }

  /* -------- Aggregate status -------- */

  async syncStatus(projectId: string): Promise<SyncStatusReport> {
    const [conversations, progress] = await Promise.all([
      this.conversations.listByProject(projectId),
      this.progress.listByProject(projectId),
    ]);
    const lastUpdatedBySource: Partial<Record<ConversationSource, string>> = {};
    for (const c of conversations) {
      const prev = lastUpdatedBySource[c.source];
      if (!prev || c.updatedAt > prev) lastUpdatedBySource[c.source] = c.updatedAt;
    }
    for (const p of progress) {
      const prev = lastUpdatedBySource[p.source];
      if (!prev || p.date > prev) lastUpdatedBySource[p.source] = p.date;
    }
    return {
      projectId,
      conversationCount: conversations.length,
      progressCount: progress.length,
      lastUpdatedBySource,
      pendingConversations: conversations.filter((c) => c.syncStatus === "pending" || c.syncStatus === "analyzed").length,
      openConflicts: conversations.filter((c) => c.syncStatus === "conflicted").length,
      lastProgressAt: progress[0]?.date,
    };
  }
}
