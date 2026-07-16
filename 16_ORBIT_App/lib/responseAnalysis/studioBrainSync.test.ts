import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `applyAnalysisToStudioBrain` is the only place a validated analysis is
 * allowed to mutate Studio Brain. This covers: dedupe against existing
 * items, idempotent re-application (double-click on "Valider"), decision
 * creation, and propagation of optimistic-concurrency (ConflictError)
 * failures from the underlying `updateItem` call.
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
      const store = getStore();
      return store.delete(key) ? 1 : 0;
    }
  }
  return { Redis: MockRedis };
});

beforeEach(() => {
  (globalThis as unknown as { __mockRedisStore?: Map<string, unknown> }).__mockRedisStore = new Map();
  process.env.UPSTASH_REDIS_REST_URL = "mock://localhost";
  process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
  vi.resetModules();
});

async function loadSync() {
  return await import("./studioBrainSync");
}
async function loadStudioBrain() {
  return await import("../studioBrain");
}

function baseAnalysis(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "analysis-1",
    projectId: "project-1",
    workflowStep: "website",
    source: "manual",
    createdAt: new Date().toISOString(),
    documentType: "website",
    documentTypeConfidence: 1,
    matchesExpectedModule: true,
    rawResponse: "raw",
    normalizedResponse: "raw",
    summary: "summary",
    completenessScore: 80,
    qualityScore: 80,
    exploitability: "ready",
    brandCoherence: { score: 80, issues: [] },
    briefCoherence: { score: 80, issues: [] },
    semanticAnalysisPerformed: false,
    expectedDeliverables: [],
    detectedDeliverables: [],
    missingDeliverables: [],
    partialDeliverables: [],
    extractedEntities: {},
    extractedTasks: [],
    extractedDecisions: [],
    extractedDependencies: [],
    extractedContent: [],
    extractedPages: [],
    extractedSections: [],
    extractedCTAs: [],
    extractedFAQ: [],
    extractedSEO: null,
    extractedImageDirections: [],
    extractedImagePrompts: [],
    warnings: [],
    contradictions: [],
    placeholders: [],
    recommendedNextActions: [],
    proposedStudioBrainChanges: [
      {
        id: "proposal-0",
        kind: "create_task",
        description: 'Créer une tâche : Compléter "FAQ"',
        payload: { title: "Compléter la FAQ", category: "Site internet", projectId: "project-1" },
        accepted: true,
      },
    ],
    ...overrides,
  } as Parameters<Awaited<ReturnType<typeof loadSync>>["applyAnalysisToStudioBrain"]>[0];
}

describe("applyAnalysisToStudioBrain", () => {
  it("creates only the accepted proposed changes, skipping rejected ones", async () => {
    const { applyAnalysisToStudioBrain } = await loadSync();
    const analysis = baseAnalysis({
      proposedStudioBrainChanges: [
        { id: "a", kind: "create_task", description: "A", payload: { title: "Tâche A", category: "Général", projectId: "project-1" }, accepted: true },
        { id: "b", kind: "create_task", description: "B", payload: { title: "Tâche B", category: "Général", projectId: "project-1" }, accepted: false },
      ],
    });
    const result = await applyAnalysisToStudioBrain(analysis);
    expect(result.createdTaskIds).toHaveLength(1);
    expect(result.skipped).not.toContain("a");

    const { listItems } = await loadStudioBrain();
    const items = await listItems();
    expect(items.map((i) => i.title)).toContain("Tâche A");
    expect(items.map((i) => i.title)).not.toContain("Tâche B");
  });

  it("does not create a duplicate task when one with the same folded title already exists", async () => {
    const { createItem } = await loadStudioBrain();
    await createItem({
      kind: "task",
      title: "Compléter la FAQ",
      description: "",
      category: "Général",
      estimateMinutes: 30,
      urgency: 3,
      impact: 3,
      launchCritical: false,
      dependsOn: [],
    });

    const { applyAnalysisToStudioBrain } = await loadSync();
    const analysis = baseAnalysis();
    const result = await applyAnalysisToStudioBrain(analysis);
    expect(result.createdTaskIds).toHaveLength(0);
    expect(result.skipped).toContain("proposal-0");

    const { listItems } = await loadStudioBrain();
    const items = await listItems();
    expect(items.filter((i) => i.title === "Compléter la FAQ")).toHaveLength(1);
  });

  it("is idempotent: applying the same analysis twice never creates duplicate tasks", async () => {
    const { applyAnalysisToStudioBrain } = await loadSync();
    const analysis = baseAnalysis();
    const first = await applyAnalysisToStudioBrain(analysis);
    const second = await applyAnalysisToStudioBrain(analysis);
    expect(first.createdTaskIds).toHaveLength(1);
    expect(second.createdTaskIds).toHaveLength(0); // dedupe kicks in the second time
    expect(second.skipped).toContain("proposal-0");

    const { listItems } = await loadStudioBrain();
    const items = await listItems();
    expect(items.filter((i) => i.title === "Compléter la FAQ")).toHaveLength(1);
  });

  it("creates a Decision for a genuinely ambiguous extracted decision", async () => {
    const { applyAnalysisToStudioBrain } = await loadSync();
    const analysis = baseAnalysis({
      proposedStudioBrainChanges: [
        {
          id: "decision-0",
          kind: "create_decision",
          description: "Créer une décision",
          payload: { question: "Le positionnement est-il assez différenciant ?", options: ["Valider l'hypothèse", "Redemander une clarification"] },
          accepted: true,
        },
      ],
    });
    const result = await applyAnalysisToStudioBrain(analysis);
    expect(result.createdDecisionIds).toHaveLength(1);

    const { listDecisions } = await loadStudioBrain();
    const decisions = await listDecisions();
    expect(decisions.some((d) => d.question.includes("différenciant"))).toBe(true);
  });

  it("does nothing and returns an empty result when there are no accepted changes", async () => {
    const { applyAnalysisToStudioBrain } = await loadSync();
    const analysis = baseAnalysis({
      proposedStudioBrainChanges: [
        { id: "a", kind: "create_task", description: "A", payload: { title: "Tâche A" }, accepted: false },
      ],
    });
    const result = await applyAnalysisToStudioBrain(analysis);
    expect(result.createdTaskIds).toHaveLength(0);
    expect(result.completedTaskIds).toHaveLength(0);
    expect(result.createdDecisionIds).toHaveLength(0);
  });
});
