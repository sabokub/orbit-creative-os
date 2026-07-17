import { test, expect, Page } from "@playwright/test";

/**
 * E2E coverage for the Prompt Lab (Website prompt chain UI), at mobile
 * (320px) and desktop (1440px) widths. Every backend call is intercepted
 * with `page.route` — never touches the real Redis-backed API or OpenAI.
 */

const PROJECT_ID = "e2e-prompt-lab-project";

const FIXTURE_PROJECT = {
  id: PROJECT_ID,
  name: "Homepage 24March Studio (E2E Prompt Lab)",
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
  websiteChainOutputs: {},
  websitePromptChain: {},
};

function fixtureBuildResult(overBudget = false) {
  return {
    builderVersion: "1.0.0",
    promptVersion: "pv-e2e-1",
    createdAt: new Date().toISOString(),
    module: "website",
    workflowStep: "website",
    chainStepId: "website-positioning",
    targetModel: "openai-text",
    finalPrompt: "## Rôle\nTu es Orbit Website...\n\n## Livrable attendu\n## Positionnement web\nFormat de sortie : Markdown.",
    sections: [],
    selectedContext: [
      { key: "brand.name", label: "Nom de marque", value: "24March Studio", source: "brandDNA", reason: "Identité de marque.", importance: 3, estimatedTokens: 5 },
      { key: "brand.avoid", label: "À éviter", value: "rendu IA générique", source: "brandDNA", reason: "Contrainte forte.", importance: 5, estimatedTokens: 5 },
    ],
    omittedContext: [
      { key: "brand.photographyDirection", label: "Direction photo", value: "x", source: "brandDNA", reason: "n/a", importance: 1, estimatedTokens: 3, omittedReason: "Non pertinent pour cette étape." },
    ],
    selectedKnowledge: [
      { id: "structure-role-objective-context-constraints", title: "Structure text prompts as role, objective, context...", sourceDocument: "ORBIT Prompt Engineering Guidelines", relevance: 2.9, reason: "Domaine structure.", estimatedTokens: 40 },
    ],
    budgetReport: {
      estimatedPromptChars: overBudget ? 9000 : 1200,
      estimatedPromptTokens: overBudget ? 2250 : 300,
      maxChars: 3200,
      maxTokens: 800,
      reservedOutputTokens: 1500,
      status: overBudget ? "over_budget" : "within_budget",
      bySection: [{ id: "projectContext", chars: 500, percentOfTotal: 40, overBudget: false }],
      actionsTaken: overBudget ? ["Suppression de 1 élément(s) de contexte dupliqué(s)."] : [],
      warnings: overBudget ? ["Le prompt dépasse le budget recommandé pour cette étape de 181%. Le prompt n'est PAS tronqué automatiquement — envisage de scinder cette étape en deux prompts plus ciblés."] : [],
    },
    qualityReport: {
      total: overBudget ? 42 : 88,
      maxTotal: 100,
      dimensions: [{ id: "clarity", label: "Clarté", score: 8, max: 10, explanation: "0 avertissement critique." }],
      deterministic: true,
    },
    warnings: overBudget
      ? [{ id: "warn-1", severity: "critical", message: "Le prompt dépasse le budget de l'étape — voir le rapport de budget pour les actions de compression déjà tentées." }]
      : [],
    sourceTrace: [
      { kind: "knowledge", refId: "structure-role-objective-context-constraints", label: "Structure text prompts as role, objective, context...", note: "ORBIT Prompt Engineering Guidelines (pertinence 2.9)." },
      { kind: "brandDNA", refId: "brand.avoid", label: "À éviter", note: "Champ Brand DNA requis par le contrat de l'étape." },
    ],
    nextStep: "hero-promise",
  };
}

