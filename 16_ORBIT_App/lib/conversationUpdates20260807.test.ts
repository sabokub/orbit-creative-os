import { describe, expect, it } from "vitest";
import {
  CONVERSATION_DECISIONS_2026_08_07,
  VISUAL_SYSTEM_2026_08_07,
} from "./conversationUpdates20260807";

describe("August 7 visual production update", () => {
  it("locks the approved production economics", () => {
    expect(VISUAL_SYSTEM_2026_08_07.economics).toContain(
      "Panier cible par pièce : 1 800 € ; plage normale : 1 200 à 2 500 €."
    );
    expect(VISUAL_SYSTEM_2026_08_07.workflow).toContain(
      "Temps cible complet : 85 minutes par visuel."
    );
  });

  it("locks the render gates and retry limit", () => {
    expect(VISUAL_SYSTEM_2026_08_07.modularSkills).toContain(
      "Aucun rendu avant validation explicite de la planche sourcée et du budget produits."
    );
    expect(VISUAL_SYSTEM_2026_08_07.generationRules).toContain(
      "Après trois échecs : STOP, diagnostiquer et revenir à l’étape fautive."
    );
  });

  it("records Hero as the official pilot", () => {
    const heroDecision = CONVERSATION_DECISIONS_2026_08_07.find(
      (decision) => decision.question === "Quel est le cas pilote officiel du workflow visuel ?"
    );
    expect(heroDecision?.resolution).toBe("Le Hero de la landing page");
  });

  it("keeps designer authority in the client brief", () => {
    const authorityDecision = CONVERSATION_DECISIONS_2026_08_07.find(
      (decision) => decision.question === "Qui conserve l’autorité créative dans le Client Brief System ?"
    );
    expect(authorityDecision?.resolution).toBe("Le designer arbitre");
  });
});
