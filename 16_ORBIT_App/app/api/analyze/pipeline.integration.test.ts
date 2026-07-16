import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { FULL_WEBSITE_RESPONSE } from "@/lib/responseAnalysis/analyze.fixtures";
import { Project } from "@/lib/types";

/**
 * End-to-end coverage of the two API routes that make up the
 * response-analysis pipeline: POST /api/analyze (analysis only, nothing
 * persisted) and POST /api/analyze/apply (the single commit point). Proves
 * the "OpenAI button" and "manual paste" paths go through the exact same
 * pipeline and produce the same business result, and exercises save-as-draft,
 * rejecting a proposed change, idempotent double-validation, optimistic
 * concurrency, and the new-version conflict flow.
 *
 * The OpenAI semantic call is never invoked here — every request explicitly
 * asks for `skipSemanticAnalysis`, exactly like a real client would when no
 * API key is configured, so this suite never touches the network.
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

function baseProject(id: string): Project {
  return {
    id,
    name: "Homepage 24March Studio",
    type: "website",
    stage: "brief",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brief: {
      brandProfileId: "24march-studio",
      workflowType: "website",
      projectGoal: "Créer la structure et les textes de la homepage du site.",
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

async function loadRoutes() {
  const analyzeRoute = await import("./route");
  const applyRoute = await import("./apply/route");
  return { analyzePost: analyzeRoute.POST, applyPost: applyRoute.POST };
}
async function loadDb() {
  return await import("@/lib/db");
}
async function loadStudioBrain() {
  return await import("@/lib/studioBrain");
}

function postJson(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/analyze + /api/analyze/apply — canonical pipeline", () => {
  it("OpenAI-source and manual-source requests with identical content produce the same analysis result", async () => {
    const { saveProject } = await loadDb();
    await saveProject(baseProject("p1"));
    const { analyzePost } = await loadRoutes();

    const reqBase = { projectId: "p1", workflowStep: "website", rawResponse: FULL_WEBSITE_RESPONSE, skipSemanticAnalysis: true };
    const openaiRes = await analyzePost(postJson("http://localhost/api/analyze", { ...reqBase, source: "openai" }));
    const manualRes = await analyzePost(postJson("http://localhost/api/analyze", { ...reqBase, source: "manual" }));

    expect(openaiRes.status).toBe(200);
    expect(manualRes.status).toBe(200);
    const openaiBody = await openaiRes.json();
    const manualBody = await manualRes.json();

    // Strip the fields that are legitimately per-request (id, timestamp, source).
    const strip = (a: Record<string, unknown>) => {
      const { id: _id, createdAt: _c, source: _s, ...rest } = a;
      return rest;
    };
    expect(strip(openaiBody.analysis)).toEqual(strip(manualBody.analysis));
    expect(openaiBody.analysis.source).toBe("openai");
    expect(manualBody.analysis.source).toBe("manual");
  });

  it("does not persist anything from POST /api/analyze alone", async () => {
    const { saveProject, getProject } = await loadDb();
    await saveProject(baseProject("p2"));
    const { analyzePost } = await loadRoutes();

    await analyzePost(
      postJson("http://localhost/api/analyze", {
        projectId: "p2",
        workflowStep: "website",
        rawResponse: FULL_WEBSITE_RESPONSE,
        source: "manual",
        skipSemanticAnalysis: true,
      })
    );

    const project = await getProject("p2");
    expect(project?.outputs.website).toBeUndefined();
  });

  it("validate mode saves the output with its analysis and applies accepted Studio Brain changes", async () => {
    const { saveProject, getProject } = await loadDb();
    await saveProject(baseProject("p3"));
    const { analyzePost, applyPost } = await loadRoutes();

    const analyzeRes = await analyzePost(
      postJson("http://localhost/api/analyze", {
        projectId: "p3",
        workflowStep: "website",
        rawResponse: FULL_WEBSITE_RESPONSE + "\n\n## Prochaines actions\n- Envoyer le lien au client",
        source: "manual",
        skipSemanticAnalysis: true,
      })
    );
    const { analysis } = await analyzeRes.json();

    const applyRes = await applyPost(
      postJson("http://localhost/api/analyze/apply", { projectId: "p3", workflowStep: "website", analysis, mode: "validate" })
    );
    expect(applyRes.status).toBe(200);
    const applyBody = await applyRes.json();
    expect(applyBody.applyResult.createdTaskIds.length).toBeGreaterThan(0);

    const saved = await getProject("p3");
    expect(saved?.outputs.website?.content).toContain("Positionnement web");
    expect(saved?.outputs.website?.analysis?.id).toBe(analysis.id);
    expect(saved?.outputs.website?.studioBrainApplied).toBe(true);

    const { listItems } = await loadStudioBrain();
    const items = await listItems();
    expect(items.some((i) => i.title.includes("Envoyer le lien au client"))).toBe(true);
  });

  it("draft mode saves the output but never touches Studio Brain", async () => {
    const { saveProject, getProject } = await loadDb();
    await saveProject(baseProject("p4"));
    const { analyzePost, applyPost } = await loadRoutes();

    const analyzeRes = await analyzePost(
      postJson("http://localhost/api/analyze", {
        projectId: "p4",
        workflowStep: "website",
        rawResponse: FULL_WEBSITE_RESPONSE,
        source: "manual",
        skipSemanticAnalysis: true,
      })
    );
    const { analysis } = await analyzeRes.json();

    await applyPost(postJson("http://localhost/api/analyze/apply", { projectId: "p4", workflowStep: "website", analysis, mode: "draft" }));

    const saved = await getProject("p4");
    expect(saved?.outputs.website?.analysis).toBeTruthy();
    expect(saved?.outputs.website?.studioBrainApplied).toBe(false);

    const { listItems } = await loadStudioBrain();
    const items = await listItems();
    expect(items.filter((i) => i.projectId === "p4")).toHaveLength(0);
  });

  it("rejecting a proposed change (accepted:false) before validating skips it", async () => {
    const { saveProject } = await loadDb();
    await saveProject(baseProject("p5"));
    const { analyzePost, applyPost } = await loadRoutes();

    const analyzeRes = await analyzePost(
      postJson("http://localhost/api/analyze", {
        projectId: "p5",
        workflowStep: "website",
        rawResponse: FULL_WEBSITE_RESPONSE + "\n\n## Prochaines actions\n- Envoyer le brief au client",
        source: "manual",
        skipSemanticAnalysis: true,
      })
    );
    const { analysis } = await analyzeRes.json();
    const rejected = {
      ...analysis,
      proposedStudioBrainChanges: analysis.proposedStudioBrainChanges.map((c: { accepted: boolean }) => ({ ...c, accepted: false })),
    };

    const applyRes = await applyPost(
      postJson("http://localhost/api/analyze/apply", { projectId: "p5", workflowStep: "website", analysis: rejected, mode: "validate" })
    );
    const applyBody = await applyRes.json();
    expect(applyBody.applyResult.createdTaskIds).toHaveLength(0);

    const { listItems } = await loadStudioBrain();
    const items = await listItems();
    expect(items.some((i) => i.title.includes("Envoyer le brief au client"))).toBe(false);
  });

  it("is idempotent: re-submitting the exact same validated analysis is a safe no-op the second time", async () => {
    const { saveProject } = await loadDb();
    await saveProject(baseProject("p6"));
    const { analyzePost, applyPost } = await loadRoutes();

    const analyzeRes = await analyzePost(
      postJson("http://localhost/api/analyze", {
        projectId: "p6",
        workflowStep: "website",
        rawResponse: FULL_WEBSITE_RESPONSE + "\n\n## Prochaines actions\n- Publier la homepage",
        source: "manual",
        skipSemanticAnalysis: true,
      })
    );
    const { analysis } = await analyzeRes.json();

    const first = await applyPost(postJson("http://localhost/api/analyze/apply", { projectId: "p6", workflowStep: "website", analysis, mode: "validate" }));
    const firstBody = await first.json();
    expect(firstBody.applyResult.createdTaskIds.length).toBeGreaterThan(0);

    const second = await applyPost(postJson("http://localhost/api/analyze/apply", { projectId: "p6", workflowStep: "website", analysis, mode: "validate" }));
    const secondBody = await second.json();
    expect(secondBody.idempotentNoOp).toBe(true);

    const { listItems } = await loadStudioBrain();
    const items = await listItems();
    expect(items.filter((i) => i.title.includes("Publier la homepage"))).toHaveLength(1);
  });

  it("rejects a stale write with 409 when ifMatch no longer matches the project's updated_at", async () => {
    const { saveProject, getProject } = await loadDb();
    await saveProject(baseProject("p7"));
    const staleProject = await getProject("p7");
    const { analyzePost, applyPost } = await loadRoutes();

    // Someone else updates the project in between (mirrors what PUT /api/projects/[id] does).
    await saveProject({ ...staleProject!, name: "Renamed elsewhere", updated_at: new Date(Date.now() + 60_000).toISOString() });

    const analyzeRes = await analyzePost(
      postJson("http://localhost/api/analyze", { projectId: "p7", workflowStep: "website", rawResponse: FULL_WEBSITE_RESPONSE, source: "manual", skipSemanticAnalysis: true })
    );
    const { analysis } = await analyzeRes.json();

    const applyRes = await applyPost(
      postJson("http://localhost/api/analyze/apply", {
        projectId: "p7",
        workflowStep: "website",
        analysis,
        mode: "validate",
        ifMatch: staleProject!.updated_at,
      })
    );
    expect(applyRes.status).toBe(409);
  });

  it("requires an explicit versionAction when a meaningfully different response is validated over an existing deliverable", async () => {
    const { saveProject } = await loadDb();
    await saveProject(baseProject("p8"));
    const { analyzePost, applyPost } = await loadRoutes();

    const firstAnalyze = await analyzePost(
      postJson("http://localhost/api/analyze", { projectId: "p8", workflowStep: "website", rawResponse: FULL_WEBSITE_RESPONSE, source: "manual", skipSemanticAnalysis: true })
    );
    const { analysis: firstAnalysis } = await firstAnalyze.json();
    await applyPost(postJson("http://localhost/api/analyze/apply", { projectId: "p8", workflowStep: "website", analysis: firstAnalysis, mode: "validate" }));

    const changed = FULL_WEBSITE_RESPONSE.replace(
      "Ton intérieur devient un espace qui te ressemble, qui se vit et qui se montre.",
      "Une nouvelle promesse totalement différente pour le hero de la page."
    );
    const secondAnalyze = await analyzePost(
      postJson("http://localhost/api/analyze", { projectId: "p8", workflowStep: "website", rawResponse: changed, source: "manual", skipSemanticAnalysis: true })
    );
    const { analysis: secondAnalysis, versionDiff } = await secondAnalyze.json();
    expect(versionDiff.significant).toBe(true);

    const conflictRes = await applyPost(
      postJson("http://localhost/api/analyze/apply", { projectId: "p8", workflowStep: "website", analysis: secondAnalysis, mode: "validate" })
    );
    expect(conflictRes.status).toBe(409);
    const conflictBody = await conflictRes.json();
    expect(conflictBody.requiresVersionAction).toBe(true);

    const replaceRes = await applyPost(
      postJson("http://localhost/api/analyze/apply", {
        projectId: "p8",
        workflowStep: "website",
        analysis: secondAnalysis,
        mode: "validate",
        versionAction: "replace",
      })
    );
    expect(replaceRes.status).toBe(200);
    const { project } = await replaceRes.json();
    expect(project.outputs.website.content).toContain("Une nouvelle promesse totalement différente");
  });
});
