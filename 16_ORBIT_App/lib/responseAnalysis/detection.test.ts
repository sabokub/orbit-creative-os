import { describe, expect, it } from "vitest";
import { detectDocumentType } from "./detection";
import { extractSections, normalizeResponse } from "./markdown";

const WEBSITE_LIKE = `
## Positionnement web
Texte.
## Promesse du hero
Texte.
## Arborescence
- Accueil
## Structure de la homepage
Texte.
## Copywriting de chaque section
Texte.
## Appels à l’action
- CTA
## Éléments de preuve
Texte.
## Offres reformulées pour le web
Texte.
## FAQ
Texte.
## Direction de l’image hero
Texte.
## Prompts image par section
Texte.
## Bases SEO
Texte.
## Ton UX writing
Texte.
`;

const CONTENT_LIKE = `
## Piliers de contenu
Texte.
## Formats récurrents
Texte.
## Idées de publications
Texte.
## Idées de reels
Texte.
## Accroches
Texte.
## Captions
Texte.
## Calendrier 30 jours
Texte.
## Logique de réutilisation
Texte.
## Objectifs par canal
Texte.
`;

describe("document type detection (structural, no AI)", () => {
  it("correctly identifies a website response and confirms it matches the expected module", () => {
    const sections = extractSections(normalizeResponse(WEBSITE_LIKE));
    const result = detectDocumentType(sections, "website");
    expect(result.documentType).toBe("website");
    expect(result.matchesExpectedModule).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it("flags a wrong-module response: a content-strategy response submitted for the website step", () => {
    const sections = extractSections(normalizeResponse(CONTENT_LIKE));
    const result = detectDocumentType(sections, "website");
    expect(result.documentType).toBe("content");
    expect(result.matchesExpectedModule).toBe(false);
  });

  it("returns 'unknown' with zero confidence for a response with no recognizable headings", () => {
    const sections = extractSections(normalizeResponse("Juste un paragraphe de texte, sans aucune section."));
    const result = detectDocumentType(sections, "website");
    expect(result.documentType).toBe("unknown");
    expect(result.confidence).toBe(0);
    expect(result.matchesExpectedModule).toBe(false);
  });
});
