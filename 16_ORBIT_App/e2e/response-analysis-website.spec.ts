import { test, expect, Page } from "@playwright/test";

/**
 * E2E coverage for the response-analysis pipeline on the Website workflow
 * runner (manual-paste path), at mobile (320px) and desktop (1440px)
 * widths. All backend calls are intercepted with `page.route` — this test
 * never touches the real Redis-backed API or OpenAI, matching the rest of
 * the suite's "mock the network everywhere" rule.
 */

const PROJECT_ID = "e2e-website-project";

const FIXTURE_PROJECT = {
  id: PROJECT_ID,
  name: "Homepage 24March Studio (E2E)",
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

function fixtureAnalysis() {
  return {
    id: "analysis-e2e-1",
    projectId: PROJECT_ID,
    workflowStep: "website",
    source: "manual",
    createdAt: new Date().toISOString(),
    documentType: "website",
    documentTypeConfidence: 1,
    matchesExpectedModule: true,
    rawResponse: "## Positionnement web\nTexte de positionnement suffisamment long pour être jugé complet par le pipeline.",
    normalizedResponse: "## Positionnement web\nTexte de positionnement suffisamment long pour être jugé complet par le pipeline.",
    summary: "11 livrable(s) complet(s) sur 13, 1 partiel(s), 1 manquant(s), 4 CTA détecté(s).",
    completenessScore: 84,
    qualityScore: 70,
    exploitability: "needs_edits",
    brandCoherence: { score: 75, issues: [] },
    briefCoherence: { score: 80, issues: [] },
    semanticAnalysisPerformed: false,
    semanticAnalysisError: "Aucune clé OpenAI configurée — analyse structurelle uniquement.",
    expectedDeliverables: ["positioning-web", "faq"],
    detectedDeliverables: [
      { id: "positioning-web", label: "Positionnement web", status: "complete", reasons: [] },
      { id: "faq", label: "FAQ (5-8 Q/R)", status: "missing", reasons: ["Le titre FAQ existe mais aucune paire question/réponse n'a été détectée."] },
    ],
    missingDeliverables: ["faq"],
    partialDeliverables: [],
    extractedEntities: {},
    extractedTasks: [],
    extractedDecisions: [],
    extractedDependencies: [],
    extractedContent: [],
    extractedPages: ["Accueil", "Méthode", "Offres"],
    extractedSections: [],
    extractedCTAs: [{ text: "Réserve ton audit", vague: false }],
    extractedFAQ: [],
    extractedSEO: null,
    extractedImageDirections: [],
    extractedImagePrompts: [],
    warnings: ["Le titre FAQ existe mais aucune paire question/réponse n'a été détectée."],
    contradictions: [],
    placeholders: [],
    recommendedNextActions: ['Compléter le livrable manquant : "FAQ (5-8 Q/R)"'],
    proposedStudioBrainChanges: [
      {
        id: "proposal-0",
        kind: "create_task",
        description: 'Créer une tâche : Compléter "FAQ (5-8 Q/R)" (Site internet)',
        payload: { title: 'Compléter "FAQ (5-8 Q/R)" (Site internet)' },
        accepted: true,
      },
    ],
  };
}

async function mockBackend(page: Page) {
  await page.route(`**/api/projects/${PROJECT_ID}`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: FIXTURE_PROJECT });
    } else {
      await route.continue();
    }
  });

  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      json: {
        analysis: fixtureAnalysis(),
        versionDiff: { hasPreviousVersion: false, addedSections: [], removedSections: [], changedSections: [], lengthDelta: 0, significant: false },
      },
    });
  });

  await page.route("**/api/analyze/apply", async (route) => {
    await route.fulfill({
      json: {
        project: { ...FIXTURE_PROJECT, outputs: { website: { step: "website", content: fixtureAnalysis().rawResponse, created_at: new Date().toISOString(), analysis: fixtureAnalysis(), studioBrainApplied: true } } },
        applyResult: { createdTaskIds: ["task-e2e-1"], completedTaskIds: [], createdDecisionIds: [], skipped: [] },
      },
    });
  });
}

test.describe("Website workflow — manual paste through the response-analysis pipeline", () => {
  test("paste, analyze, review scores/deliverables, then validate — at 1440px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockBackend(page);
    await page.goto(`/projects/${PROJECT_ID}/run?step=website`);

    const textarea = page.getByPlaceholder(/Colle ou génère le livrable ici/i);
    await textarea.fill("## Positionnement web\nTexte de positionnement suffisamment long pour être jugé complet par le pipeline.");

    await page.getByRole("button", { name: /Analyser la réponse/i }).click();

    const review = page.getByTestId("analysis-review");
    await expect(review).toBeVisible();
    await expect(review.getByText(/Positionnement web/i)).toBeVisible();
    await expect(review.getByText("Manquant", { exact: true })).toBeVisible();
    await expect(review).toContainText("84%");

    await page.getByRole("button", { name: /Examiner et intégrer/i }).click();
    await expect(page.getByText(/Projet mis à jour/i)).toBeVisible();

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasOverflow).toBeFalsy();
  });

  test("renders without horizontal overflow and stays usable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await mockBackend(page);
    await page.goto(`/projects/${PROJECT_ID}/run?step=website`);

    const textarea = page.getByPlaceholder(/Colle ou génère le livrable ici/i);
    await expect(textarea).toBeVisible();
    await textarea.fill("## Positionnement web\nTexte de positionnement suffisamment long pour être jugé complet par le pipeline.");

    await page.getByRole("button", { name: /Analyser la réponse/i }).click();
    await expect(page.getByTestId("analysis-review")).toBeVisible();

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasOverflow).toBeFalsy();
  });
});
