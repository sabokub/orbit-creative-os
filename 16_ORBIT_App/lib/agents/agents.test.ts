import { describe, it, expect } from "vitest";
import {
  AGENT_ROLES,
  MemoryEntrySchema,
  OrchestrationRunSchema,
  ReviewResultSchema,
  PIPELINE_ORDER,
} from "./contracts";
import { InMemoryStore } from "./memory/inMemoryStore";
import { InMemoryRunStore } from "./runs/inMemoryStore";
import { MemoryService } from "./memory/service";
import { getAgentDefinition, listAgentDefinitions } from "./registry";
import { resolveProjectContext } from "./context";
import { runAgent, AgentRuntime } from "./engine";
import { orchestrate } from "./orchestrator";

const PROJECT = "demo-project";

/** Minimal valid model outputs per agent, selected by a unique schema key. */
function fakeGenerate(prompt: string): Promise<string> {
  const has = (k: string) => prompt.includes(`"${k}"`);
  let out: unknown;
  if (has("projectSummary")) {
    out = {
      projectSummary: "Résumé du projet.",
      audience: "Jeunes créatifs urbains.",
      objectives: ["Lancer le site"],
      constraints: ["Avant septembre"],
      assumedPositioning: "Direction artistique d'intérieur.",
      needs: ["Clarté"],
      risks: ["Générique"],
      opportunities: ["Niche forte"],
      missingInfo: ["Budget"],
      decisionsMade: ["Nom validé"],
    };
  } else if (has("valueProposition")) {
    out = {
      positioning: "Positionnement défendable.",
      promise: "Un intérieur qui te ressemble.",
      valueProposition: "DA d'intérieur content-ready.",
      target: "18-35 créatifs.",
      differentiation: "Méthode, pas relooking.",
      tone: "Direct, mode.",
      keyMessages: ["Extension de ton image"],
      brandTerritories: ["Éditorial"],
    };
  } else if (has("creativeDirection")) {
    out = {
      creativeDirection: "Lifestyle éditorial à la maison.",
      visualConcepts: ["Flash photo"],
      references: ["Magazine mode"],
      palette: ["Bordeaux"],
      typography: "Grotesk",
      composition: "Cadrages proches",
      material: "Matières fortes",
      light: "Flash direct",
      iconography: "Objets de vie",
      visualPrinciples: ["Signature forte"],
      rules: ["Toujours signer"],
      avoid: ["Rendu IA lisse"],
    };
  } else if (has("sitemap")) {
    out = {
      sitemap: ["Accueil", "Méthode", "Contact"],
      pages: [{ name: "Accueil", goal: "Convertir", sections: [{ name: "Hero", goal: "Accrocher", mainCopy: "Copy", cta: "Réserver" }] }],
      userJourney: ["Arrive", "Comprend", "Réserve"],
      primaryCtas: ["Réserver un appel"],
      uxRecommendations: ["Une action par page"],
    };
  } else if (has("pillars")) {
    out = {
      pillars: ["Autorité", "Inspiration"],
      angles: ["Avant/après"],
      formats: ["Reels"],
      contentIdeas: ["Visite d'un projet"],
      calendar: [{ when: "Semaine 1", item: "Reel méthode" }],
      distribution: [{ platform: "Instagram", approach: "Reels natifs" }],
      ctas: ["DM MOODBOARD"],
      recycling: ["Reel → carrousel"],
    };
  } else if (has("adaptations")) {
    out = {
      prompts: [
        {
          title: "Hero salon",
          blocks: {
            objective: "Image hero",
            subject: "Salon éditorial",
            environment: "Appartement urbain",
            composition: "Grand angle léger",
            light: "Flash direct",
            camera: "35mm",
            material: "Velours",
            style: "Argentique",
            constraints: ["Signature marque"],
            negatives: ["Rendu lisse"],
          },
          adaptations: [{ generator: "midjourney", prompt: "editorial living room --ar 4:5" }],
        },
      ],
    };
  } else if (has("overallScore")) {
    out = {
      overallScore: 78,
      briefAlignment: { score: 80, comment: "Aligné." },
      brandCoherence: { score: 82, comment: "Cohérent." },
      creativeQuality: { score: 75, comment: "Fort." },
      clarity: { score: 77, comment: "Clair." },
      relevance: { score: 76, comment: "Pertinent." },
      risks: ["Trop de texte"],
      contradictions: [],
      priorityFixes: [{ what: "Raccourcir le hero", why: "Compréhension < 10s", target: "website-architect" }],
      verdict: "revise",
      summary: "Bon départ, à resserrer.",
    };
  } else {
    throw new Error("Rôle inconnu dans fakeGenerate");
  }
  return Promise.resolve(JSON.stringify(out));
}

