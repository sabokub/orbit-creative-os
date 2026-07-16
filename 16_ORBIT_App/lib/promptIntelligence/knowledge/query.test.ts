import { describe, expect, it } from "vitest";
import { allKnowledgeItems, getKnowledgeItem, queryKnowledge } from "./query";

describe("Knowledge Layer — schema + query", () => {
  it("seeds a non-empty, Zod-validated knowledge set with honest sourcing (mix of verified real documents + first-party)", () => {
    const items = allKnowledgeItems();
    expect(items.length).toBeGreaterThan(10);
    // Every source is either the honest first-party label, or one of the 10 real documents
    // this session personally verified (search_files + read_file_content) before citing.
    const VERIFIED_REAL_DOCS = [
      "01-Mastering Intentional AI- Beyond Random Prompts.pdf",
      "02-Mastering Visual Instinct- From Random to Intentional AI Art.pdf",
      "03-Technical Language- The Bridge Between Vision and AI.pdf",
      "04-The Three Pillars of Professional AI Image Creation.pdf",
      "05-Accelerated Aesthetic Development- AI-Powered Visual Mastery.pdf",
      "06-Foundation to Vision- Bridging Systematic Prompting with Creative Direction.pdf",
      "Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf",
      "Furniture Pipeline.pdf",
      "Fashion Pipeline.pdf",
    ];
    for (const item of items) {
      const isFirstParty = item.sourceDocument === "ORBIT Prompt Engineering Guidelines";
      const isVerifiedReal = VERIFIED_REAL_DOCS.includes(item.sourceDocument);
      expect(isFirstParty || isVerifiedReal).toBe(true);
      for (const extra of item.additionalSources) {
        expect(VERIFIED_REAL_DOCS.includes(extra)).toBe(true);
      }
    }
    // At least one item is now genuinely real-sourced (Stage 2 of the provenance history).
    expect(items.some((i) => i.sourceDocument !== "ORBIT Prompt Engineering Guidelines")).toBe(true);
  });

  it("never cites a document that was not personally verified — the folders hold 23 files, only 10 were opened and read", () => {
    const items = allKnowledgeItems();
    // Files present in the Drive folders but never opened by this session — must never appear as a source.
    const UNVERIFIED_FILES_IN_FOLDER = [
      "Envato Floating UI.pdf",
      "Adobe Stickers Prompt.pdf",
      "Halftone Workflow.pdf",
      "Beverage Pipeline.pdf",
      "Jewelry Pipeline.pdf",
      "Grok Imagine Guideline.pdf",
      "Matchbox Prompts.pdf",
    ];
    for (const item of items) {
      expect(UNVERIFIED_FILES_IN_FOLDER.includes(item.sourceDocument)).toBe(false);
      for (const extra of item.additionalSources) {
        expect(UNVERIFIED_FILES_IN_FOLDER.includes(extra)).toBe(false);
      }
    }
  });

  it("getKnowledgeItem finds an item by id", () => {
    const item = getKnowledgeItem("real-prompt-structured-ordering");
    expect(item?.title).toContain("Subject");
    expect(item?.sourceDocument).toBe("Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf");
  });

  it("filters by taskTypes and targetModel", () => {
    const results = queryKnowledge({ taskTypes: ["image-prompt"], targetModel: "nano-banana-image" });
    expect(results.length).toBeGreaterThan(0);
    for (const { item } of results) {
      expect(item.taskTypes).toContain("image-prompt");
      expect(item.targetModels).toContain("nano-banana-image");
    }
  });

  it("ranks results deterministically by relevance score, highest first", () => {
    const results = queryKnowledge({ taskTypes: ["copywriting"], targetModel: "openai-text" });
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].relevance).toBeGreaterThanOrEqual(results[i].relevance);
    }
  });

  it("respects the limit parameter", () => {
    const results = queryKnowledge({ targetModel: "openai-text", limit: 2 });
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("excludes non-active items by default", () => {
    const results = queryKnowledge({ targetModel: "openai-text" });
    expect(results.every(({ item }) => item.status === "active")).toBe(true);
  });

  it("a query for a target model with no matching items returns an empty array, not an error", () => {
    const results = queryKnowledge({ taskTypes: ["video-prompt"], targetModel: "openai-text" });
    expect(results).toEqual([]);
  });
});
