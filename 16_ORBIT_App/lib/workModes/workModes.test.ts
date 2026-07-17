import { describe, it, expect } from "vitest";
import { WORK_MODES, WorkModeConfigSchema } from "./contracts";
import { getWorkModeConfig, listWorkModeConfigs } from "./config";
import { resolveWorkModeContext } from "./resolveContext";
import { InMemoryStore } from "../agents/memory/inMemoryStore";
import { MemoryService } from "../agents/memory/service";
import { getAgentDefinition } from "../agents/registry";
import { resolveProjectContext } from "../agents/context";

describe("work mode config", () => {
  it("defines a valid config for every mode", () => {
    expect(listWorkModeConfigs()).toHaveLength(WORK_MODES.length);
    for (const mode of WORK_MODES) {
      const cfg = getWorkModeConfig(mode);
      expect(WorkModeConfigSchema.safeParse(cfg).success).toBe(true);
      expect(cfg.navigationItems[0].href).toBe("/"); // Home always reachable
      expect(cfg.navigationItems.length).toBeGreaterThan(0);
    }
  });

  it("highlights different agents per mode without overlap being total", () => {
    expect(getWorkModeConfig("creation").preferredAgents).toContain("creative-director");
    expect(getWorkModeConfig("content").preferredAgents).toContain("content-strategist");
    expect(getWorkModeConfig("build").preferredAgents).toContain("website-architect");
  });
});

describe("resolveWorkModeContext", () => {
  it("returns boost types and preferred flag for a role", () => {
    const res = resolveWorkModeContext("p", "creation", "creative-director");
    expect(res.boostTypes).toContain("reference");
    expect(res.preferred).toBe(true);
    const notPreferred = resolveWorkModeContext("p", "build", "creative-director");
    expect(notPreferred.preferred).toBe(false);
  });
});

describe("mode boost actually reprioritises agent context", () => {
  it("moves boosted memory types up in the resolved context", async () => {
    const svc = new MemoryService(new InMemoryStore());
    await svc.create({ projectId: "p", type: "reference", source: "user", title: "Réf visuelle", content: "REFERENCE_MARKER" });
    await svc.create({ projectId: "p", type: "fact", source: "user", title: "Fait", content: "FACT_MARKER" });
    const entries = await svc.list("p");
    const def = getAgentDefinition("creative-director");

    const creationBoost = getWorkModeConfig("creation").contextPolicy.prioritizeMemoryTypes;
    const boosted = resolveProjectContext("p", def, entries, { boostTypes: creationBoost, tokenCap: 12 });
    // Under a tight cap, the boosted "reference" wins the single slot over "fact".
    expect(boosted.rendered).toContain("REFERENCE_MARKER");
    expect(boosted.rendered).not.toContain("FACT_MARKER");
  });
});
