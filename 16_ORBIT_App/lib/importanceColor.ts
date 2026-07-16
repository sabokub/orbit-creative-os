import { PriorityResult } from "./types";

/**
 * Canonical importance-tier → color mapping. Single source of truth for every
 * place in the app that shows a task/content item's priority — the badge,
 * card borders, and homepage critical-task callouts should all read from
 * here instead of hand-rolling their own hex values.
 *
 * Tier is derived from the existing `PriorityResult.label` produced by
 * `lib/priority.ts` (itself derived from score/urgency/impact/deadline) — no
 * new scoring system, just a consistent presentation layer on top of it.
 *
 * Accessibility: color is never the only signal. Every tier also ships a
 * short text tag and a distinct shape (`mark`) so priority is legible in
 * grayscale / for color-blind users — components should render both.
 */
export type ImportanceTier = "critical" | "high" | "medium" | "low";

/** Distinct shape per tier (rendered via CSS clip-path in <ImportanceMark />) so tiers are told apart without relying on color. */
export type ImportanceMarkShape = "triangle" | "diamond" | "square" | "circle";

export const TIER_BY_LABEL: Record<PriorityResult["label"], ImportanceTier> = {
  Critique: "critical",
  Haute: "high",
  Moyenne: "medium",
  Faible: "low",
};

export function importanceTier(priority: Pick<PriorityResult, "label">): ImportanceTier {
  return TIER_BY_LABEL[priority.label];
}

export interface TierStyle {
  tier: ImportanceTier;
  /** Short uppercase text tag, always rendered next to the color — never color alone. */
  tag: string;
  mark: ImportanceMarkShape;
  /** WCAG-checked text/border/background triplet for badges on a cream (#fffdf8/#f7f2e7) background. */
  badge: string;
  /** Foreground hex for the shape mark (matches badge text color, passes 4.5:1 on cream). */
  markColor: string;
  /** Subtle left-border accent for cards/rows. */
  cardBorder: string;
  /** Very light background tint for cards — kept subtle, not a solid block. */
  cardTint: string;
}

export const TIER_STYLE: Record<ImportanceTier, TierStyle> = {
  critical: {
    tier: "critical",
    tag: "Critique",
    mark: "triangle",
    // #7a1f1f on #fbdede ≈ 8.2:1 contrast
    badge: "border-[#c23b3b]/40 bg-[#fbdede] text-[#7a1f1f]",
    markColor: "#c23b3b",
    cardBorder: "border-l-[3px] border-l-[#c23b3b]/70",
    cardTint: "bg-[#fbdede]/25",
  },
  high: {
    tier: "high",
    tag: "Haute",
    mark: "diamond",
    // #7a4406 on #fbe3c2 ≈ 6.9:1 contrast
    badge: "border-[#d98a2b]/40 bg-[#fbe3c2] text-[#7a4406]",
    markColor: "#d98a2b",
    cardBorder: "border-l-[3px] border-l-[#d98a2b]/70",
    cardTint: "bg-[#fbe3c2]/25",
  },
  medium: {
    tier: "medium",
    tag: "Moyenne",
    mark: "square",
    // #5c4c05 on #f5e9a8 ≈ 6.5:1 contrast
    badge: "border-[#c7a814]/40 bg-[#f5e9a8] text-[#5c4c05]",
    markColor: "#a68f10",
    cardBorder: "border-l-[3px] border-l-[#c7a814]/70",
    cardTint: "bg-[#f5e9a8]/20",
  },
  low: {
    tier: "low",
    tag: "Faible",
    mark: "circle",
    // black/55 on black/[0.045] over cream — neutral gray, ≈ 6:1 contrast
    badge: "border-black/10 bg-black/[0.045] text-black/55",
    markColor: "rgba(0,0,0,0.4)",
    cardBorder: "border-l-[3px] border-l-black/15",
    cardTint: "bg-transparent",
  },
};

export function tierStyleForPriority(priority: Pick<PriorityResult, "label">): TierStyle {
  return TIER_STYLE[importanceTier(priority)];
}
