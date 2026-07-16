import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyzeOrbitResponse } from "./analyze";
import { FULL_WEBSITE_RESPONSE, TEST_BRAND, TEST_BRIEF } from "./analyze.fixtures";
import { StudioItem } from "../types";

function baseInput(overrides: Partial<Parameters<typeof analyzeOrbitResponse>[0]> = {}) {
  return {
    projectId: "project-1",
    projectName: "Homepage 24March Studio",
    workflowStep: "website" as const,
    rawResponse: FULL_WEBSITE_RESPONSE,
    source: "manual" as const,
    skipSemanticAnalysis: true, // structural-only unless a test explicitly exercises the AI path
    ...overrides,
  };
}

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
});

describe("analyzeOrbitResponse — pipeline", () => {
  it("marks every deliverable complete for a fully-formed website response, and reflects that in the summary/score", async () => {
    const result = await analyzeOrbitResponse(baseInput(), TEST_BRAND, TEST_BRIEF, []);
    expect(result.documentType).toBe("website");
    expect(result.matchesExpectedModule).toBe(true);
    expect(result.missingDeliverables).toHaveLength(0);
    expect(result.completenessScore).toBe(100);
    expect(result.detectedDeliverables).toHaveLength(13);
    expect(result.summary).toContain("13 livrable(s) complet(s) sur 13");
  });

  it("is honest about semantic analysis not running when no API key is configured (never fakes a quality score)", async () => {
    const result = await analyzeOrbitResponse(
      { ...baseInput(), skipSemanticAnalysis: false },
      TEST_BRAND,
      TEST_BRIEF,
      []
    );
    expect(result.semanticAnalysisPerformed).toBe(false);
    expect(result.semanticAnalysisError).toBeTruthy();
    expect(result.warnings.some((w) => w.toLowerCase().includes("clé openai"))).toBe(true);
  });

  it("handles an empty response without throwing: everything missing, explicit warning, zero score", async () => {
    const result = await analyzeOrbitResponse(baseInput({ rawResponse: "" }), TEST_BRAND, TEST_BRIEF, []);
    expect(result.completenessScore).toBe(0);
    expect(result.missingDeliverables).toHaveLength(13);
    expect(result.warnings.some((w) => w.includes("vide"))).toBe(true);
  });

  it("truncates and warns on a very long response instead of failing", async () => {
    const huge = FULL_WEBSITE_RESPONSE + "\n\n## Notes\n" + "x ".repeat(70_000);
    const result = await analyzeOrbitResponse(baseInput({ rawResponse: huge }), TEST_BRAND, TEST_BRIEF, []);
    expect(result.rawResponse.length).toBeLessThan(huge.length);
    expect(result.warnings.some((w) => w.includes("taille maximale"))).toBe(true);
  });

  it("flags a wrong-module response with a warning instead of silently blocking it", async () => {
    const contentResponse = `## Piliers de contenu\nTexte.\n## Formats récurrents\nTexte.\n## Idées de publications\nTexte.\n## Idées de reels\nTexte.\n## Accroches\nTexte.\n## Captions\nTexte.\n## Calendrier 30 jours\nTexte.\n## Logique de réutilisation\nTexte.\n## Objectifs par canal\nTexte.`;
    const result = await analyzeOrbitResponse(baseInput({ rawResponse: contentResponse }), TEST_BRAND, TEST_BRIEF, []);
    expect(result.matchesExpectedModule).toBe(false);
    expect(result.warnings.some((w) => w.includes("module"))).toBe(true);
  });

  it("detects placeholder-only sections as missing, not complete", async () => {
    const withPlaceholder = FULL_WEBSITE_RESPONSE.replace(
      /## Promesse du hero\n[\s\S]*?\n\n/,
      "## Promesse du hero\nà compléter\n\n"
    );
    const result = await analyzeOrbitResponse(baseInput({ rawResponse: withPlaceholder }), TEST_BRAND, TEST_BRIEF, []);
    const hero = result.detectedDeliverables.find((d) => d.id === "hero-promise");
    expect(hero?.status).toBe("missing");
    expect(result.placeholders.length).toBeGreaterThan(0);
  });

  it("extracts tasks from a 'prochaines actions' section and proposes them as create_task changes", async () => {
    const withActions = FULL_WEBSITE_RESPONSE + "\n\n## Prochaines actions\n- Valider le ton avec le client\n- Préparer les visuels hero";
    const result = await analyzeOrbitResponse(baseInput({ rawResponse: withActions }), TEST_BRAND, TEST_BRIEF, []);
    expect(result.extractedTasks.map((t) => t.title)).toContain("Valider le ton avec le client");
    expect(result.proposedStudioBrainChanges.some((c) => c.description.includes("Valider le ton avec le client"))).toBe(true);
  });

  it("does not propose a duplicate task when an equivalent active Studio Brain task already exists (dedupe by folded title)", async () => {
    const withActions = FULL_WEBSITE_RESPONSE + "\n\n## Prochaines actions\n- Valider le ton avec le client";
    const existing: StudioItem[] = [
      {
        id: "task-1",
        kind: "task",
        title: "Valider le ton avec le client",
        description: "",
        status: "backlog",
        order: 0,
        category: "Général",
        estimateMinutes: 30,
        urgency: 3,
        impact: 3,
        launchCritical: false,
        dependsOn: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    const result = await analyzeOrbitResponse(baseInput({ rawResponse: withActions }), TEST_BRAND, TEST_BRIEF, existing);
    expect(result.proposedStudioBrainChanges.some((c) => c.description.includes("Valider le ton avec le client"))).toBe(false);
  });

  it("is idempotent: analyzing the same response twice yields the same extracted tasks and dedupe keys", async () => {
    const withActions = FULL_WEBSITE_RESPONSE + "\n\n## Prochaines actions\n- Préparer les visuels hero";
    const first = await analyzeOrbitResponse(baseInput({ rawResponse: withActions }), TEST_BRAND, TEST_BRIEF, []);
    const second = await analyzeOrbitResponse(baseInput({ rawResponse: withActions }), TEST_BRAND, TEST_BRIEF, []);
    expect(first.extractedTasks).toEqual(second.extractedTasks);
    expect(first.completenessScore).toBe(second.completenessScore);
  });

  it("proposes marking the module complete when every deliverable is complete", async () => {
    const result = await analyzeOrbitResponse(baseInput(), TEST_BRAND, TEST_BRIEF, []);
    expect(result.proposedStudioBrainChanges.some((c) => c.kind === "complete_task")).toBe(true);
  });
});

describe("analyzeOrbitResponse — semantic analysis path (mocked OpenAI, never a real network call)", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("uses the Zod-validated semantic result when the mocked model returns valid JSON", async () => {
    vi.doMock("../openai", () => ({
      generateJSONWithOpenAI: vi.fn().mockResolvedValue(
        JSON.stringify({
          qualityScore: 82,
          brandCoherenceScore: 90,
          brandCoherenceIssues: [],
          briefCoherenceScore: 88,
          briefCoherenceIssues: [],
          contradictions: [],
          toneMismatch: false,
          vagueCtas: [],
          weakImagePrompts: [],
          recommendations: ["Ajouter une preuve chiffrée dans le hero."],
          summary: "Livrable solide et cohérent avec la marque.",
        })
      ),
    }));
    const { analyzeOrbitResponse: analyze } = await import("./analyze");
    const result = await analyze(baseInput({ skipSemanticAnalysis: false }), TEST_BRAND, TEST_BRIEF, []);
    expect(result.semanticAnalysisPerformed).toBe(true);
    expect(result.qualityScore).toBe(82);
    expect(result.brandCoherence.score).toBe(90);
    expect(result.summary).toBe("Livrable solide et cohérent avec la marque.");
  });

  it("retries once on invalid JSON, then falls back gracefully without faking a score if both attempts fail", async () => {
    vi.doMock("../openai", () => ({
      generateJSONWithOpenAI: vi.fn().mockResolvedValue("not valid json"),
    }));
    const { analyzeOrbitResponse: analyze } = await import("./analyze");
    const result = await analyze(baseInput({ skipSemanticAnalysis: false }), TEST_BRAND, TEST_BRIEF, []);
    expect(result.semanticAnalysisPerformed).toBe(false);
    expect(result.semanticAnalysisError).toBeTruthy();
    // Falls back to the deterministic structural estimate, not a fabricated AI score.
    expect(result.qualityScore).toBe(100);
  });
});
