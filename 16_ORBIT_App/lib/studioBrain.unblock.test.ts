import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Regression test for the "unblocked item never gets a notification" bug.
 *
 * Root cause: `recomputeUnblocked` gated on `dependent.status === "blocked"`,
 * but the `dependent` it inspected came from `listItems()`, which always
 * runs every item through `deriveLiveStatuses()` before returning it. That
 * derivation had already flipped the in-memory status to "backlog" the
 * instant the dependency graph showed it as unblocked -- so the persisted
 * "blocked" status this check relied on could never actually be observed,
 * and the notification silently never fired, even though the item correctly
 * *displayed* as unblocked in the UI (hence the bug was invisible visually).
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

describe("recomputeUnblocked", () => {
  it("emits exactly one notification when a blocked item becomes unblocked, and never duplicates it", async () => {
    const {
      createItem,
      updateItem,
      listItems,
      listNotifications,
    } = await loadStudioBrain();

    const upstream = await createItem({
      kind: "task",
      title: "Finaliser la homepage",
      description: "",
      category: "Site web",
      estimateMinutes: 60,
      urgency: 5,
      impact: 5,
      launchCritical: true,
      dependsOn: [],
    });

    const downstream = await createItem({
      kind: "task",
      title: "Publier le guide",
      description: "",
      category: "Site web",
      estimateMinutes: 30,
      urgency: 4,
      impact: 4,
      launchCritical: true,
      dependsOn: [upstream.id],
    });

    // 1. Blocked item becomes unblocked: before the upstream task is done,
    // the dependent must read as "blocked" (live-derived).
    const beforeAll = await listItems();
    const beforeDownstream = beforeAll.find((it) => it.id === downstream.id);
    expect(beforeDownstream?.status).toBe("blocked");
    expect(await listNotifications()).toHaveLength(0);

    // Completing the upstream task is the transition that should unblock it.
    await updateItem(upstream.id, { status: "done" });

    const afterAll = await listItems();
    const afterDownstream = afterAll.find((it) => it.id === downstream.id);
    expect(afterDownstream?.status).not.toBe("blocked");

    // 2. Notification is emitted exactly once.
    const notifsAfterUnblock = await listNotifications();
    expect(notifsAfterUnblock).toHaveLength(1);
    expect(notifsAfterUnblock[0].message).toContain(downstream.title);
    expect(notifsAfterUnblock[0].message).toContain("débloqué");
    expect(notifsAfterUnblock[0].itemId).toBe(downstream.id);

    // 3. No duplicate notification on subsequent reads...
    await listItems();
    await listItems();
    expect(await listNotifications()).toHaveLength(1);

    // ...or on subsequent, unrelated updates.
    await updateItem(downstream.id, { title: "Publier le guide (v2)" });
    expect(await listNotifications()).toHaveLength(1);

    // Re-marking the already-done upstream task "done" again is a no-op
    // (statusChanged guard) and must not re-trigger recomputeUnblocked.
    await updateItem(upstream.id, { status: "done" });
    expect(await listNotifications()).toHaveLength(1);
  });

  it("does not unblock (or notify) a dependent that still has another unfinished dependency", async () => {
    const { createItem, updateItem, listItems, listNotifications } = await loadStudioBrain();

    const depA = await createItem({
      kind: "task",
      title: "Dépendance A",
      description: "",
      category: "Site web",
      estimateMinutes: 30,
      urgency: 3,
      impact: 3,
      launchCritical: false,
      dependsOn: [],
    });
    const depB = await createItem({
      kind: "task",
      title: "Dépendance B",
      description: "",
      category: "Site web",
      estimateMinutes: 30,
      urgency: 3,
      impact: 3,
      launchCritical: false,
      dependsOn: [],
    });
    const dependent = await createItem({
      kind: "task",
      title: "Nécessite A et B",
      description: "",
      category: "Site web",
      estimateMinutes: 30,
      urgency: 3,
      impact: 3,
      launchCritical: false,
      dependsOn: [depA.id, depB.id],
    });

    await updateItem(depA.id, { status: "done" });

    const all = await listItems();
    const stillBlocked = all.find((it) => it.id === dependent.id);
    expect(stillBlocked?.status).toBe("blocked");
    expect(await listNotifications()).toHaveLength(0);

    await updateItem(depB.id, { status: "done" });
    const afterBoth = await listItems();
    expect(afterBoth.find((it) => it.id === dependent.id)?.status).not.toBe("blocked");
    expect(await listNotifications()).toHaveLength(1);
  });
});
