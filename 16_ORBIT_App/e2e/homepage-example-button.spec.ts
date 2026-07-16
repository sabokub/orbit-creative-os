import { test, expect } from "@playwright/test";

/**
 * E2E coverage for the "Charger l'exemple de homepage" button on the new
 * project intake form (Task 2 of the UX correction pass), against a real
 * production build/server rather than a mocked component.
 */
test.describe("Charger l'exemple de homepage", () => {
  test("loads the example brief into the form", async ({ page }) => {
    await page.goto("/projects/new");

    const nameInput = page.getByPlaceholder("Ex. Campagne de lancement 24March Studio");
    await expect(nameInput).toHaveValue("");

    await page.getByRole("button", { name: /Charger l.exemple de homepage/i }).click();

    await expect(nameInput).toHaveValue("Homepage 24March Studio");
    await expect(page.getByPlaceholder("Qu’est-ce que ce projet doit accomplir ?")).toHaveValue(
      "Créer la structure et les textes de la homepage du site."
    );
  });

  test("double-clicking does not duplicate the loaded data", async ({ page }) => {
    await page.goto("/projects/new");

    const button = page.getByRole("button", { name: /Charger l.exemple de homepage/i });
    await button.dblclick();

    const nameInput = page.getByPlaceholder("Ex. Campagne de lancement 24March Studio");
    await expect(nameInput).toHaveValue("Homepage 24March Studio");
  });

  test("homepage renders without horizontal overflow at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(hasOverflow).toBeFalsy();
  });
});
