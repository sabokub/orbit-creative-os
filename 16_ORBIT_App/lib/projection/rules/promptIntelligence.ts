import { MemoryEntry } from "../../agents/contracts";
import { PromptIntelligenceOutput } from "../../agents/definitions/promptIntelligence";
import { ProjectionMutation } from "../contracts";
import { RuleContext, taskMutation } from "./helpers";

/**
 * Prompt Intelligence → Studio Brain:
 *  - prompts[] → one production task per structured prompt, description holds
 *    every per-generator adaptation, notes hold the objective block (auto-safe).
 */
export function projectPromptIntelligence(entry: MemoryEntry, ctx: RuleContext): ProjectionMutation[] {
  const data = entry.data as PromptIntelligenceOutput | undefined;
  if (!data) return [];

  return (data.prompts ?? []).map((p, i) =>
    taskMutation(
      entry,
      ctx,
      "prompt",
      i,
      {
        title: `Générer : ${p.title}`,
        description: p.adaptations.map((a) => `[${a.generator}] ${a.prompt}`).join("\n\n"),
        category: "Prompt Intelligence",
        estimateMinutes: 15,
        urgency: 2,
        impact: 3,
        notes: p.blocks.objective,
      },
      { confidence: 0.6, requiresConfirmation: false },
      "prompt"
    )
  );
}
