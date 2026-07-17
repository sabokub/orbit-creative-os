import { MemoryEntry } from "../../agents/contracts";
import { WebsiteArchitectOutput } from "../../agents/definitions/websiteArchitect";
import { ProjectionMutation } from "../contracts";
import { decisionMutation, RuleContext, taskMutation } from "./helpers";

/**
 * Website Architect → Studio Brain:
 *  - sitemap → ONE decision "Valider le sitemap" (needs confirmation).
 *  - pages[] → launch-critical production tasks, one per page (auto-safe:
 *    building a page doesn't destroy anything; the sitemap decision gates the
 *    overall direction).
 */
export function projectWebsiteArchitect(entry: MemoryEntry, ctx: RuleContext): ProjectionMutation[] {
  const data = entry.data as WebsiteArchitectOutput | undefined;
  if (!data) return [];
  const out: ProjectionMutation[] = [];

  out.push(
    decisionMutation(
      entry,
      ctx,
      "sitemap",
      0,
      { question: "Valider le sitemap", context: data.sitemap.join(" · "), options: ["Approuver", "Réviser"] },
      { confidence: 0.7, requiresConfirmation: true, targetType: "page-architecture" }
    )
  );

  (data.pages ?? []).forEach((page, i) => {
    out.push(
      taskMutation(
        entry,
        ctx,
        "page",
        i,
        {
          title: `Construire la page : ${page.name}`,
          description: `${page.goal}\n\nSections : ${page.sections.map((s) => s.name).join(", ") || "—"}`,
          category: "Site web",
          estimateMinutes: 90,
          urgency: 4,
          impact: 5,
          launchCritical: true,
        },
        { confidence: 0.7, requiresConfirmation: false },
        "deliverable"
      )
    );
  });

  return out;
}
