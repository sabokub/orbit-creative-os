import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryEntry } from "../agents/contracts";
import { computeMutations } from "./engine";
import { annotateMutations } from "./annotate";
import { InMemoryLinkStore, InMemoryConflictStore, InMemoryProjectionLogStore } from "./inMemoryStores";
import { ProjectionService } from "./service";
import { StudioBrainLink } from "./contracts";

/**
 * Same Redis-mock convention as lib/studioBrain.unblock.test.ts: an in-memory
 * Map behind the @upstash/redis client, shared across every module under
 * test (studioBrain, agents/memory, sync, projection all read the same
 * mocked store) — this lets the full projection write path be exercised for
 * real instead of hand-rolled fakes.
 */
vi.mock("@upstash/redis", () => {
  function getStore(): Map<string, unknown> {
    const g = globalThis as unknown as { __mockRedisStore?: Map<string, unknown> };
    if (!g.__mockRedisStore) g.__mockRedisStore = new Map();
    return g.__mockRedisStore;
  }
  class MockRedis {
    static fromEnv() {
      return new MockRedis();
    }
    async get<T>(key: string): Promise<T | null> {
      const store = getStore();
      if (!store.has(key)) return null;
      return JSON.parse(JSON.stringify(store.get(key))) as T;
    }
    async set(key: string, value: unknown): Promise<"OK"> {
      getStore().set(key, JSON.parse(JSON.stringify(value)));
      return "OK";
    }
    async del(key: string): Promise<number> {
      return getStore().delete(key) ? 1 : 0;
    }
  }
  return { Redis: MockRedis };
});

beforeEach(() => {
  (globalThis as unknown as { __mockRedisStore?: Map<string, unknown> }).__mockRedisStore = new Map();
  process.env.KV_REST_API_URL = "mock://redis";
  process.env.KV_REST_API_TOKEN = "mock-token";
});

const P = "proj-x";

function orbitBrainEntry(over: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: "mem-1",
    projectId: P,
    type: "analysis",
    source: "agent",
    agentRole: "orbit-brain",
    title: "Orbit Brain — Test",
    content: "Résumé",
    status: "approved",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    data: {
      projectSummary: "s", audience: "a", objectives: ["o1"], constraints: ["c1"],
      assumedPositioning: "p", needs: ["n1"], risks: ["Risque test"], opportunities: [],
      missingInfo: ["Budget manquant"], decisionsMade: ["Nom du projet validé"],
    },
    ...over,
  };
}

function brandData(positioning: string) {
  return {
    positioning, promise: "Promesse", valueProposition: "Valeur",
    target: "Créatifs", differentiation: "Méthode", tone: "Direct", keyMessages: ["Message A"], brandTerritories: [],
  };
}

function brandEntry(over: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: "mem-brand-1",
    projectId: P,
    type: "deliverable",
    source: "agent",
    agentRole: "brand-strategist",
    title: "Brand Strategist — Test",
    content: "Positionnement",
    status: "approved",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    data: brandData("Direction artistique d'intérieur"),
    ...over,
  };
}

/* ------------------------------------------------------------------------ *
 * Pure layer — no IO
 * ------------------------------------------------------------------------ */

describe("engine.computeMutations — precondition", () => {
  it("returns nothing for a draft entry (never projects unapproved work)", () => {
    const entry = orbitBrainEntry({ status: "draft" });
    expect(computeMutations(entry, [entry])).toHaveLength(0);
  });

  it("returns nothing for a rejected entry", () => {
    const entry = orbitBrainEntry({ status: "rejected" });
    expect(computeMutations(entry, [entry])).toHaveLength(0);
  });

  it("computes mutations for an approved entry, deterministic ids (preview/apply always agree)", () => {
    const entry = orbitBrainEntry();
    const m1 = computeMutations(entry, [entry]);
    const m2 = computeMutations(entry, [entry]);
    expect(m1.length).toBeGreaterThan(0);
    expect(m1.map((m) => m.id)).toEqual(m2.map((m) => m.id));
  });
});

