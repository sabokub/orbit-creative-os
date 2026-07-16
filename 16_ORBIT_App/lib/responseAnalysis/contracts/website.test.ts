import { describe, expect, it } from "vitest";
import { extractSections, normalizeResponse } from "../markdown";
import { WEBSITE_CONTRACT } from "./website";
import { findMatchingSection } from "./types";
import { foldText } from "../markdown";

/**
 * Per-deliverable completeness criteria for the Website contract (13
 * deliverables from WEBSITE_TEMPLATE in lib/prompts.ts). The core invariant
 * under test: a heading existing is never sufficient on its own — content
 * must clear a real minimum bar, and a "FAQ" heading with zero Q/A pairs
 * must be reported missing, never complete.
 */

function evaluateAll(markdown: string) {
  const sections = extractSections(normalizeResponse(markdown));
  return WEBSITE_CONTRACT.deliverables.map((spec) => {
    const section = findMatchingSection(sections, spec.headingKeywords, foldText);
    return { id: spec.id, ...spec.evaluate(section, normalizeResponse(markdown)) };
  });
}

describe("Website module contract — completeness criteria", () => {
  it("reports every deliverable missing when the response is empty", () => {
    const results = evaluateAll("");
    expect(results.every((r) => r.status === "missing")).toBe(true);
    expect(results).toHaveLength(13);
  });

  it("FAQ heading with no Q/A pairs is missing, not complete", () => {
    const results = evaluateAll("## FAQ\nCette section sera complétée plus tard.");
    const faq = results.find((r) => r.id === "faq");
    expect(faq?.status).toBe("missing");
  });

  it("FAQ with 3 Q/A pairs is partial (below the 5 minimum)", () => {
    const md = `## FAQ\n**Q: A ?**\n**R: Réponse A.**\n**Q: B ?**\n**R: Réponse B.**\n**Q: C ?**\n**R: Réponse C.**`;
    const results = evaluateAll(md);
    expect(results.find((r) => r.id === "faq")?.status).toBe("partial");
  });

  it("FAQ with 5+ Q/A pairs is complete", () => {
    const qas = Array.from({ length: 5 }, (_, i) => `**Q: Question ${i} ?**\n**R: Réponse détaillée numéro ${i}.**`).join("\n");
    const results = evaluateAll(`## FAQ\n${qas}`);
    expect(results.find((r) => r.id === "faq")?.status).toBe("complete");
  });

  it("a section containing only placeholder text is missing, not partial", () => {
    const results = evaluateAll("## Positionnement web\nà compléter");
    expect(results.find((r) => r.id === "positioning-web")?.status).toBe("missing");
  });

  it("Arborescence with fewer than 3 pages is partial", () => {
    const results = evaluateAll("## Arborescence\n- Accueil\n- Contact");
    expect(results.find((r) => r.id === "sitemap")?.status).toBe("partial");
  });

  it("Arborescence with 3+ pages is complete", () => {
    const results = evaluateAll("## Arborescence\n- Accueil\n- Services\n- À propos\n- Contact");
    expect(results.find((r) => r.id === "sitemap")?.status).toBe("complete");
  });

  it("Appels à l'action: fewer than 2 CTAs is partial, all-vague CTAs is partial", () => {
    const oneOnly = evaluateAll("## Appels à l’action\n- Réserve ton audit");
    expect(oneOnly.find((r) => r.id === "ctas")?.status).toBe("partial");

    const allVague = evaluateAll("## Appels à l’action\n- Cliquez ici\n- En savoir plus");
    expect(allVague.find((r) => r.id === "ctas")?.status).toBe("partial");

    const good = evaluateAll("## Appels à l’action\n- Réserve ton audit\n- Découvre la méthode");
    expect(good.find((r) => r.id === "ctas")?.status).toBe("complete");
  });

  it("Bases SEO: missing meta title or description is partial, both present within limits is complete", () => {
    const partial = evaluateAll("## Bases SEO\nMeta title : 24March Studio");
    expect(partial.find((r) => r.id === "seo-basics")?.status).toBe("partial");

    const complete = evaluateAll(
      "## Bases SEO\nMeta title : 24March Studio — Direction artistique d'intérieur\nMeta description : Un studio de direction artistique d'intérieur pour des espaces personnels et photogéniques."
    );
    expect(complete.find((r) => r.id === "seo-basics")?.status).toBe("complete");
  });

  it("Copywriting de chaque section requires real length (400+ chars), short text is partial", () => {
    const short = evaluateAll("## Copywriting de chaque section\nQuelques mots seulement.");
    expect(short.find((r) => r.id === "section-copywriting")?.status).toBe("partial");
  });
});
