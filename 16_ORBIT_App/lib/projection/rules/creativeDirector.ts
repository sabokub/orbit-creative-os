import { MemoryEntry } from "../../agents/contracts";
import { CreativeDirectorOutput } from "../../agents/definitions/creativeDirector";
import { ProjectionMutation } from "../contracts";
import { decisionMutation, RuleContext, taskMutation, truncate } from "./helpers";

/**
 * Creative Director → Studio Brain:
 *  - creativeDirection → ONE decision "Valider la direction créative" (needs confirmation).
 *  - visualConcepts[] → production tasks (auto-safe).
 */
export function projectCreativeDirector(entry: MemoryEntry, ctx: RuleContext): ProjectionMutation[] {
  const data = entry.data as CreativeDirectorOutput | undefined;
  if (!data) return [];
  const out: ProjectionMutation[] = [];

  out.push(
    decisionMutation(
      entry,
      ctx,
      "creative-direction",
      0,
      { question: "Valider la direction créative", context: data.creativeDirection, options: ["Approuver", "Réviser"] },
      { confidence: 0.75, requiresConfirmation: true, targetType: "creative-rule" }
    )
  );

  (data.visualConcepts ?? []).forEach((text, i) => {
    out.push(
      taskMutation(
        entry,
        ctx,
        "visual-concept",
        i,
        { title: `Produire l'asset : ${truncate(text)}`, description: text, category: "Création", estimateMinutes: 60, urgency: 3, impact: 4 },
        { confidence: 0.6, requiresConfirmation: false },
        "creative-rule"
      )
    );
  });

  return out;
}