describe("rules — orbit-brain", () => {
  it("projects missingInfo as auto-safe tasks and risks as decisions requiring confirmation", () => {
    const entry = orbitBrainEntry();
    const mutations = computeMutations(entry, [entry]);
    const task = mutations.find((m) => m.targetType === "task");
    const risk = mutations.find((m) => m.targetType === "risk");
    const decisionMade = mutations.find((m) => m.deduplicationKey.includes("decision-made"));
    expect(task?.requiresConfirmation).toBe(false);
    expect(risk?.requiresConfirmation).toBe(true);
    expect(decisionMade?.payload).toMatchObject({ autoResolve: "Confirmé" });
  });
});

describe("annotateMutations — create vs update vs conflict", () => {
  it("stays 'create' when no link exists", async () => {
    const entry = orbitBrainEntry();
    const raw = computeMutations(entry, [entry]);
    const { mutations } = await annotateMutations(raw, { getLink: async () => null, getStudioItem: async () => null, getDecision: async () => null });
    expect(mutations.every((m) => m.operation === "create")).toBe(true);
  });

  it("flags a conflict when the linked task is already done", async () => {
    const entry = orbitBrainEntry();
    const raw = computeMutations(entry, [entry]);
    const taskMutation = raw.find((m) => m.substrate === "studio-task")!;
    const link: StudioBrainLink = { id: taskMutation.deduplicationKey, projectId: P, targetType: "task", substrate: "studio-task", targetId: "item-done", sourceMemoryEntryId: entry.id, sourceAgent: "orbit-brain", mutationId: taskMutation.id, lineageRootId: entry.id, status: "active", createdAt: "x", updatedAt: "x" };
    const { mutations, conflicts } = await annotateMutations([taskMutation], {
      getLink: async (k) => (k === link.id ? link : null),
      getStudioItem: async () => ({ id: "item-done", kind: "task", title: "old", description: "", status: "done", order: 0, category: "x", estimateMinutes: 30, urgency: 3, impact: 3, launchCritical: false, dependsOn: [], createdAt: "x", updatedAt: "x" }),
      getDecision: async () => null,
    });
    expect(conflicts).toHaveLength(1);
    expect(mutations[0].status).toBe("conflict");
  });

  it("skips a resolved decision when content is unchanged (idempotent, no duplicate)", async () => {
    const entry = brandEntry();
    const raw = computeMutations(entry, [entry]);
    const decisionMutation = raw.find((m) => m.substrate === "decision")!;
    const payload = decisionMutation.payload as { context: string };
    const link: StudioBrainLink = { id: decisionMutation.deduplicationKey, projectId: P, targetType: "brand-element", substrate: "decision", targetId: "dec-1", sourceMemoryEntryId: entry.id, sourceAgent: "brand-strategist", mutationId: decisionMutation.id, lineageRootId: entry.id, status: "active", createdAt: "x", updatedAt: "x" };
    const { mutations, conflicts } = await annotateMutations([decisionMutation], {
      getLink: async (k) => (k === link.id ? link : null),
      getStudioItem: async () => null,
      getDecision: async () => ({ id: "dec-1", question: "q", context: payload.context, options: ["Approuver", "Réviser"], status: "resolved", resolution: "Approuver", createdAt: "x" }),
    });
    expect(conflicts).toHaveLength(0);
    expect(mutations[0].operation).toBe("skip");
  });
});

describe("lineage stability across versions", () => {
  it("dedup key stays the same across a new version of the same lineage", () => {
    const v1 = orbitBrainEntry({ id: "mem-1", version: 1 });
    const v2 = orbitBrainEntry({ id: "mem-2", version: 2, supersedes: "mem-1" });
    const entries = [v1, v2];
    const m1 = computeMutations(v1, entries);
    const m2 = computeMutations(v2, entries);
    expect(m1[0].deduplicationKey).toBe(m2[0].deduplicationKey);
  });
});

