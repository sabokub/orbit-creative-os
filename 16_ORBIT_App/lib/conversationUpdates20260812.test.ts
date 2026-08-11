import { describe, expect, it } from "vitest";
import {
  CONVERSATION_DECISIONS_2026_08_12,
  VISUAL_QA_2026_08_12,
} from "./conversationUpdates20260812";

describe("August 12 visual QA update", () => {
  it("keeps QA rules separate from test results", () => {
    expect(VISUAL_QA_2026_08_12.ownership).toContain(
      "Les résultats sont saisis dans 13_VISUAL_BENCHMARK_PROMPTS / Google Sheet."
    );
  });

  it("defines first-pass as uncorrected output", () => {
    expect(VISUAL_QA_2026_08_12.firstPass).toContain(
      "First-pass = génération initiale, sans correction manuelle ni itération corrective."
    );
  });

  it("requires brief and DA for PASS", () => {
    const decision = CONVERSATION_DECISIONS_2026_08_12.find(
      (item) => item.question === "Que doit satisfaire un PASS first-pass ?"
    );
    expect(decision?.resolution).toBe("Brief + DA 24March + publiable telle quelle");
  });

  it("freezes rules through all 50 baseline tests", () => {
    const decision = CONVERSATION_DECISIONS_2026_08_12.find(
      (item) => item.question === "Quand modifier les règles après les premiers tests ?"
    );
    expect(decision?.resolution).toBe("Après les 50 tests du baseline");
  });

  it("keeps red-team risk field scoped", () => {
    const decision = CONVERSATION_DECISIONS_2026_08_12.find(
      (item) => item.question === "Comment utiliser le champ Risque testé ?"
    );
    expect(decision?.resolution).toBe("Vide T01–T30, prérempli RT01–RT20");
  });
});
