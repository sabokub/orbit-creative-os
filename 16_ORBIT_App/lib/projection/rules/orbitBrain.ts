import { MemoryEntry } from "../../agents/contracts";
import { OrbitBrainOutput } from "../../agents/definitions/orbitBrain";
import { ProjectionMutation } from "../contracts";
import { decisionMutation, RuleContext, taskMutation, truncate } from "./helpers";

/**
 * Orbit Brain → Studio Brain:
 *  - missingInfo[]   → clarification tasks (auto-safe: additive, no risk)
 *  - risks[]         → decisions "Traiter / Accepter le risque" (needs confirmation)
 *  - decisionsMade[] → decisions auto-resolved as "Confirmé" (informational record, auto-safe)
 * constraints/objectives/opportunities stay in agent memory only (read by other
 * agents' context) — projecting every field would flood Studio Brain with
 * non-actionable noise; this set is the actionable subset.
 */
export function projectOrbitBrain(entry: MemoryEntry, ctx: RuleContext): ProjectionMutation[] {
  const data = entry.data as OrbitBrainOutput | undefined;
  if (!data) return [];
  const out: ProjectionMutation[] = [];

  (data.missingInfo ?? []).forEach((text, i) => {
    out.push(
      taskMutation(
        entry,
        ctx,
        "missing-info",
        i,
        { title: `Clarifier : ${truncate(text)}`, description: text, category: "Clarification", estimateMinutes: 15, urgency: 3, impact: 2 },
        { confidence: 0.7, requiresConfirmation: false }
      )
    );
  });

  (data.risks ?? []).forEach((text, i) => {
    out.push(
      decisionMutation(
        entry,
        ctx,
        "risk",
        i,
        { question: `Risque à traiter : ${truncate(text)}`, context: text, options: ["Traiter", "Accepter le risque"] },
        { confidence: 0.6, requiresConfirmation: true, targetType: "risk" }
      )
    );
  });

  (data.decisionsMade ?? []).forEach((text, i) => {
    out.push(
      decisionMutation(
        entry,
        ctx,
        "decision-made",
        i,
        { question: truncate(text), context: "Déjà décidé (issu d'Orbit Brain).", options: ["Confirmé"], autoResolve: "Confirmé" },
        { confidence: 0.9, requiresConfirmation: false, targetType: "decision" }
      )
    );
  });

  return out;
}
