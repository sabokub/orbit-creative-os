import { isBlocked } from "../../priority";
import { CrossModeBlocker, ModeInputs, PilotBlocker } from "./types";
import { taskWeight } from "./calculators";

/**
 * Blocker resolution. `primaryBlocker` is the single most impactful thing
 * stopping progress right now. `crossModeBlockers` surface only REAL external
 * dependencies from another mode that block the active objective — the other
 * modes never otherwise pollute the card.
 */

export function resolvePrimaryBlocker(inputs: ModeInputs): PilotBlocker | null {
  const blocked = inputs.studioItems
    .filter((i) => i.status !== "done" && i.status !== "archived" && isBlocked(i, inputs.studioItems))
    .sort((a, b) => taskWeight(b) - taskWeight(a));
  const top = blocked[0];
  if (!top) return null;

  const blockingDeps = top.dependsOn
    .map((id) => inputs.studioItems.find((i) => i.id === id))
    .filter((d): d is NonNullable<typeof d> => Boolean(d) && d!.status !== "done");
  const depTitle = blockingDeps[0]?.title;

  return {
    id: top.id,
    title: `"${top.title}" est bloqué`,
    impact: depTitle ? `En attente de "${depTitle}".` : "Une dépendance n'est pas terminée.",
    action: { label: "Voir les dépendances", href: "/dependencies" },
  };
}

/** Real cross-mode blockers (explicit rules, expandable). */
export function resolveCrossModeBlockers(inputs: ModeInputs): CrossModeBlocker[] {
  const out: CrossModeBlocker[] = [];
  const hasApprovedBrand = inputs.memory.some((m) => m.agentRole === "brand-strategist" && m.status === "approved");
  const hasBrandDraft = inputs.memory.some((m) => m.agentRole === "brand-strategist");

  // Build/Client depend on a validated brand decision before site/deliverables are trustworthy.
  if ((inputs.mode === "build" || inputs.mode === "client") && inputs.focus && inputs.hasProjectContext && hasBrandDraft && !hasApprovedBrand) {
    out.push({
      title: "Décision de marque non validée",
      sourceMode: "creation",
      impact: "Le positionnement n'est pas approuvé — le site/les livrables risquent d'être refaits.",
      action: { label: "Valider dans le mode Création", href: "/projects" },
    });
  }
  return out;
}