describe("in-memory link/conflict stores — no leak between projects", () => {
  it("links are scoped by projectId", async () => {
    const links = new InMemoryLinkStore();
    await links.save({ id: "k1", projectId: "proj-a", targetType: "task", substrate: "studio-task", targetId: "i1", sourceMemoryEntryId: "m1", sourceAgent: "orbit-brain", mutationId: "mut1", lineageRootId: "m1", status: "active", createdAt: "x", updatedAt: "x" });
    await links.save({ id: "k2", projectId: "proj-b", targetType: "task", substrate: "studio-task", targetId: "i2", sourceMemoryEntryId: "m2", sourceAgent: "orbit-brain", mutationId: "mut2", lineageRootId: "m2", status: "active", createdAt: "x", updatedAt: "x" });
    expect(await links.listByProject("proj-a")).toHaveLength(1);
    expect(await links.listByProject("proj-b")).toHaveLength(1);
  });

  it("resolveConflict rejects an already-resolved conflict", async () => {
    const conflictsStore = new InMemoryConflictStore();
    const service = new ProjectionService(new InMemoryLinkStore(), conflictsStore, new InMemoryProjectionLogStore());
    const mutation = computeMutations(brandEntry(), [brandEntry()]).find((m) => m.substrate === "decision")!;
    await conflictsStore.save({ id: "c2", projectId: P, mutation, reason: "resolved-decision-content-changed", targetId: "dec-1", oldValue: "old", newValue: "new", status: "resolved", resolution: "keep", createdAt: "x", resolvedAt: "y" });
    await expect(service.resolveConflict(P, "c2", "replace")).rejects.toThrow();
  });
});

/* ------------------------------------------------------------------------ *
 * Full write path, against the REAL lib/studioBrain.ts + Redis-mocked stores.
 * ------------------------------------------------------------------------ */

