import "server-only";
import { createItem, getItem, updateItem, createDecision, resolveDecision, listDecisions } from "../studioBrain";
import { Decision, StudioItem } from "../types";
import { MemoryService } from "../agents/memory/service";
import { SyncService } from "../sync/service";
import { ValidationError } from "../validation";
import { annotateMutations } from "./annotate";
import { computeMutations } from "./engine";
import {
  ProjectionConflict,
  ProjectionConflictResolution,
  ProjectionMode,
  ProjectionMutation,
  ProjectionPreview,
  ProjectionResult,
  StudioBrainLink,
} from "./contracts";
import { ConflictStore, LinkStore, ProjectionLogStore } from "./stores";

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function getDecisionById(id: string): Promise<Decision | null> {
  const all = await listDecisions();
  return all.find((d) => d.id === id) ?? null;
}

/**
 * ProjectionService — the write path from approved agent memory to Studio
 * Brain. Everything routes through the existing lib/studioBrain.ts primitives
 * (createItem/updateItem/createDecision/resolveDecision) — no parallel store.
 * Every write also saves/refreshes a StudioBrainLink (provenance + dedup
 * index) and appends a progress-journal entry via SyncService.
 */
export class ProjectionService {
  constructor(
    private readonly links: LinkStore,
    private readonly conflicts: ConflictStore,
    private readonly log: ProjectionLogStore
  ) {}

  private ioDeps(_projectId: string) {
    return {
      getLink: (dedupeKey: string) => this.links.get(dedupeKey),
      getStudioItem: (id: string) => getItem(id),
      getDecision: (id: string) => getDecisionById(id),
    };
  }

  async preview(projectId: string, memoryEntryId: string, memory: MemoryService): Promise<ProjectionPreview> {
    const entry = await memory.get(memoryEntryId);
    if (!entry || entry.projectId !== projectId) throw new ValidationError("Sortie mémoire introuvable pour ce projet.");
    if (entry.status !== "approved") throw new ValidationError("Seule une sortie approuvée peut être projetée.");
    if (!entry.agentRole) throw new ValidationError("Cette entrée mémoire n'a pas d'agent source.");

    const entries = await memory.list(projectId);
    const raw = computeMutations(entry, entries);
    const { mutations } = await annotateMutations(raw, this.ioDeps(projectId));

    return {
      projectId,
      sourceMemoryEntryId: entry.id,
      sourceAgent: entry.agentRole,
      mutations,
      calculatedAt: new Date().toISOString(),
    };
  }

  async listResults(projectId: string): Promise<ProjectionResult[]> {
    return this.log.listByProject(projectId);
  }

  async listConflicts(projectId: string): Promise<ProjectionConflict[]> {
    return this.conflicts.listByProject(projectId);
  }

  async apply(
    projectId: string,
    memoryEntryId: string,
    mode: ProjectionMode,
    selectedMutationIds: string[] | undefined,
    memory: MemoryService,
    sync: SyncService
  ): Promise<ProjectionResult> {
    if (mode === "preview") throw new ValidationError("Utilise /projections/preview pour prévisualiser sans appliquer.");
    const entry = await memory.get(memoryEntryId);
    if (!entry || entry.projectId !== projectId) throw new ValidationError("Sortie mémoire introuvable pour ce projet.");
    if (entry.status !== "approved") throw new ValidationError("Seule une sortie approuvée peut être projetée.");
    if (!entry.agentRole) throw new ValidationError("Cette entrée mémoire n'a pas d'agent source.");

    const entries = await memory.list(projectId);
    const raw = computeMutations(entry, entries);
    const { mutations, conflicts: conflictDrafts } = await annotateMutations(raw, this.ioDeps(projectId));

    const eligible =
      mode === "auto-safe"
        ? mutations.filter((m) => !m.requiresConfirmation && m.operation !== "skip" && m.status !== "conflict")
        : mutations.filter((m) => (selectedMutationIds ?? []).includes(m.id) && m.operation !== "skip" && m.status !== "conflict");

    const applied: ProjectionMutation[] = [];
    for (const m of eligible) {
      applied.push(await this.applyOne(m, projectId));
    }

    const appliedIds = new Set(applied.map((m) => m.id));
    const skipped = mutations.filter((m) => !appliedIds.has(m.id) && m.status !== "conflict").map((m) => ({ ...m, status: "skipped" as const }));

    const savedConflicts: ProjectionConflict[] = [];
    for (const draft of conflictDrafts) {
      const existing = await this.conflicts.findOpenByDedupeKey(projectId, draft.mutation.deduplicationKey);
      if (existing) {
        savedConflicts.push(existing);
        continue;
      }
      const now = new Date().toISOString();
      const conflict: ProjectionConflict = {
        id: genId("pconflict"),
        projectId,
        mutation: draft.mutation,
        reason: draft.reason,
        targetId: draft.targetId,
        oldValue: draft.oldValue,
        newValue: draft.newValue,
        status: "open",
        createdAt: now,
      };
      await this.conflicts.save(conflict);
      savedConflicts.push(conflict);
    }

    const journal = await sync.addProgress({
      projectId,
      source: "orbit",
      type: "note",
      summary: `Projection ${entry.agentRole} → Studio Brain (${applied.length} appliqué·s, ${savedConflicts.length} conflit·s)`,
      details:
        applied.map((m) => `• ${m.targetType} (${m.operation}) : ${(m.payload as { title?: string; question?: string }).title ?? (m.payload as { question?: string }).question ?? ""}`).join("\n") ||
        undefined,
      references: [entry.id],
    });

    const result: ProjectionResult = {
      id: genId("presult"),
      projectId,
      sourceMemoryEntryId: entry.id,
      mode,
      applied,
      skipped,
      conflicts: savedConflicts,
      createdCount: applied.filter((m) => m.operation === "create").length,
      updatedCount: applied.filter((m) => m.operation === "update").length,
      skippedCount: skipped.length,
      conflictCount: savedConflicts.length,
      journalEntryId: journal.id,
      calculatedAt: new Date().toISOString(),
    };
    await this.log.save(result);
    return result;
  }

