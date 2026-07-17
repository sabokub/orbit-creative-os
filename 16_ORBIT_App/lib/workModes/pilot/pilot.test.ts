import { describe, it, expect } from "vitest";
import { StudioItem } from "../../types";
import { MemoryEntry } from "../../agents/contracts";
import { ProgressEntry } from "../../sync/contracts";
import { FocusService } from "../focus/service";
import { InMemoryFocusStore } from "../focus/inMemoryStore";
import { ModeInputs } from "./types";
import { buildModePilotData } from "./build";
import { resolveCurrentPriority } from "./priority";

function task(over: Partial<StudioItem>): StudioItem {
  const now = "2026-07-01T00:00:00.000Z";
  return {
    id: over.id ?? `t-${Math.random().toString(36).slice(2, 7)}`,
    kind: over.kind ?? "task",
    title: over.title ?? "Tâche",
    description: "",
    status: over.status ?? "backlog",
    order: 0,
    category: over.category ?? "Site web",
    projectId: over.projectId,
    estimateMinutes: over.estimateMinutes ?? 30,
    urgency: over.urgency ?? 3,
    impact: over.impact ?? 3,
    launchCritical: over.launchCritical ?? false,
    dueDate: over.dueDate,
    dependsOn: over.dependsOn ?? [],
    createdAt: now,
    updatedAt: now,
    ...over,
  };
}

function inputs(over: Partial<ModeInputs>): ModeInputs {
  return {
    mode: over.mode ?? "build",
    now: over.now ?? new Date("2026-07-01T00:00:00.000Z"),
    studioItems: over.studioItems ?? [],
    memory: over.memory ?? [],
    progress: over.progress ?? [],
    focus: over.focus ?? null,
    hasProjectContext: over.hasProjectContext ?? false,
  };
}

describe("FocusService — single active per mode", () => {
  it("keeps only one active focus and archives the previous", async () => {
    const svc = new FocusService(new InMemoryFocusStore());
    const f1 = await svc.setActive("build", { title: "Objectif 1" });
    expect(f1.status).toBe("active");
    const f2 = await svc.setActive("build", { title: "Objectif 2" });
    expect((await svc.getActive("build"))?.id).toBe(f2.id);
    const history = await svc.history("build");
    expect(history.some((h) => h.title === "Objectif 1")).toBe(true);
  });

  it("persists across a fresh service on the same store", async () => {
    const store = new InMemoryFocusStore();
    await new FocusService(store).setActive("creation", { title: "DA" });
    const reloaded = await new FocusService(store).getActive("creation");
    expect(reloaded?.title).toBe("DA");
  });

  it("does not leak focus between modes", async () => {
    const svc = new FocusService(new InMemoryFocusStore());
    await svc.setActive("build", { title: "Build obj" });
    expect(await svc.getActive("creation")).toBeNull();
  });

  it("completes a focus to 100% in history", async () => {
    const svc = new FocusService(new InMemoryFocusStore());
    const f = await svc.setActive("content", { title: "Calendrier" });
    const done = await svc.complete(f.id);
    expect(done.status).toBe("completed");
    expect(done.progressPercentage).toBe(100);
  });
});