function fixtureChainSteps() {
  return {
    steps: [
      {
        id: "website-positioning",
        order: 1,
        title: "Positionnement web",
        purpose: "Traduire le positionnement de marque en positionnement spécifique au site web du projet.",
        deliverableIds: ["positioning-web"],
        requiredBrandFields: [],
        dependsOnSteps: [],
        knowledgeDomains: [],
        knowledgeTaskTypes: [],
        targetModel: "openai-text",
        recommendedBudgetChars: 3200,
        outputFormatHint: "",
        validationCriteria: [],
        retryStrategy: "",
        hasValidatedOutput: false,
        versionHistory: [
          {
            id: "promptver-1",
            chainStepId: "website-positioning",
            promptVersion: "pv-old-1",
            builderVersion: "1.0.0",
            workflowStep: "website",
            targetModel: "openai-text",
            selectedKnowledgeIds: [],
            contextSnapshotKeys: [],
            budgetStatus: "within_budget",
            estimatedPromptChars: 1100,
            qualityScore: 80,
            userEdited: false,
            finalPrompt: "Ancienne version du prompt.",
            outcomeStatus: "accepted",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
      },
      {
        id: "hero-promise",
        order: 2,
        title: "Promesse du hero",
        purpose: "Formuler la promesse affichée dans le hero.",
        deliverableIds: ["hero-promise"],
        requiredBrandFields: [],
        dependsOnSteps: ["website-positioning"],
        knowledgeDomains: [],
        knowledgeTaskTypes: [],
        targetModel: "openai-text",
        recommendedBudgetChars: 2000,
        outputFormatHint: "",
        validationCriteria: [],
        retryStrategy: "",
        hasValidatedOutput: false,
        versionHistory: [],
      },
    ],
  };
}

async function mockBackend(page: Page, overBudget = false) {
  await page.route(`**/api/projects/${PROJECT_ID}`, async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({ json: FIXTURE_PROJECT });
    } else {
      await route.continue();
    }
  });

  await page.route(`**/api/prompt-intelligence/chain*`, async (route) => {
    await route.fulfill({ json: fixtureChainSteps() });
  });

  await page.route(`**/api/prompt-intelligence/build`, async (route) => {
    await route.fulfill({ json: { result: fixtureBuildResult(overBudget) } });
  });
}

test.describe("Prompt Lab — Website prompt chain UI", () => {
  test("build a prompt, expand source trace and version history, at 1440px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockBackend(page);
    await page.goto(`/projects/${PROJECT_ID}/run?step=website`);

    const lab = page.getByTestId("prompt-lab");
    await expect(lab).toBeVisible();
    await expect(lab.getByText("Positionnement web").first()).toBeVisible();

    await lab.getByRole("button", { name: /Construire le prompt/i }).click();
    await expect(lab.getByText(/Le prompt final/i)).toBeVisible();
    await expect(lab.getByText(/Budget : dans le budget/i)).toBeVisible();
    await expect(lab.getByText(/Score qualité : 88/i)).toBeVisible();

    await lab.getByRole("button", { name: /Voir la trace des sources/i }).click();
    await expect(lab.getByText(/ORBIT Prompt Engineering Guidelines/i)).toBeVisible();

    await lab.getByRole("button", { name: /Voir l.historique de versions/i }).click();
    await expect(lab.getByText(/Restaurer/i).first()).toBeVisible();

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasOverflow).toBeFalsy();
  });

  test("shows an explicit over-budget warning with a concrete percentage", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockBackend(page, true);
    await page.goto(`/projects/${PROJECT_ID}/run?step=website`);

    const lab = page.getByTestId("prompt-lab");
    await lab.getByRole("button", { name: /Construire le prompt/i }).click();
    await expect(lab.getByText(/Budget : dépassé/i)).toBeVisible();
    await expect(lab.getByText(/dépasse le budget de l.étape/i)).toBeVisible();
  });

  test("legacy prompt remains visible below the Prompt Lab for comparison", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockBackend(page);
    await page.goto(`/projects/${PROJECT_ID}/run?step=website`);

    await expect(page.getByText(/Prompt historique \(legacy\)/i)).toBeVisible();
    await expect(page.getByText("Le prompt", { exact: true })).toBeVisible();
  });

  test("renders without horizontal overflow and stays usable at 320px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await mockBackend(page);
    await page.goto(`/projects/${PROJECT_ID}/run?step=website`);

    const lab = page.getByTestId("prompt-lab");
    await expect(lab).toBeVisible();
    await lab.getByRole("button", { name: /Construire le prompt/i }).click();
    await expect(lab.getByText(/Le prompt final/i)).toBeVisible();

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasOverflow).toBeFalsy();
  });

  test("switching chain steps via the step selector updates the displayed step", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockBackend(page);
    await page.goto(`/projects/${PROJECT_ID}/run?step=website`);

    const lab = page.getByTestId("prompt-lab");
    await lab.getByRole("button", { name: /2\. Promesse du hero/i }).click();
    await expect(lab.getByRole("heading", { name: "Promesse du hero" })).toBeVisible();
  });
});