function makeRuntime(memory: MemoryService, generate = fakeGenerate): AgentRuntime {
  return { memory, generate, fixedContext: "Marque test. Brief test.", projectName: "Projet Test" };
}

describe("contracts", () => {
  it("registry covers every role with a matching definition", () => {
    expect(listAgentDefinitions()).toHaveLength(AGENT_ROLES.length);
    for (const role of AGENT_ROLES) {
      expect(getAgentDefinition(role).role).toBe(role);
    }
  });

  it("ReviewResult schema enforces verdict enum", () => {
    expect(ReviewResultSchema.safeParse({}).success).toBe(false);
  });
});

describe("memory service — create, read, versioning", () => {
  it("creates and reads a structured entry", async () => {
    const svc = new MemoryService(new InMemoryStore());
    const entry = await svc.create({ projectId: PROJECT, type: "brief", source: "brief", title: "Brief", content: "Contenu" });
    expect(MemoryEntrySchema.safeParse(entry).success).toBe(true);
    expect(entry.version).toBe(1);
    const list = await svc.list(PROJECT);
    expect(list).toHaveLength(1);
  });

  it("versions agent output, superseding the prior and keeping history", async () => {
    const svc = new MemoryService(new InMemoryStore());
    const v1 = await svc.recordAgentOutput({ projectId: PROJECT, agentRole: "orbit-brain", type: "analysis", title: "A", content: "v1" });
    const v2 = await svc.recordAgentOutput({ projectId: PROJECT, agentRole: "orbit-brain", type: "analysis", title: "A", content: "v2" });
    expect(v2.version).toBe(2);
    expect(v2.supersedes).toBe(v1.id);
    const all = await svc.list(PROJECT);
    expect(all).toHaveLength(2); // history preserved
    const active = all.filter((e) => e.status !== "superseded");
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(v2.id);
  });

  it("transitions status (approve/reject)", async () => {
    const svc = new MemoryService(new InMemoryStore());
    const e = await svc.recordAgentOutput({ projectId: PROJECT, agentRole: "brand-strategist", type: "deliverable", title: "B", content: "x" });
    const approved = await svc.setStatus(e.id, "approved");
    expect(approved.status).toBe("approved");
    const rejected = await svc.setStatus(e.id, "rejected");
    expect(rejected.status).toBe("rejected");
  });
});

describe("context resolution", () => {
  it("selects dependency outputs and excludes rejected/superseded", async () => {
    const svc = new MemoryService(new InMemoryStore());
    const rejected = await svc.recordAgentOutput({ projectId: PROJECT, agentRole: "orbit-brain", type: "analysis", title: "Vieux", content: "à ignorer" });
    await svc.setStatus(rejected.id, "rejected");
    await svc.recordAgentOutput({ projectId: PROJECT, agentRole: "orbit-brain", type: "analysis", title: "Analyse", content: "analyse active" });
    const entries = await svc.list(PROJECT);
    const ctx = resolveProjectContext(PROJECT, getAgentDefinition("brand-strategist"), entries);
    expect(ctx.rendered).toContain("analyse active");
    expect(ctx.rendered).not.toContain("à ignorer");
    expect(ctx.trace.length).toBeGreaterThan(0);
  });

  it("respects the token cap and flags truncation", async () => {
    const svc = new MemoryService(new InMemoryStore());
    for (let i = 0; i < 5; i++) {
      await svc.create({ projectId: PROJECT, type: "reference", source: "user", title: `Ref ${i}`, content: "x".repeat(2000) });
    }
    const entries = await svc.list(PROJECT);
    const ctx = resolveProjectContext(PROJECT, getAgentDefinition("orbit-brain"), entries, { tokenCap: 400 });
    expect(ctx.truncated).toBe(true);
    expect(ctx.estimatedTokens).toBeLessThanOrEqual(400);
  });
});

