import { describe, expect, it } from "vitest";
import {
  BOARD_PRODUCTION_2026_08_10,
  CONVERSATION_DECISIONS_2026_08_10,
} from "./conversationUpdates20260810";

describe("August 10 board production update", () => {
  it("locks Apps Script and Slides for exact boards", () => {
    expect(BOARD_PRODUCTION_2026_08_10.productionTooling).toContain(
      "La route gratuite validée pour assembler des planches exactes est Google Apps Script + Google Slides avec insertion des packshots fournisseurs réels."
    );
  });

  it("requires all purchases to remain visible", () => {
    expect(BOARD_PRODUCTION_2026_08_10.completeness).toContain(
      "La shopping list doit afficher 100 % des achats proposés."
    );
  });

  it("keeps the validated shopping list presentation", () => {
    expect(BOARD_PRODUCTION_2026_08_10.shoppingListPresentation).toContain(
      "La shopping list utilise des slides horizontales."
    );
    expect(BOARD_PRODUCTION_2026_08_10.shoppingListPresentation).toContain(
      "Accent lime validé."
    );
  });

  it("rejects phantom purchases", () => {
    const decision = CONVERSATION_DECISIONS_2026_08_10.find(
      (item) => item.question === "Un achat peut-il exister dans le budget sans apparaître sur la planche ?"
    );
    expect(decision?.resolution).toBe("Non");
  });
});
