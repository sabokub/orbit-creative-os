import { MemoryEntry, ReviewResult } from "../../agents/contracts";
import { ProjectionMutation } from "../contracts";
import { decisionMutation, RuleContext, taskMutation, truncate } from "./helpers";

/**
 * Orbit Critic → Studio Brain:
 *  - priorityFixes[] → correction tasks (auto-safe — ADDING a task never
 *    overwrites the approved deliverable it comments on; that's the whole
 *    point: a recommendation, not a silent overwrite).
 *  - verdict === "reject" → ONE decision "Livrable rejeté — action ?" (needs
 *    confirmation, since it may lead to actually reworking something approved).
 */
export function projectOrbitCritic(entry: MemoryEntry, ctx: RuleContext): ProjectionMutation[] {
  const data = entry.data as ReviewResult | undefined;
  if (!data) return [];
  const out: ProjectionMutation[] = [];

  (data.priorityFixes ?? []).forEach((fix, i) => {
    out.push(
      taskMutation(
        entry,
        ctx,
        "fix",
        i,
        {
          title: `Corriger : ${truncate(fix.what)}`,
          description: `${fix.why}${fix.target ? ` (cible : ${fix.target})` : ""}`,
          category: "Corrections Critic",
          estimateMinutes: 30,
          urgency: 4,
          impact: 4,
        },
        { confidence: 0.7, requiresConfirmation: false },
        "critic-recommendation"
      )
    );
  });

  if (data.verdict === "reject") {
    out.push(
      decisionMutation(
        entry,
        ctx,
        "verdict",
        0,
        { question: "Livrable rejeté par Orbit Critic — action ?", context: data.summary, options: ["Réviser", "Accepter malgré tout"] },
        { confidence: 0.8, requiresConfirmation: true, targetType: "critic-recommendation" }
      )
    );
  }

  return out;
}
