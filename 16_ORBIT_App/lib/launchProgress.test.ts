import { describe, expect, it } from "vitest";
import { getLaunchProgress } from "./launchProgress";
import type { StudioItem } from "./types";

function item(id: string, status: StudioItem["status"], launchCritical: boolean): StudioItem {
  return {
    id,
    kind: "task",
    title: id,
    description: "",
    status,
    order: 0,
    category: "Test",
    estimateMinutes: 30,
    urgency: 3,
    impact: 3,
    launchCritical,
    dependsOn: [],
    createdAt: "2026-07-24T00:00:00.000Z",
    updatedAt: "2026-07-24T00:00:00.000Z",
  };
}

describe("getLaunchProgress", () => {
  it("uses only non-archived launch-critical items", () => {
    const result = getLaunchProgress([
      item("done-launch", "done", true),
      item("open-launch", "backlog", true),
      item("done-studio", "done", false),
      item("archived-launch", "archived", true),
    ]);

    expect(result).toEqual({ progress: 50, doneCount: 1, totalCount: 2 });
  });

  it("returns zero without launch items", () => {
    expect(getLaunchProgress([])).toEqual({ progress: 0, doneCount: 0, totalCount: 0 });
  });
});
