import { describe, expect, it } from "vitest";
import {
  CLIENT_WORKFLOW_2026_08_09,
  CONVERSATION_DECISIONS_2026_08_09,
} from "./conversationUpdates20260809";

describe("August 9 client workflow update", () => {
  it("locks the five-state client pipeline", () => {
    expect(CLIENT_WORKFLOW_2026_08_09.pipeline).toEqual([
      "DEFINE",
      "LOCK",
      "ROUTE",
      "PRODUCE",
      "VERIFY",
    ]);
  });

  it("requires both visual boards before route", () => {
    expect(CLIENT_WORKFLOW_2026_08_09.lockGate).toContain(
      "LOCKED exige simultanément un SHOPPING_LIST_BOARD valide, un MOODBOARD_DIRECTION valide et une validation humaine explicite."
    );
  });

  it("rejects text-only boards", () => {
    expect(CLIENT_WORKFLOW_2026_08_09.boardPixels).toContain(
      "Markdown, tableau, texte ou description ne sont jamais une planche."
    );
  });

  it("records missing asset access as a lock", () => {
    const decision = CONVERSATION_DECISIONS_2026_08_09.find(
      (item) => item.question === "Que faire sans pixels accessibles pour une planche ?"
    );
    expect(decision?.resolution).toBe("LOCK — ASSET_ACCESS_MISSING");
  });

  it("keeps Kerros blocked without Asset_URL", () => {
    const decision = CONVERSATION_DECISIONS_2026_08_09.find(
      (item) => item.question === "Quel produit reste bloqué par absence d’Asset_URL ?"
    );
    expect(decision?.resolution).toBe("Kerros");
  });
});
