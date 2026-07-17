import { MemoryEntry } from "../../agents/contracts";
import { ContentStrategistOutput } from "../../agents/definitions/contentStrategist";
import { ProjectionMutation } from "../contracts";
import { contentMutation, parseLooseDate, RuleContext, truncate } from "./helpers";

/**
 * Content Strategist → Studio Brain:
 *  - contentIdeas[] → content items, category = first pillar (auto-safe).
 *  - calendar[]     → content items with a best-effort dueDate (auto-safe).
 */
export function projectContentStrategist(entry: MemoryEntry, ctx: RuleContext): ProjectionMutation[] {
  const data = entry.data as ContentStrategistOutput | undefined;
  if (!data) return [];
  const out: ProjectionMutation[] = [];

  (data.contentIdeas ?? []).forEach((text, i) => {
    out.push(
      contentMutation(
        entry,
        ctx,
        "idea",
        i,
        { title: truncate(text), description: text, category: data.pillars?.[0] ?? "Contenu", estimateMinutes: 30, urgency: 2, impact: 3 },
        { confidence: 0.65, requiresConfirmation: false },
        "content-idea"
      )
    );
  });

  (data.calendar ?? []).forEach((slot, i) => {
    out.push(
      contentMutation(
        entry,
        ctx,
        "calendar",
        i,
        {
          title: truncate(slot.item),
          description: `Prévu : ${slot.when}`,
          category: "Calendrier",
          estimateMinutes: 30,
          urgency: 2,
          impact: 3,
          dueDate: parseLooseDate(slot.when),
        },
        { confidence: 0.6, requiresConfirmation: false },
        "content"
      )
    );
  });

  return out;
}