  private async applyOne(m: ProjectionMutation, projectId: string): Promise<ProjectionMutation> {
    const now = new Date().toISOString();

    if (m.substrate === "studio-task" || m.substrate === "studio-content") {
      const payload = m.payload as {
        title: string;
        description?: string;
        category?: string;
        estimateMinutes?: number;
        urgency?: number;
        impact?: number;
        launchCritical?: boolean;
        dueDate?: string;
        notes?: string;
      };
      let targetId = m.targetId;
      if (m.operation === "update" && targetId) {
        await updateItem(targetId, {
          title: payload.title,
          description: payload.description,
          category: payload.category,
          notes: payload.notes,
          dueDate: payload.dueDate,
        });
        await this.touchLink(m.deduplicationKey, now);
      } else {
        const created: StudioItem = await createItem({
          kind: m.substrate === "studio-content" ? "content" : "task",
          title: payload.title,
          description: payload.description ?? "",
          category: payload.category ?? "Général",
          estimateMinutes: payload.estimateMinutes ?? 30,
          urgency: payload.urgency ?? 3,
          impact: payload.impact ?? 3,
          launchCritical: Boolean(payload.launchCritical),
          dueDate: payload.dueDate,
          dependsOn: [],
          projectId,
          notes: payload.notes,
        });
        targetId = created.id;
        await this.saveLink(m, created.id, now);
      }
      return { ...m, targetId, status: "applied", appliedAt: now };
    }

    // decision
    const payload = m.payload as { question: string; context?: string; options: string[]; autoResolve?: string };
    let targetId = m.targetId;
    if (m.operation === "update" && targetId) {
      // Studio Brain has no decision-content-edit primitive; the existing
      // pending decision already carries the essential question, so this is
      // an intentional no-op re-link rather than a fabricated update.
      await this.touchLink(m.deduplicationKey, now);
    } else {
      const created = await createDecision({ question: payload.question, context: payload.context, options: payload.options, source: "conversation" });
      targetId = created.id;
      if (payload.autoResolve) {
        await resolveDecision(created.id, payload.autoResolve);
      }
      await this.saveLink(m, targetId, now);
    }
    return { ...m, targetId, status: "applied", appliedAt: now };
  }

  private async saveLink(m: ProjectionMutation, targetId: string, now: string): Promise<void> {
    const link: StudioBrainLink = {
      id: m.deduplicationKey,
      projectId: m.projectId,
      targetType: m.targetType,
      substrate: m.substrate,
      targetId,
      sourceMemoryEntryId: m.sourceMemoryEntryId,
      sourceRunId: m.sourceRunId,
      sourceAgent: m.sourceAgent,
      mutationId: m.id,
      lineageRootId: m.lineageRootId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    await this.links.save(link);
  }

  private async touchLink(dedupeKey: string, now: string): Promise<void> {
    const existing = await this.links.get(dedupeKey);
    if (existing) await this.links.save({ ...existing, updatedAt: now });
  }

  /**
   * Resolves a conflict without ever silently overwriting: "keep" leaves the
   * existing Studio Brain value untouched; "replace"/"merge" create a NEW
   * decision (Studio Brain decisions aren't editable in place) and re-point
   * the link, while the conflict record permanently keeps the old value, new
   * value and both provenances for history.
   */
  async resolveConflict(projectId: string, conflictId: string, resolution: ProjectionConflictResolution): Promise<ProjectionConflict> {
    const conflict = await this.conflicts.get(conflictId);
    if (!conflict || conflict.projectId !== projectId) throw new ValidationError("Conflit introuvable.");
    if (conflict.status === "resolved") throw new ValidationError("Ce conflit est déjà résolu.");

    const now = new Date().toISOString();

    if (resolution !== "keep" && conflict.mutation.substrate === "decision") {
      const payload = conflict.mutation.payload as { question: string; options: string[] };
      const context = resolution === "merge" ? `${conflict.oldValue}\n\n--- Nouvelle version ---\n\n${conflict.newValue}` : conflict.newValue;
      const created = await createDecision({ question: payload.question, context, options: payload.options, source: "conversation" });
      await this.saveLink(conflict.mutation, created.id, now);
    }

    const resolved: ProjectionConflict = { ...conflict, status: "resolved", resolution, resolvedAt: now };
    await this.conflicts.save(resolved);
    return resolved;
  }
}
