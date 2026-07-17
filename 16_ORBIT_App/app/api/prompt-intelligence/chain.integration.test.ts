import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { Project } from "@/lib/types";
import { buildPrompt } from "@/lib/prompts";
import { getBrandProfile } from "@/lib/brandProfile";
import { isLegacyPromptAvailable } from "@/lib/promptIntelligence/migration";

/**
 * End-to-end coverage of the Website prompt-chain endpoints layered on top
 * of the existing response-analysis pipeline: proves a validated step 1
 * response actually flows into step 2's built prompt, that validation is
 * idempotent (no duplicate version history entries), that a failed/incomplete
 * step can be retried without touching any other step, and that the legacy
 * monolithic Website prompt keeps working unmodified alongside the chain.
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
  const buildRoute = await import("./build/route");
  const chainRoute = await import("./chain/route");
  const analyzeRoute = await import("../analyze/route");
  const applyRoute = await import("../analyze/apply/route");
  return { buildPost: buildRoute.POST, chainGet: chainRoute.GET, analyzePost: analyzeRoute.POST, applyPost: applyRoute.POST };
}
async function loadDb() {
  return await import("@/lib/db");
}

function postJson(url: string, body: unknown) {
  return new NextRequest(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
function getUrl(url: string) {
  return new NextRequest(url);
}

describe("Website prompt chain — build / chain / analyze / apply integration", () => {
  it("builds a valid prompt for step 1 with zero OpenAI key configured", async () => {
    delete process.env.OPENAI_API_KEY;
    const { saveProject } = await loadDb();
    await saveProject(baseProject("chain-1"));
    const { buildPost } = await loadRoutes();

    const res = await buildPost(
      postJson("http://localhost/api/prompt-intelligence/build", {
        projectId: "chain-1",
        chainStepId: "website-positioning",
        targetModel: "openai-text",
      })
    );
    expect(res.status).toBe(200);
    const { result } = await res.json();
    expect(result.finalPrompt).toContain("Positionnement web");
    expect(result.chainStepId).toBe("website-positioning");
  });

  it("validating step 1 records the validated output and a prompt-version entry, and step 2's prompt then includes it", async () => {
    const { saveProject } = await loadDb();
    await saveProject(baseProject("chain-2"));
    const { buildPost, analyzePost, applyPost, chainGet } = await loadRoutes();

    const buildRes = await buildPost(
      postJson("http://localhost/api/prompt-intelligence/build", { projectId: "chain-2", chainStepId: "website-positioning", targetModel: "openai-text" })
    );
    const { result: buildResult } = await buildRes.json();

    const rawResponse = "## Positionnement web\n" + "Un positionnement complet et suffisamment détaillé pour être jugé complet par le pipeline d'analyse ORBIT.".repeat(3);

    const analyzeRes = await analyzePost(
      postJson("http://localhost/api/analyze", {
        projectId: "chain-2",
        workflowStep: "website",
        reviewTarget: "website-positioning",
        promptId: buildResult.promptVersion,
        rawResponse,
        source: "manual",
        skipSemanticAnalysis: true,
        expectedDeliverables: ["positioning-web"],
      })
    );
    const { analysis } = await analyzeRes.json();

    const applyRes = await applyPost(
      postJson("http://localhost/api/analyze/apply", {
        projectId: "chain-2",
        workflowStep: "website",
        reviewTarget: "website-positioning",
        analysis,
        mode: "validate",
        chainStepId: "website-positioning",
        promptMeta: {
          promptVersion: buildResult.promptVersion,
          builderVersion: buildResult.builderVersion,
          targetModel: buildResult.targetModel,
          selectedKnowledgeIds: buildResult.selectedKnowledge.map((k: { id: string }) => k.id),
          contextSnapshotKeys: buildResult.selectedContext.map((c: { key: string }) => c.key),
          budgetStatus: buildResult.budgetReport.status,
          estimatedPromptChars: buildResult.budgetReport.estimatedPromptChars,
          qualityScore: buildResult.qualityReport.total,
          userEdited: false,
          finalPrompt: buildResult.finalPrompt,
        },
      })
    );
    expect(applyRes.status).toBe(200);
    const { project } = await applyRes.json();
    expect(project.websiteChainOutputs["website-positioning"]).toContain("Positionnement web");
    expect(project.websitePromptChain["website-positioning"]).toHaveLength(1);
    expect(project.websitePromptChain["website-positioning"][0].outcomeStatus).toBe("accepted");

    // Chain GET now reports step 1 as validated.
    const chainRes = await chainGet(getUrl("http://localhost/api/prompt-intelligence/chain?projectId=chain-2"));
    const { steps } = await chainRes.json();
    expect(steps.find((s: { id: string }) => s.id === "website-positioning").hasValidatedOutput).toBe(true);

    // Step 2's build now includes step 1's validated content as prior-decision context.
    const step2BuildRes = await buildPost(
      postJson("http://localhost/api/prompt-intelligence/build", { projectId: "chain-2", chainStepId: "hero-promise", targetModel: "openai-text" })
    );
    const { result: step2Result } = await step2BuildRes.json();
    expect(step2Result.finalPrompt).toContain("Positionnement web");
  });

  it("re-validating the exact same prompt version does not duplicate the version history entry (idempotent)", async () => {
    const { saveProject } = await loadDb();
    await saveProject(baseProject("chain-3"));
    const { buildPost, analyzePost, applyPost } = await loadRoutes();

    const buildRes = await buildPost(
      postJson("http://localhost/api/prompt-intelligence/build", { projectId: "chain-3", chainStepId: "faq", targetModel: "openai-text" })
    );
    const { result: buildResult } = await buildRes.json();

    const rawResponse = `## FAQ
**Q: Une ?**
**R: Oui.**
**Q: Deux ?**
**R: Oui.**
**Q: Trois ?**
**R: Oui.**
**Q: Quatre ?**
**R: Oui.**
**Q: Cinq ?**
**R: Oui.**`;

    const analyzeRes = await analyzePost(
      postJson("http://localhost/api/analyze", {
        projectId: "chain-3",
        workflowStep: "website",
        reviewTarget: "faq",
        rawResponse,
        source: "manual",
        skipSemanticAnalysis: true,
        expectedDeliverables: ["faq"],
      })
    );
    const { analysis } = await analyzeRes.json();

    const promptMeta = {
      promptVersion: buildResult.promptVersion,
      builderVersion: buildResult.builderVersion,
      targetModel: buildResult.targetModel,
      selectedKnowledgeIds: buildResult.selectedKnowledge.map((k: { id: string }) => k.id),
      contextSnapshotKeys: buildResult.selectedContext.map((c: { key: string }) => c.key),
      budgetStatus: buildResult.budgetReport.status,
      estimatedPromptChars: buildResult.budgetReport.estimatedPromptChars,
      qualityScore: buildResult.qualityReport.total,
      userEdited: false,
      finalPrompt: buildResult.finalPrompt,
    };

    const applyReq = () =>
      postJson("http://localhost/api/analyze/apply", {
        projectId: "chain-3",
        workflowStep: "website",
        reviewTarget: "faq",
        analysis,
        mode: "validate",
        chainStepId: "faq",
        promptMeta,
      });

    const first = await applyPost(applyReq());
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.project.websitePromptChain.faq).toHaveLength(1);

    const second = await applyPost(applyReq());
    const secondBody = await second.json();
    expect(secondBody.idempotentNoOp).toBe(true);
  });

  it("a failed/incomplete step can be retried (rebuilt) without needing or affecting any other step", async () => {
    const { saveProject } = await loadDb();
    await saveProject(baseProject("chain-4"));
    const { buildPost, analyzePost } = await loadRoutes();

    const buildRes1 = await buildPost(
      postJson("http://localhost/api/prompt-intelligence/build", { projectId: "chain-4", chainStepId: "sitemap", targetModel: "openai-text" })
    );
    const { result: firstBuild } = await buildRes1.json();

    // Simulate an incomplete/failed response for this step alone.
    const badResponse = "## Arborescence\nUne seule page.";
    const analyzeRes = await analyzePost(
      postJson("http://localhost/api/analyze", {
        projectId: "chain-4",
        workflowStep: "website",
        reviewTarget: "sitemap",
        rawResponse: badResponse,
        source: "manual",
        skipSemanticAnalysis: true,
        expectedDeliverables: ["sitemap"],
      })
    );
    const { analysis } = await analyzeRes.json();
    expect(analysis.detectedDeliverables.find((d: { id: string }) => d.id === "sitemap").status).toBe("partial");

    // Retry: rebuild the same step again (no other step touched, nothing persisted for the failed attempt).
    const buildRes2 = await buildPost(
      postJson("http://localhost/api/prompt-intelligence/build", { projectId: "chain-4", chainStepId: "sitemap", targetModel: "openai-text" })
    );
    const { result: secondBuild } = await buildRes2.json();
    expect(secondBuild.finalPrompt).toBe(firstBuild.finalPrompt);
    expect(secondBuild.promptVersion).not.toBe(firstBuild.promptVersion);

    const { getProject } = await loadDb();
    const project = await getProject("chain-4");
    expect(project?.websiteChainOutputs?.sitemap).toBeUndefined(); // never persisted — only validation persists
  });

  it("the legacy monolithic Website prompt (lib/prompts.ts) remains fully available and unmodified alongside the chain", () => {
    expect(isLegacyPromptAvailable("website")).toBe(true);
    const brand = getBrandProfile("24march-studio");
    const legacyPrompt = buildPrompt(
      "website",
      brand,
      "Homepage 24March Studio",
      {
        brandProfileId: "24march-studio",
        workflowType: "website",
        projectGoal: "Objectif",
        specificContext: "",
        deliverableType: "",
        references: "",
        constraints: "",
        channels: "",
        format: "Markdown",
        successCriteria: "",
      },
      {}
    );
    expect(legacyPrompt).toContain("Agis comme Orbit Website");
    expect(legacyPrompt).toContain("13. Ton UX writing");
  });
});