describe("ProjectionService — real Studio Brain writes (mocked Redis)", () => {
  it("preview → apply confirm creates a real task and a real decision", async () => {
    const { memoryService } = await import("../agents/server");
    const { syncService } = await import("../sync/server");
    const { projectionService } = await import("./server");
    const { listItems, listDecisions } = await import("../studioBrain");

    const memory = memoryService();
    const entry = await memory.recordAgentOutput({
      projectId: P, agentRole: "orbit-brain", type: "analysis", title: "Orbit Brain", content: "c",
      data: orbitBrainEntry().data,
    });
    await memory.setStatus(entry.id, "approved");

    const preview = await projectionService().preview(P, entry.id, memory);
    expect(preview.mutations.length).toBeGreaterThan(0);

    const result = await projectionService().apply(P, entry.id, "confirm", preview.mutations.map((m) => m.id), memory, syncService());
    expect(result.createdCount).toBeGreaterThan(0);
    expect(result.journalEntryId).toBeDefined();

    const items = await listItems();
    expect(items.some((i) => i.title.includes("Budget manquant"))).toBe(true);
    const decisions = await listDecisions();
    expect(decisions.some((d) => d.question.includes("Risque"))).toBe(true);
  });

  it("auto-safe apply only applies non-confirmation mutations", async () => {
    const { memoryService } = await import("../agents/server");
    const { syncService } = await import("../sync/server");
    const { projectionService } = await import("./server");

    const memory = memoryService();
    const entry = await memory.recordAgentOutput({ projectId: P, agentRole: "orbit-brain", type: "analysis", title: "OB", content: "c", data: orbitBrainEntry().data });
    await memory.setStatus(entry.id, "approved");

    const result = await projectionService().apply(P, entry.id, "auto-safe", undefined, memory, syncService());
    expect(result.applied.every((m) => !m.requiresConfirmation)).toBe(true);
    expect(result.skipped.some((m) => m.requiresConfirmation)).toBe(true); // the risk decision was left for confirm mode
  });

  it("re-applying the same approved entry is idempotent — no duplicate tasks", async () => {
    const { memoryService } = await import("../agents/server");
    const { syncService } = await import("../sync/server");
    const { projectionService } = await import("./server");
    const { listItems } = await import("../studioBrain");

    const memory = memoryService();
    const entry = await memory.recordAgentOutput({ projectId: P, agentRole: "orbit-brain", type: "analysis", title: "OB", content: "c", data: orbitBrainEntry().data });
    await memory.setStatus(entry.id, "approved");

    await projectionService().apply(P, entry.id, "auto-safe", undefined, memory, syncService());
    const afterFirst = (await listItems()).filter((i) => i.projectId === P);

    await projectionService().apply(P, entry.id, "auto-safe", undefined, memory, syncService());
    const afterSecond = (await listItems()).filter((i) => i.projectId === P);

    expect(afterSecond.length).toBe(afterFirst.length); // updated in place, not duplicated
  });

  it("a new approved version updates the SAME task instead of creating a second one", async () => {
    const { memoryService } = await import("../agents/server");
    const { syncService } = await import("../sync/server");
    const { projectionService } = await import("./server");
    const { listItems } = await import("../studioBrain");

    const memory = memoryService();
    const v1 = await memory.recordAgentOutput({ projectId: P, agentRole: "orbit-brain", type: "analysis", title: "OB", content: "c", data: orbitBrainEntry().data });
    await memory.setStatus(v1.id, "approved");
    await projectionService().apply(P, v1.id, "auto-safe", undefined, memory, syncService());

    const v2 = await memory.recordAgentOutput({
      projectId: P, agentRole: "orbit-brain", type: "analysis", title: "OB v2", content: "c2",
      data: { ...orbitBrainEntry().data, missingInfo: ["Budget manquant — précisé"] },
    });
    await memory.setStatus(v2.id, "approved");
    const result = await projectionService().apply(P, v2.id, "auto-safe", undefined, memory, syncService());
    expect(result.updatedCount).toBeGreaterThan(0);

    const items = (await listItems()).filter((i) => i.category === "Clarification" && i.projectId === P);
    expect(items).toHaveLength(1); // same task, title refreshed
    expect(items[0].title).toContain("précisé");
  });

  it("a draft output is never projected (preview refuses it)", async () => {
    const { memoryService } = await import("../agents/server");
    const { projectionService } = await import("./server");
    const memory = memoryService();
    const entry = await memory.recordAgentOutput({ projectId: P, agentRole: "orbit-brain", type: "analysis", title: "OB", content: "c", data: orbitBrainEntry().data });
    await expect(projectionService().preview(P, entry.id, memory)).rejects.toThrow();
  });

  it("a rejected output is never projected", async () => {
    const { memoryService } = await import("../agents/server");
    const { projectionService } = await import("./server");
    const memory = memoryService();
    const entry = await memory.recordAgentOutput({ projectId: P, agentRole: "orbit-brain", type: "analysis", title: "OB", content: "c", data: orbitBrainEntry().data });
    await memory.setStatus(entry.id, "rejected");
    await expect(projectionService().preview(P, entry.id, memory)).rejects.toThrow();
  });

  it("conflicting resolved decisions require explicit resolution, then apply replace/keep correctly", async () => {
    const { memoryService } = await import("../agents/server");
    const { syncService } = await import("../sync/server");
    const { projectionService } = await import("./server");
    const { listDecisions } = await import("../studioBrain");

    const memory = memoryService();
    const v1 = await memory.recordAgentOutput({ projectId: P, agentRole: "brand-strategist", type: "deliverable", title: "BS", content: "c", data: brandData("Positionnement initial") });
    await memory.setStatus(v1.id, "approved");
    const preview1 = await projectionService().preview(P, v1.id, memory);
    const r1 = await projectionService().apply(P, v1.id, "confirm", preview1.mutations.map((m) => m.id), memory, syncService());
    // Manually resolve the created decision to simulate a user having approved it.
    const decisions = await listDecisions();
    const created = decisions.find((d) => d.question.includes("positionnement"))!;
    const { resolveDecision } = await import("../studioBrain");
    await resolveDecision(created.id, "Approuver");

    const v2 = await memory.recordAgentOutput({ projectId: P, agentRole: "brand-strategist", type: "deliverable", title: "BS v2", content: "c2", data: brandData("Positionnement complètement différent") });
    await memory.setStatus(v2.id, "approved");
    const preview2 = await projectionService().preview(P, v2.id, memory);
    const conflictMutation = preview2.mutations.find((m) => m.status === "conflict");
    expect(conflictMutation).toBeDefined();

    // apply() is what actually persists the conflict record (preview is read-only).
    const applyWithConflict = await projectionService().apply(P, v2.id, "auto-safe", undefined, memory, syncService());
    expect(applyWithConflict.conflictCount).toBeGreaterThan(0);

    const conflicts = await projectionService().listConflicts(P);
    expect(conflicts.some((c) => c.status === "open")).toBe(true);
    const openConflict = conflicts.find((c) => c.status === "open")!;

    const resolved = await projectionService().resolveConflict(P, openConflict.id, "replace");
    expect(resolved.status).toBe("resolved");
    const decisionsAfter = await listDecisions();
    expect(decisionsAfter.some((d) => (d.context ?? "").includes("complètement différent"))).toBe(true);
    expect(decisionsAfter.some((d) => d.id === created.id && d.resolution === "Approuver")).toBe(true); // old kept, untouched

    expect(r1.applied.length).toBeGreaterThan(0); // sanity: first apply actually did something
  });

  it("content-strategist output creates real content items in Studio Brain", async () => {
    const { memoryService } = await import("../agents/server");
    const { syncService } = await import("../sync/server");
    const { projectionService } = await import("./server");
    const { listItems } = await import("../studioBrain");

    const memory = memoryService();
    const entry = await memory.recordAgentOutput({
      projectId: P, agentRole: "content-strategist", type: "deliverable", title: "CS", content: "c",
      data: { pillars: ["Autorité"], angles: [], formats: [], contentIdeas: ["Idée de reel"], calendar: [{ when: "2026-08-01", item: "Reel méthode" }], distribution: [], ctas: [], recycling: [] },
    });
    await memory.setStatus(entry.id, "approved");
    const result = await projectionService().apply(P, entry.id, "auto-safe", undefined, memory, syncService());
    expect(result.createdCount).toBeGreaterThan(0);

    const content = (await listItems()).filter((i) => i.kind === "content" && i.projectId === P);
    expect(content.some((c) => c.title.includes("Idée de reel"))).toBe(true);
    expect(content.some((c) => c.dueDate === "2026-08-01")).toBe(true);
  });

  it("recomputes the pilot card after a projection creates a task", async () => {
    const { memoryService } = await import("../agents/server");
    const { syncService } = await import("../sync/server");
    const { projectionService } = await import("./server");
    const { computeModePilot } = await import("../workModes/pilot/server");

    const before = await computeModePilot("build");
    const beforeBacklog = before.charts.find((c) => c.id === "build-status")?.data.find((d) => d.label === "À faire")?.value ?? 0;

    const memory = memoryService();
    const entry = await memory.recordAgentOutput({ projectId: P, agentRole: "orbit-brain", type: "analysis", title: "OB", content: "c", data: orbitBrainEntry().data });
    await memory.setStatus(entry.id, "approved");
    await projectionService().apply(P, entry.id, "auto-safe", undefined, memory, syncService());

    const after = await computeModePilot("build");
    const afterBacklog = after.charts.find((c) => c.id === "build-status")?.data.find((d) => d.label === "À faire")?.value ?? 0;
    expect(afterBacklog).toBeGreaterThan(beforeBacklog);
  });

  it("full mocked pipeline: run agent → approve → preview → apply → task in Studio Brain, journal updated", async () => {
    const { memoryService } = await import("../agents/server");
    const { syncService } = await import("../sync/server");
    const { projectionService } = await import("./server");
    const { runAgent } = await import("../agents/engine");
    const { listItems } = await import("../studioBrain");

    const memory = memoryService();
    const generate = async () =>
      JSON.stringify({
        projectSummary: "Résumé", audience: "Audience", objectives: ["Objectif"], constraints: [],
        assumedPositioning: "Positionnement", needs: [], risks: [], opportunities: [],
        missingInfo: ["Point à clarifier pour le pipeline mocké"], decisionsMade: [],
      });
    const runtime = { memory, generate, fixedContext: "Marque test. Brief test.", projectName: "Pipeline Test" };

    const execution = await runAgent({ projectId: P, role: "orbit-brain" }, runtime);
    expect(execution.status).toBe("completed");
    const memoryId = execution.memoryEntryIds[0];

    await memory.setStatus(memoryId, "approved");
    const preview = await projectionService().preview(P, memoryId, memory);
    expect(preview.mutations.length).toBeGreaterThan(0);

    const result = await projectionService().apply(P, memoryId, "confirm", preview.mutations.map((m) => m.id), memory, syncService());
    expect(result.createdCount).toBeGreaterThan(0);
    expect(result.journalEntryId).toBeDefined();

    const progress = await syncService().listProgress(P);
    expect(progress.some((p) => p.summary.includes("orbit-brain"))).toBe(true);

    const items = await listItems();
    expect(items.some((i) => i.title.includes("pipeline mocké"))).toBe(true);
  });
});
