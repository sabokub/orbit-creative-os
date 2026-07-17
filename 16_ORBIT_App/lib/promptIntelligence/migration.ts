import { WorkflowStep } from "../types";

/**
 * Migration / adapter notes (issue #13, section 17). Nothing is deleted:
 *
 * - `lib/prompts.ts` (`buildPrompt`, `TEMPLATES`, `detectReviewStatus`) is
 *   untouched and still exported. Strategy, Creative, Content, Images and
 *   Review keep using it exactly as before — old prompt buttons/behavior
 *   keep working unmodified.
 * - Only the Website workflow step gains a second, additive path: the
 *   modular chain in `lib/promptIntelligence/`. The legacy monolithic
 *   Website prompt (`buildPrompt("website", ...)`) remains fully callable
 *   and viewable — see `isLegacyPromptAvailable` below — so a user can
 *   compare the legacy prompt against an optimized chain-step prompt.
 * - Old saved outputs (`Project.outputs.website`, created before this PR)
 *   remain exactly as they were: `GeneratedOutput` is untouched, and
 *   nothing here requires a saved output to have gone through the chain.
 *   `Project` only gains one new *optional* field
 *   (`websitePromptChain`, see `lib/types.ts`) for chain-step prompt
 *   history — absent entirely on projects that never used the chain.
 * - There is no destructive migration script: a project created before this
 *   PR simply has `websitePromptChain: undefined` and behaves exactly as it
 *   did before; the chain UI treats that as "no chain history yet", not an
 *   error.
 */

export function isLegacyPromptAvailable(step: WorkflowStep): boolean {
  // Legacy lib/prompts.ts templates cover every workflow step, always.
  return ["strategy", "creative", "website", "content", "images", "review"].includes(step);
}

export const MIGRATION_NOTE =
  "Le prompt historique (lib/prompts.ts) reste disponible et fonctionnel pour toutes les étapes, y compris Website. La chaîne modulaire est une option additionnelle, pas un remplacement destructif.";
