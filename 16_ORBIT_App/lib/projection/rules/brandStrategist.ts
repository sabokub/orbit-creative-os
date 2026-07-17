import { MemoryEntry } from "../../agents/contracts";
import { BrandStrategistOutput } from "../../agents/definitions/brandStrategist";
import { ProjectionMutation } from "../contracts";
import { decisionMutation, RuleContext, taskMutation, truncate } from "./helpers";

/**
 * Brand Strategist → Studio Brain:
 *  - positioning/promise/valueProposition → ONE decision "Valider le
 *    positionnement de marque" (strategic, always needs confirmation).
 *  - keyMessages[] → production tasks (auto-safe: additive, no risk).
 */
export function projectBrandStrategist(entry: MemoryEntry, ctx: RuleContext): ProjectionMutation[] {
  const data = entry.data as BrandStrategistOutput | undefined;
  if (!data) return [];
  const out: ProjectionMutation[] = [];

  out.push(
    decisionMutation(
      entry,
      ctx,
      "positioning",
      0,
      {
        question: "Valider le positionnement de marque",
        context: `${data.positioning}\n\nPromesse : ${data.promise}\nProposition de valeur : ${data.valueProposition}`,
        options: ["Approuver", "Réviser"],
      },
      { confidence: 0.75, requiresConfirmation: true, targetType: "brand-element" }
    )
  );

  (data.keyMessages ?? []).forEach((text, i) => {
    out.push(
      taskMutation(
        entry,
        ctx,
        "key-message",
        i,
        { title: `Diffuser le message : ${truncate(text)}`, description: text, category: "Marque", estimateMinutes: 20, urgency: 2, impact: 3 },
        { confidence: 0.6, requiresConfirmation: false },
        "brand-element"
      )
    );
  });

  return out;
}
