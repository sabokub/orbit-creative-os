import { describe, expect, it } from "vitest";
import { allKnowledgeItems, getKnowledgeItem, queryKnowledge } from "./query";

describe("Knowledge Layer — schema + query", () => {
  it("seeds a non-empty, Zod-validated knowledge set with honest sourcing (mix of verified real documents + first-party)", () => {
    const items = allKnowledgeItems();
    expect(items.length).toBeGreaterThan(10);
    // Every source is either the honest first-party label, or one of the 27 real documents
    // this session personally verified (search_files + read_file_content) before citing —
    // see the numbered table in README.md for the authoritative per-document status.
    const VERIFIED_REAL_DOCS = [
      "01-Mastering Intentional AI- Beyond Random Prompts.pdf",
      "02-Mastering Visual Instinct- From Random to Intentional AI Art.pdf",
      "03-Technical Language- The Bridge Between Vision and AI.pdf",
      "04-The Three Pillars of Professional AI Image Creation.pdf",
      "05-Accelerated Aesthetic Development- AI-Powered Visual Mastery.pdf",
      "06-Foundation to Vision- Bridging Systematic Prompting with Creative Direction.pdf",
      "Prompting Guideline Pack_ Crafting Effective Prompts for AI Image Generators.pdf",
      "972181274-7-Master-Prompts-That-Actually-Work.pdf",
      "AI Prompts for Nano Banana Pro.pdf",
      "Mixed Media Prompts.pdf",
      "Motion Style Workflow.pdf",
      "AI Sora Prompt – Vol. 2.pdf",
      "Grok Imagine Guideline.pdf",
      "Furniture Pipeline.pdf",
      "Fashion Pipeline.pdf",
      "Beverage Pipeline.pdf",
      "Jewelry Pipeline.pdf",
      "Marker Style Prompt.pdf",
      "Matchbox Prompts.pdf",
      "Adobe Stickers Prompt.pdf",
      "Risograph Print Style.pdf",
      "Halftone Workflow.pdf",
      "Pixel Transition Workflow.pdf",
      "Lens Transition Effect.pdf",
      "Image Enhancer _ Restorer prompt.pdf",
      "UGC Agent One.pdf",
      "Luma Agent Guide.pdf",
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

  it("never cites a document that was not personally verified — the two Drive folders hold 40 files total, 27 were opened and read", () => {
    const items = allKnowledgeItems();
    // Files present in the Drive folders but never opened by this session — must never appear as a source.
    // See README.md's "Not personally read" list for the authoritative accounting.
    const UNVERIFIED_FILES_IN_FOLDER = [
      "Envato Floating UI.pdf",
      "10 Almost Free AI Tools.pdf",
      "FAL - UGC Setup.pdf",
      "Gemini Slide Workflow.pdf",
      "Claude Code Setup.pdf",
      "Ai Blueprint for Businesses .pdf",
      "914393148-First-Step-From-Random-to-Pro.pdf",
      "972981665-01-Mastering-Intentional-AI-Beyond-Random-Prompts.pdf",
      "Cats, Lifestyle & Product Photography Prompt Pack v4_ 3 Styles _ 12 Prompts.pdf",
      "Advanced Prompt Pack v7_ Adventure Sports, Lifestyle & Fashion Photography with Sora Integration (2).pdf",
      "Pixa Setup Guide.pdf",
      "ManyChat Guide.pdf",
      "Micrographics Branding Design Prompts.pdf",
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