describe("engine — single agent", () => {
  it("runs an agent and persists a validated output", async () => {
    const svc = new MemoryService(new InMemoryStore());
    const res = await runAgent({ projectId: PROJECT, role: "orbit-brain" }, makeRuntime(svc));
    expect(res.status).toBe("completed");
    expect(res.memoryEntryIds).toHaveLength(1);
    expect(res.output?.projectSummary).toBeDefined();
  });

  it("skips when a required dependency output is missing", async () => {
    const svc = new MemoryService(new InMemoryStore());
    const res = await runAgent({ projectId: PROJECT, role: "brand-strategist" }, makeRuntime(svc));
    expect(res.status).toBe("skipped");
    expect(res.error).toContain("orbit-brain");
  });

  it("fails cleanly when the model output never validates", async () => {
    const svc = new MemoryService(new InMemoryStore());
    const res = await runAgent({ projectId: PROJECT, role: "orbit-brain" }, makeRuntime(svc, () => Promise.resolve("not json")));
    expect(res.status).toBe("failed");
    expect((await svc.list(PROJECT))).toHaveLength(0);
  });
});

describe("orchestration", () => {
  it("runs the full pipeline end to end", async () => {
    const svc = new MemoryService(new InMemoryStore());
    const run = await orchestrate({ projectId: PROJECT, mode: "full" }, { runtime: makeRuntime(svc), runStore: new InMemoryRunStore() });
    expect(OrchestrationRunSchema.safeParse(run).success).toBe(true);
    expect(run.status).toBe("completed");
    expect(run.steps.map((s) => s.role)).toEqual(PIPELINE_ORDER);
    expect(run.steps.every((s) => s.status === "completed")).toBe(true);
    // One active output per producing role.
    const active = (await svc.list(PROJECT)).filter((e) => e.status !== "superseded");
    expect(active).toHaveLength(PIPELINE_ORDER.length);
  });

  it("re-running the pipeline versions rather than duplicates", async () => {
    const store = new InMemoryStore();
    const svc = new MemoryService(store);
    const rs = new InMemoryRunStore();
    await orchestrate({ projectId: PROJECT, mode: "full" }, { runtime: makeRuntime(svc), runStore: rs });
    await orchestrate({ projectId: PROJECT, mode: "full" }, { runtime: makeRuntime(svc), runStore: rs });
    const all = await svc.list(PROJECT);
    expect(all).toHaveLength(PIPELINE_ORDER.length * 2); // history kept
    const active = all.filter((e) => e.status !== "superseded");
    expect(active).toHaveLength(PIPELINE_ORDER.length); // no active duplicates
    expect(active.every((e) => e.version === 2)).toBe(true);
  });

  it("halts the chain when a step fails", async () => {
    const svc = new MemoryService(new InMemoryStore());
    // orbit-brain ok, everything else invalid → brand-strategist fails, chain stops.
    const generate = (prompt: string) =>
      prompt.includes('"projectSummary"') ? fakeGenerate(prompt) : Promise.resolve("garbage");
    const run = await orchestrate({ projectId: PROJECT, mode: "full" }, { runtime: makeRuntime(svc, generate), runStore: new InMemoryRunStore() });
    expect(run.status).toBe("failed");
    expect(run.steps[0].status).toBe("completed");
    expect(run.steps[1].status).toBe("failed");
    expect(run.steps[2].status).toBe("idle"); // never reached
  });

  it("runs a Critic-only review over existing outputs", async () => {
    const svc = new MemoryService(new InMemoryStore());
    await orchestrate({ projectId: PROJECT, mode: "full" }, { runtime: makeRuntime(svc), runStore: new InMemoryRunStore() });
    const run = await orchestrate({ projectId: PROJECT, mode: "review" }, { runtime: makeRuntime(svc), runStore: new InMemoryRunStore() });
    expect(run.status).toBe("completed");
    expect(run.steps).toHaveLength(1);
    expect(run.steps[0].role).toBe("orbit-critic");
  });
});
