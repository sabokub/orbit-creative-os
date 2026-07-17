import { StudioItem } from "../../types";
import { WorkMode } from "../contracts";
import { CurrentPriority, ModeInputs } from "./types";
import { taskWeight } from "./calculators";

/**
 * resolveCurrentPriority — picks the SINGLE immediate priority for a mode using
 * explicit, testable rules (no mandatory AI call). Never returns a flat list of
 * ten equivalent priorities.
 */

const ACTIONABLE: StudioItem["status"][] = ["today", "in_progress", "backlog"];

function candidatePool(inputs: ModeInputs): StudioItem[] {
  const items = inputs.studioItems.filter((i) => i.status !== "done" && i.status !== "archived");
  switch (inputs.mode) {
    case "build":
      return items.filter((i) => i.kind === "task");
    case "content":
      return items.filter((i) => i.kind === "content");
    case "steering":
      return items.filter((i) => i.launchCritical).length > 0 ? items.filter((i) => i.launchCritical) : items;
    default:
      return items;
  }
}

function daysUntil(dueDate: string | undefined, now: Date): number | null {
  if (!dueDate) return null;
  const ms = new Date(dueDate).getTime() - now.getTime();
  return Math.round(ms / 86_400_000);
}

function score(item: StudioItem, now: Date): number {
  let s = taskWeight(item);
  const d = daysUntil(item.dueDate, now);
  if (d !== null) {
    if (d < 0) s += 30; // overdue
    else if (d <= 7) s += 15; // due soon
  }
  if (item.status === "in_progress") s += 8; // finish what's started
  else if (item.status === "today") s += 5;
  return s;
}

const MODE_ROUTE: Record<WorkMode, string> = {
  build: "/studio",
  content: "/studio/content",
  creation: "/projects",
  client: "/projects",
  steering: "/studio",
};

const FALLBACK: Record<WorkMode, { title: string; reason: string; nextAction: string; href: string }> = {
  build: { title: "Définir les premières tâches techniques", reason: "Aucune tâche actionnable n'est prête.", nextAction: "Créer une tâche dans le Studio", href: "/studio" },
  creation: { title: "Générer une direction artistique", reason: "Aucun livrable créatif en cours.", nextAction: "Lancer le Creative Director", href: "/projects" },
  content: { title: "Planifier les premiers contenus", reason: "Aucun contenu actionnable.", nextAction: "Créer un contenu", href: "/studio/content" },
  client: { title: "Ouvrir un projet client", reason: "Aucun livrable client en cours.", nextAction: "Créer un projet client", href: "/projects/new" },
  steering: { title: "Préparer le plan de lancement", reason: "Aucune priorité de pilotage détectée.", nextAction: "Ouvrir le Studio", href: "/studio" },
};

export function resolveCurrentPriority(inputs: ModeInputs): CurrentPriority {
  const calculatedAt = inputs.now.toISOString();
  const actionable = candidatePool(inputs)
    .filter((i) => ACTIONABLE.includes(i.status))
    .map((i) => ({ i, s: score(i, inputs.now) }))
    .sort((a, b) => b.s - a.s);

  if (actionable.length === 0) {
    const fb = FALLBACK[inputs.mode];
    return {
      priorityId: `fallback-${inputs.mode}`,
      title: fb.title,
      reason: fb.reason,
      nextAction: fb.nextAction,
      expectedImpact: "Débloque la progression du mode.",
      sourceIds: [],
      confidence: 0.4,
      calculatedAt,
    };
  }

  const top = actionable[0];
  const second = actionable[1]?.s ?? 0;
  const margin = top.s - second;
  const confidence = actionable.length === 1 ? 0.7 : margin >= 8 ? 0.85 : 0.55;
  const d = daysUntil(top.i.dueDate, inputs.now);
  const dueReason = d === null ? "" : d < 0 ? ` en retard de ${Math.abs(d)} j` : d <= 7 ? ` (échéance dans ${d} j)` : "";

  return {
    priorityId: top.i.id,
    title: top.i.title,
    reason: `Priorité la plus forte : impact ${top.i.impact}/5, urgence ${top.i.urgency}/5${top.i.launchCritical ? ", critique pour le lancement" : ""}${dueReason}.`,
    nextAction: top.i.status === "in_progress" ? "Reprendre cette tâche" : "Démarrer cette tâche",
    expectedImpact: top.i.launchCritical ? "Avance directement le lancement." : `Fait progresser ${inputs.mode}.`,
    sourceIds: [top.i.id],
    confidence,
    calculatedAt,
  };
}

export function priorityHref(inputs: ModeInputs, priority: CurrentPriority): string {
  const item = inputs.studioItems.find((i) => i.id === priority.sourceIds[0]);
  if (item?.projectId) return `/projects/${item.projectId}`;
  return MODE_ROUTE[inputs.mode];
}
