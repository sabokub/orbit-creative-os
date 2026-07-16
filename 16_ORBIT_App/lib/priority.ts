import { PriorityResult, StudioItem } from "./types";

/**
 * Priority / scoring engine.
 *
 * Score (0-100) is a weighted function of:
 *  - urgency (1-5)              up to 25 pts
 *  - impact (1-5)                up to 25 pts
 *  - deadline proximity          up to 20 pts
 *  - dependency-block-count      up to 15 pts (how many other items wait on this one)
 *  - launch relevance            15 pts flat if launch-critical
 *  - quick-win bonus             up to 5 pts (short tasks get a small nudge)
 *
 * Every score ships with a short, human-readable explanation built from the
 * same factors — callers should never show the number alone.
 */

export function daysUntil(dateISO?: string, from: Date = new Date()): number | null {
  if (!dateISO) return null;
  const due = new Date(`${dateISO}T23:59:59`);
  const diffMs = due.getTime() - from.getTime();
  return Math.ceil(diffMs / 86_400_000);
}

function deadlineScore(days: number | null): number {
  if (days === null) return 0;
  if (days < 0) return 20; // overdue
  if (days <= 1) return 20;
  if (days <= 3) return 15;
  if (days <= 7) return 10;
  if (days <= 14) return 5;
  return 2;
}

function deadlinePhrase(days: number | null): string | null {
  if (days === null) return null;
  if (days < 0) return `en retard de ${Math.abs(days)} j`;
  if (days === 0) return "échéance aujourd'hui";
  if (days === 1) return "échéance demain";
  return `échéance dans ${days} j`;
}

export function labelForScore(score: number): PriorityResult["label"] {
  if (score >= 78) return "Critique";
  if (score >= 58) return "Haute";
  if (score >= 34) return "Moyenne";
  return "Faible";
}

/**
 * @param item the item being scored
 * @param blockedCount how many other active items list this item in dependsOn
 */
export function computePriority(item: StudioItem, blockedCount: number): PriorityResult {
  const urgencyPts = (Math.min(Math.max(item.urgency, 1), 5) / 5) * 25;
  const impactPts = (Math.min(Math.max(item.impact, 1), 5) / 5) * 25;
  const days = daysUntil(item.dueDate);
  const deadlinePts = deadlineScore(days);
  const blockPts = Math.min(blockedCount * 5, 15);
  const launchPts = item.launchCritical ? 15 : 0;
  const quickWinPts = item.estimateMinutes <= 30 ? 5 : item.estimateMinutes <= 60 ? 2 : 0;

  const raw = urgencyPts + impactPts + deadlinePts + blockPts + launchPts + quickWinPts;
  const score = Math.round(Math.min(100, Math.max(0, raw)));
  const label = labelForScore(score);

  const reasons: string[] = [];
  if (item.launchCritical) reasons.push("critique pour le lancement");
  if (blockedCount > 0) reasons.push(`bloque ${blockedCount} élément${blockedCount > 1 ? "s" : ""}`);
  const deadline = deadlinePhrase(days);
  if (deadline) reasons.push(deadline);
  if (item.urgency >= 4) reasons.push("urgence forte");
  if (item.impact >= 4) reasons.push("impact fort");
  if (item.estimateMinutes <= 30) reasons.push("gain rapide");

  const explanation = reasons.length
    ? `${label} : ${reasons.join(", ")}`
    : `${label} : priorité standard`;

  return { score, label, explanation };
}

/** Number of active (not done/archived) items that depend on `itemId`. */
export function countBlockedBy(itemId: string, allItems: StudioItem[]): number {
  return allItems.filter(
    (candidate) =>
      candidate.id !== itemId &&
      candidate.status !== "done" &&
      candidate.status !== "archived" &&
      candidate.dependsOn.includes(itemId)
  ).length;
}

/** True when at least one dependency of `item` is not yet done. */
export function isBlocked(item: StudioItem, allItems: StudioItem[]): boolean {
  if (item.dependsOn.length === 0) return false;
  const byId = new Map(allItems.map((it) => [it.id, it]));
  return item.dependsOn.some((depId) => {
    const dep = byId.get(depId);
    return dep ? dep.status !== "done" : false;
  });
}

/** Convenience: score every item in a set, returning a Map<id, PriorityResult>. */
export function scoreAll(items: StudioItem[]): Map<string, PriorityResult> {
  const map = new Map<string, PriorityResult>();
  for (const item of items) {
    const blocked = countBlockedBy(item.id, items);
    map.set(item.id, computePriority(item, blocked));
  }
  return map;
}

/** Sort items by priority score, descending. Does not mutate input. */
export function sortByPriority(items: StudioItem[], scores?: Map<string, PriorityResult>): StudioItem[] {
  const map = scores ?? scoreAll(items);
  return [...items].sort((a, b) => (map.get(b.id)?.score ?? 0) - (map.get(a.id)?.score ?? 0));
}
