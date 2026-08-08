import { describe, expect, it } from "vitest";
import {
  CONVERSATION_DECISIONS_2026_08_08,
  PROJECT_DIRECTIVE_2026_08_08,
} from "./conversationUpdates20260808";

describe("August 8 project directive update", () => {
  it("separates landing production from client workflow", () => {
    expect(PROJECT_DIRECTIVE_2026_08_08.landing).toContain(
      "Landing = production directe. Client = workflow client. Ne jamais mélanger les deux."
    );
    expect(PROJECT_DIRECTIVE_2026_08_08.landing).toContain(
      "08_VISUAL_PRODUCTION_WORKFLOW et 05_CLIENT_BRIEF_SYSTEM ne s’appliquent jamais à la landing."
    );
  });

  it("removes the obsolete Hero gate", () => {
    const heroDecision = CONVERSATION_DECISIONS_2026_08_08.find(
      (decision) => decision.question === "Quel est le cas pilote officiel du workflow visuel ?"
    );
    expect(heroDecision?.resolution).toBe("Aucun gate pilote pour la landing");
  });

  it("locks direct landing output", () => {
    const outputDecision = CONVERSATION_DECISIONS_2026_08_08.find(
      (decision) => decision.question === "Quel livrable renvoyer pour une commande landing ?"
    );
    expect(outputDecision?.resolution).toBe("Image seule, minimum 2K");
  });

  it("records the immersive client experience", () => {
    expect(PROJECT_DIRECTIVE_2026_08_08.clientExperience).toContain(
      "Le brief client doit devenir un parcours immersif plein écran, proche d’une présentation, enregistrable et mettable en pause à tout moment."
    );
  });

  it("requires visual sourcing and verified F2 routing", () => {
    expect(PROJECT_DIRECTIVE_2026_08_08.sourcingExperience).toContain(
      "À l’étape de sélection client, afficher une planche visuelle de la sélection ; des liens seuls ne suffisent pas."
    );
    expect(PROJECT_DIRECTIVE_2026_08_08.routing).toContain(
      "Si Engine Matrix ne contient aucun moteur vérifié pour F2, ROUTE reste BLOCKED."
    );
  });
});
