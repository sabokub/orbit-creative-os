import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression coverage for "projects cannot be deleted" (missing cascade).
 *
 * Root cause: `lib/db.ts`'s `deleteProject` only removed the `Project`
 * record itself (`orbit-hub:project:<id>` + the `orbit-hub:projects` index).
 * `StudioItem`s (tasks/content) carry an optional `projectId` link but were
 * never cleaned up, so deleting a project silently left orphaned Studio
 * Brain data behind. This tests the fix at both layers:
 *   - `deleteItemsByProjectId` in lib/studioBrain.ts (the cascade itself)
 *   - `deleteProject` in lib/db.ts (that it actually invokes the cascade)
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
      const existed = store.delete(key);
      return existed ? 1 : 0;
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

async function loadStudioBrain() {
  return await import("./studioBrain");
}

async function loadDb() {
  return await import("./db");
}

function baseProject(id: string) {
  return {
    id,
    name: "Lancement site 24March",
    type: "Site web",
    stage: "brief" as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brief: {
      brandProfileId: "brand-24march",
      workflowType: "website" as const,
      projectGoal: "",
      specificContext: "",
      deliverableType: "",
      references: "",
      constraints: "",
      channels: "",
      format: "Markdown",
      successCriteria: "",
    },
    outputs: {},
    reviews: [],
    exports: [],
  };
}

describe("Studio Brain cascade delete on project deletion", () => {
  it("deleteItemsByProjectId hard-deletes only the items linked to that project", async () => {
    const { createItem, listItems, deleteItemsByProjectId } = await loadStudioBrain();

    const linked1 = await createItem({
      kind: "task",
      title: "Wireframe homepage",
      description: "",
      category: "Site web",
      projectId: "project-a",
      estimateMinutes: 60,
      urgency: 4,
      impact: 4,
      launchCritical: true,
      dependsOn: [],
    });
    const linked2 = await createItem({
      kind: "content",
      title: "Copy homepage",
      description: "",
      category: "Contenu",
      projectId: "project-a",
      estimateMinutes: 30,
      urgency: 3,
      impact: 3,
      launchCritical: false,
      dependsOn: [],
    });
    const unrelated = await createItem({
      kind: "task",
      title: "Tâche d'un autre projet",
      description: "",
      category: "Site web",
      projectId: "project-b",
      estimateMinutes: 30,
      urgency: 2,
      impact: 2,
      launchCritical: false,
      dependsOn: [],
    });
    const noProject = await createItem({
      kind: "task",
      title: "Tâche studio sans projet",
      description: "",
      category: "Général",
      estimateMinutes: 30,
      urgency: 2,
      impact: 2,
      launchCritical: false,
      dependsOn: [],
    });

    const removedCount = await deleteItemsByProjectId("project-a");
    expect(removedCount).toBe(2);

    const remaining = await listItems();
    const remainingIds = remaining.map((it) => it.id);
    expect(remainingIds).not.toContain(linked1.id);
    expect(remainingIds).not.toContain(linked2.id);
    expect(remainingIds).toContain(unrelated.id);
    expect(remainingIds).toContain(noProject.id);
  });

  it("is a no-op when no items are linked to the project", async () => {
    const { createItem, listItems, deleteItemsByProjectId } = await loadStudioBrain();
    const independent = await createItem({
      kind: "task",
      title: "Tâche indépendante",
      description: "",
      category: "Général",
      estimateMinutes: 30,
      urgency: 2,
      impact: 2,
      launchCritical: false,
      dependsOn: [],
    });

    const removedCount = await deleteItemsByProjectId("project-with-nothing-linked");
    expect(removedCount).toBe(0);
    expect((await listItems()).map((it) => it.id)).toContain(independent.id);
  });
});

describe("db.deleteProject", () => {
  it("removes the project record and cascades to its Studio Brain items", async () => {
    const { saveProject, deleteProject, getProject, listProjects } = await loadDb();
    const { createItem, listItems } = await loadStudioBrain();

    const project = baseProject("project-a");
    await saveProject(project);

    const linkedItem = await createItem({
      kind: "task",
      title: "Tâche liée au projet",
      description: "",
      category: "Site web",
      projectId: project.id,
      estimateMinutes: 45,
      urgency: 3,
      impact: 3,
      launchCritical: false,
      dependsOn: [],
    });
    const otherProjectItem = await createItem({
      kind: "task",
      title: "Tâche d'un autre projet",
      description: "",
      category: "Site web",
      projectId: "project-other",
      estimateMinutes: 45,
      urgency: 3,
      impact: 3,
      launchCritical: false,
      dependsOn: [],
    });

    await deleteProject(project.id);

    expect(await getProject(project.id)).toBeNull();
    expect(await listProjects()).toHaveLength(0);

    const remainingItems = await listItems();
    const remainingIds = remainingItems.map((it) => it.id);
    expect(remainingIds).not.toContain(linkedItem.id);
    expect(remainingIds).toContain(otherProjectItem.id);
  });

  it("does not throw and leaves other data intact when deleting a project with no linked items", async () => {
    const { saveProject, deleteProject, getProject } = await loadDb();
    const project = baseProject("project-empty");
    await saveProject(project);

    await expect(deleteProject(project.id)).resolves.toBeUndefined();
    expect(await getProject(project.id)).toBeNull();
  });
});
