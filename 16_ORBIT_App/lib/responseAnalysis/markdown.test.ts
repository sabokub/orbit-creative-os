import { describe, expect, it } from "vitest";
import {
  countWords,
  detectDuplicateSections,
  extractCTAs,
  extractFAQ,
  extractListItems,
  extractSections,
  extractSEO,
  findPlaceholders,
  foldText,
  isPlaceholderOnly,
  normalizeResponse,
} from "./markdown";

describe("markdown structural parsing", () => {
  it("extracts ## sections with their body content, in order", () => {
    const md = `## Un\nContenu un.\n\n## Deux\nContenu deux.\nligne 2.`;
    const sections = extractSections(normalizeResponse(md));
    expect(sections).toHaveLength(2);
    expect(sections[0].heading).toBe("Un");
    expect(sections[0].content).toBe("Contenu un.");
    expect(sections[1].heading).toBe("Deux");
    expect(sections[1].content).toContain("ligne 2.");
  });

  it("strips leading numbering from headings", () => {
    const sections = extractSections("## 1. Positionnement web\nTexte.");
    expect(sections[0].heading).toBe("Positionnement web");
  });

  it("extracts markdown list items", () => {
    const items = extractListItems("- Accueil\n- Services\n* À propos\n1. Contact");
    expect(items).toEqual(["Accueil", "Services", "À propos", "Contact"]);
  });

  it("detects placeholders (à compléter, TODO, lorem ipsum, [...])", () => {
    expect(findPlaceholders("Section à compléter")).toContain("à compléter");
    expect(findPlaceholders("TODO: finish this")).toContain("TODO");
    expect(findPlaceholders("lorem ipsum dolor")).toContain("lorem ipsum");
    expect(findPlaceholders("[...]")).toContain("[...]");
    expect(findPlaceholders("Texte normal et complet.")).toHaveLength(0);
  });

  it("isPlaceholderOnly is true for empty or placeholder-only content, false for real content", () => {
    expect(isPlaceholderOnly("")).toBe(true);
    expect(isPlaceholderOnly("à compléter")).toBe(true);
    expect(isPlaceholderOnly("- à compléter\n- TODO")).toBe(true);
    expect(isPlaceholderOnly("Un intérieur qui te ressemble, pensé comme une direction artistique complète.")).toBe(false);
  });

  it("extracts CTA phrases and flags vague ones", () => {
    const ctas = extractCTAs("- Réserve ton audit\n- Cliquez ici\n- Découvre la méthode");
    const texts = ctas.map((c) => c.text);
    expect(texts).toContain("Réserve ton audit");
    expect(texts).toContain("Découvre la méthode");
    const vague = ctas.find((c) => c.text === "Cliquez ici");
    expect(vague?.vague).toBe(true);
  });

  it("extracts Q/A pairs from a FAQ section (Q:/R: shape)", () => {
    const faq = extractFAQ(
      "**Q: Combien de temps dure une prestation ?**\n**R: Entre 4 et 8 semaines selon le périmètre.**\n\n**Q: Faut-il déjà avoir des idées ?**\n**R: Non, la méthode part de zéro.**"
    );
    expect(faq).toHaveLength(2);
    expect(faq[0].question).toContain("dure une prestation");
    expect(faq[0].answer).toContain("4 et 8 semaines");
  });

  it("a FAQ heading with zero Q/A pairs extracts nothing (must not silently count as content)", () => {
    expect(extractFAQ("Cette section sera complétée plus tard.")).toHaveLength(0);
  });

  it("extracts meta title / meta description and flags length issues", () => {
    const seo = extractSEO("Meta title : 24March Studio — Direction artistique d'intérieur\nMeta description : " + "x".repeat(200));
    expect(seo?.metaTitle).toContain("24March Studio");
    expect(seo?.issues.some((i) => i.includes("trop longue"))).toBe(true);
  });

  it("detects near-duplicate sections as a contradiction/duplication warning", () => {
    const sections = extractSections(
      `## Section A\n${"Un contenu identique répété plusieurs fois pour dépasser le seuil de longueur minimal requis. ".repeat(2)}\n\n## Section B\n${"Un contenu identique répété plusieurs fois pour dépasser le seuil de longueur minimal requis. ".repeat(2)}`
    );
    const warnings = detectDuplicateSections(sections);
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("foldText normalizes accents/case/punctuation for fuzzy matching", () => {
    expect(foldText("Éléments de preuve !")).toBe("elements de preuve");
  });

  it("countWords counts whitespace-delimited words, 0 for empty", () => {
    expect(countWords("un deux trois")).toBe(3);
    expect(countWords("   ")).toBe(0);
  });
});