describe("progress calculation is weighted and honest", () => {
  it("a done-but-untested feature does not count as fully done", () => {
    const items = [task({ status: "done", impact: 5, urgency: 5 }), task({ status: "done", impact: 5, urgency: 5 })];
    const untested = buildModePilotData(inputs({ studioItems: items, progress: [] }));
    // No green signal → done credited at 0.85, not 100%.
    expect(untested.progress.percentage).toBe(85);
    const greenProgress: ProgressEntry[] = [
      { id: "p1", projectId: "p", source: "claude-code", date: "2026-07-01", type: "dev-session", summary: "s", decisions: [], tasksCompleted: [], tasksCreated: [], filesChanged: [], featuresAdded: [], issues: [], blockers: [], references: [], buildStatus: "ok", testsRun: "175 passed", verification: "declared", validationStatus: "unconfirmed" },
    ];
    const tested = buildModePilotData(inputs({ studioItems: items, progress: greenProgress }));
    expect(tested.progress.percentage).toBe(100);
  });

  it("flags 'insufficient' when there is too little data", () => {
    const data = buildModePilotData(inputs({ mode: "build", studioItems: [] }));
    expect(data.progress.reliable).toBe(false);
    expect(data.empty).not.toBeNull();
  });

  it("excludes rejected deliverables from creation progress", () => {
    const memory: MemoryEntry[] = [
      { id: "m1", projectId: "p", type: "deliverable", source: "agent", agentRole: "creative-director", title: "DA", content: "ok", status: "approved", version: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
      { id: "m2", projectId: "p", type: "deliverable", source: "agent", agentRole: "creative-director", title: "DA2", content: "no", status: "rejected", version: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    ];
    const data = buildModePilotData(inputs({ mode: "creation", memory, hasProjectContext: true }));
    expect(data.progress.percentage).toBe(100); // only the approved one counts
  });
});

describe("resolveCurrentPriority — single, rule-based", () => {
  it("selects the single highest-weighted actionable item", () => {
    const items = [
      task({ id: "low", title: "Petit", impact: 1, urgency: 1, status: "backlog" }),
      task({ id: "high", title: "Gros", impact: 5, urgency: 5, launchCritical: true, status: "in_progress" }),
    ];
    const p = resolveCurrentPriority(inputs({ studioItems: items }));
    expect(p.sourceIds).toEqual(["high"]);
    expect(p.confidence).toBeGreaterThan(0.5);
  });

  it("boosts an overdue item", () => {
    const items = [
      task({ id: "a", title: "A", impact: 3, urgency: 3, dueDate: "2026-06-01", status: "backlog" }), // overdue vs 2026-07-01
      task({ id: "b", title: "B", impact: 3, urgency: 3, status: "backlog" }),
    ];
    const p = resolveCurrentPriority(inputs({ studioItems: items }));
    expect(p.sourceIds).toEqual(["a"]);
  });

  it("falls back with low confidence when nothing is actionable", () => {
    const p = resolveCurrentPriority(inputs({ studioItems: [task({ status: "done" })] }));
    expect(p.confidence).toBeLessThanOrEqual(0.4);
    expect(p.sourceIds).toHaveLength(0);
  });
});

describe("blockers", () => {
  it("surfaces a primary blocker from an unmet dependency", () => {
    const dep = task({ id: "dep", title: "Dépendance", status: "in_progress" });
    const blocked = task({ id: "blk", title: "Bloquée", dependsOn: ["dep"], status: "backlog" });
    const data = buildModePilotData(inputs({ studioItems: [dep, blocked] }));
    expect(data.primaryBlocker?.id).toBe("blk");
    expect(data.status).toBe("blocked");
  });

  it("raises a cross-mode brand blocker for build when brand is unvalidated", () => {
    const memory: MemoryEntry[] = [
      { id: "m1", projectId: "p", type: "deliverable", source: "agent", agentRole: "brand-strategist", title: "Positionnement", content: "x", status: "draft", version: 1, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
    ];
    const focus = { id: "f", mode: "build" as const, projectId: "p", title: "Homepage", description: "", status: "active" as const, priority: 3, progressPercentage: 0, successCriteria: "", currentAction: "", nextAction: "", blockerIds: [], createdAt: "2026-01-01", updatedAt: "2026-01-01" };
    const data = buildModePilotData(inputs({ mode: "build", memory, focus, hasProjectContext: true, studioItems: [task({})] }));
    expect(data.crossModeBlockers.some((b) => b.sourceMode === "creation")).toBe(true);
  });
});

describe("mode-specific charts", () => {
  it("build shows status segments + critical systems", () => {
    const data = buildModePilotData(inputs({ mode: "build", studioItems: [task({}), task({}), task({})] }));
    expect(data.charts.map((c) => c.id)).toContain("build-status");
    expect(data.charts.map((c) => c.id)).toContain("build-systems");
  });

  it("steering never invents financial data", () => {
    const data = buildModePilotData(inputs({ mode: "steering", studioItems: [task({ launchCritical: true })] }));
    const finance = data.charts.find((c) => c.id === "steering-finance");
    expect(finance?.insufficient).toBe(true);
    expect(finance?.data).toHaveLength(0);
  });
});
