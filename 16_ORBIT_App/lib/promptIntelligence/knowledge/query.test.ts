import { describe, expect, it } from "vitest";
import { allKnowledgeItems, getKnowledgeItem, queryKnowledge } from "./query";

describe("Knowledge Layer — schema + query", () => {
  it("seeds a non-empty, Zod-validated knowledge set with honest first-party sourcing", () => {
    const items = allKnowledgeItems();
    expect(items.length).toBeGreaterThan(10);
    for (const item of items) {
      expect(item.sourceDocument).toBe("ORBIT Prompt Engineering Guidelines");
      expect(item.sourceDocument).not.toMatch(/three pillars|nano banana|furniture pipeline|prompting guideline pack/i);
    }
  });

  it("getKnowledgeItem finds an item by id", () => {
    const item = getKnowledgeItem("structure-subject-setting-style-tech");
    expect(item?.title).toContain("subject");
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
