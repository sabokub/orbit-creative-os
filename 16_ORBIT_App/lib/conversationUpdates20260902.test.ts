import { describe, expect, it } from "vitest";
import {
  CONVERSATION_DECISIONS_2026_09_02,
  STUDIO_STATE_2026_09_02,
} from "./conversationUpdates20260902";

describe("September 2 Studio Brain update", () => {
  it("keeps landing separate from client workflow", () => {
    expect(STUDIO_STATE_2026_09_02.landingGovernance).toContain(
      "Landing = production directe ; workflow client séparé."
    );
  });

  it("locks the current visual benchmark binding", () => {
    const decision = CONVERSATION_DECISIONS_2026_09_02.find(
      (item) => item.question === "Quel est le binding du benchmark visuel courant ?"
    );
    expect(decision?.resolution).toBe("V03 — T04 / R023 / REAL_REF");
  });

  it("stores the latest style direction", () => {
    const decision = CONVERSATION_DECISIONS_2026_09_02.find(
      (item) => item.question === "Quelle STYLE_DIRECTION est la plus récente ?"
    );
    expect(decision?.resolution).toBe("STYLE_DIRECTION_36 — COMPOSITION AUTHORITY");
  });

  it("stores the official domain", () => {
    const decision = CONVERSATION_DECISIONS_2026_09_02.find(
      (item) => item.question === "Quel est le domaine officiel du studio ?"
    );
    expect(decision?.resolution).toBe("24march.fr");
  });

  it("does not invent a new exact launch date", () => {
    const decision = CONVERSATION_DECISIONS_2026_09_02.find(
      (item) => item.question === "Quand la relance full digital est-elle prévue ?"
    );
    expect(decision?.resolution).toBe("Septembre 2026, date exacte non verrouillée");
  });
});
