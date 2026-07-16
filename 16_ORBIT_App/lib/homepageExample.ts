import { CreateProjectInput } from "./storage";

/**
 * The real 24March homepage brief, offered as a one-click starting point on
 * the "new project" intake form so nobody has to face a blank page.
 */
export const HOMEPAGE_EXAMPLE_BRIEF: CreateProjectInput = {
  name: "Homepage 24March Studio",
  workflowType: "website",
  projectGoal: "Créer la structure et les textes de la homepage du site.",
  specificContext:
    "Le site doit présenter le studio, sa méthode, ses offres, son univers visuel, et donner envie de réserver un audit ou une prestation.",
  deliverableType: "Homepage complète avec hero, sections, CTA, FAQ et prompts image.",
  references: "Luxe éditorial chic, collage scrapbook premium, intérieurs habités et désirables.",
  constraints: "Pas de rendu SaaS, pas de beige archi générique, pas de packs ni d'ambiances.",
  channels: "Site internet",
  format: "Markdown",
  successCriteria:
    "Le visiteur pense d'abord : ‘Je veux vivre là’, puis : ‘J'ai besoin de ce studio’.",
};

/**
 * Loads the homepage example brief. Kept async (rather than a plain
 * constant read) so it behaves like any other data source the intake form
 * might eventually pull from, and so callers exercise a real loading +
 * error path instead of assuming a synchronous read can never fail.
 *
 * Returns a fresh shallow copy every time — callers must never get back a
 * shared reference to the module-level constant, otherwise editing the
 * loaded form could mutate the canonical example for the rest of the app.
 */
export async function loadHomepageExampleBrief(): Promise<CreateProjectInput> {
  if (!HOMEPAGE_EXAMPLE_BRIEF || !HOMEPAGE_EXAMPLE_BRIEF.name.trim()) {
    throw new Error("Exemple de homepage introuvable.");
  }
  return { ...HOMEPAGE_EXAMPLE_BRIEF };
}
