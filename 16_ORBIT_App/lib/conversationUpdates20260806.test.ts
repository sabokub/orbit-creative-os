import { describe, expect, it } from "vitest";
import {
  CONVERSATION_DECISIONS_2026_08_06,
  STUDIO_DIRECTION_2026_08_06,
} from "./conversationUpdates20260806";

function decision(question: string) {
  const match = CONVERSATION_DECISIONS_2026_08_06.find((entry) => entry.question === question);
  if (!match) throw new Error(`Décision absente : ${question}`);
  return match;
}

describe("conversation update 2026-08-06", () => {
  it("supersedes the stale teal validation", () => {
    const palette = decision("Le teal appartient-il à la palette finale validée ?");
    expect(palette.resolution).toContain("n’a jamais été validé");
    expect(palette.aliases).toContain("Quelle direction artistique doit suivre la landing page ?");
  });

  it("records the current homepage system", () => {
    const structure = decision("Quelle structure doit suivre la homepage 24March Studio ?");
    expect(structure.resolution).toContain("méthode 6 étapes");
    expect(structure.resolution).toContain("cinq Cool People");
    expect(STUDIO_DIRECTION_2026_08_06.homepage).toContain(
      "Supprimer Projets récents, avis clients et témoignages."
    );
  });

  it("keeps the production order and quality gates explicit", () => {
    expect(STUDIO_DIRECTION_2026_08_06.landingVisualOrder).toHaveLength(15);
    expect(STUDIO_DIRECTION_2026_08_06.visualProduction[0]).toContain("shopping list");
    expect(STUDIO_DIRECTION_2026_08_06.visualProduction[2]).toContain("2K HD");
  });

  it("stores the canonical six prices", () => {
    expect(STUDIO_DIRECTION_2026_08_06.pricing).toContain(
      "Salon 229 €, Chambre 229 €, Bureau 229 €, Cuisine 259 €, Salle à manger 229 €, Suite parentale 289 €."
    );
  });
});
