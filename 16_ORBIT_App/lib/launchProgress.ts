import type { StudioItem } from "./types";

/**
 * Canonical launch progress used everywhere Orbit displays launch completion.
 * Only non-archived launch-critical items belong to this denominator.
 */
export function getLaunchProgress(items: StudioItem[]): {
  progress: number;
  doneCount: number;
  totalCount: number;
} {
  const launchItems = items.filter((item) => item.launchCritical && item.status !== "archived");
  const doneCount = launchItems.filter((item) => item.status === "done").length;
  const totalCount = launchItems.length;

  return {
    progress: totalCount ? Math.round((doneCount / totalCount) * 100) : 0,
    doneCount,
    totalCount,
  };
}
