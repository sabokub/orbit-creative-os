import { WebsiteChainStep } from "../contracts/types";
import { ModelProfile } from "./modelProfiles";
import { BudgetReport, OptimizerWarning, SelectedContextItem } from "../types";

/**
 * Deterministic prompt optimizer (issue #13, section 9). Every check here is
 * a local, explainable rule — no AI call, no fuzzy judgment. Produces
 * actionable warnings with concrete numbers wherever possible.
 */

const VAGUE_VERBS = ["améliore", "optimise", "rends meilleur", "améliorer", "optimiser", "amélioration", "peaufine"];
const MOTIVATIONAL_FILLER = ["world-class", "world class", "sois exceptionnel", "sois incroyable", "pense en dehors de la boîte", "extrêmement créatif"];
const PLACEHOLDER_PATTERNS = [/\[insérer/i, /\[insert/i, /\btodo\b/i, /lorem ipsum/i, /\[\.\.\.\]/, /à compléter/i];
const WEAK_IMAGE_WORDS = ["haute qualité", "high quality", "4k", "professional photo", "bonne lumière", "bien éclairé"];

let warningIdCounter = 0;
function nextId(): string {
  warningIdCounter += 1;
  return `warn-${warningIdCounter}`;
}

export interface OptimizerInput {
  finalPrompt: string;
  step?: WebsiteChainStep;
  profile: ModelProfile;
  selectedContext: SelectedContextItem[];
  budgetReport: BudgetReport;
  hasAudienceContext: boolean;
  hasOutputFormatStatement: boolean;
}

export function runPromptOptimizer(input: OptimizerInput): OptimizerWarning[] {
  warningIdCounter = 0;
  const warnings: OptimizerWarning[] = [];
  const lower = input.finalPrompt.toLowerCase();
  const chars = input.finalPrompt.length;

  // Excessive length relative to the model's length target.
  if (chars > input.profile.lengthTargetChars * 1.5) {
    const overPercent = Math.round(((chars - input.profile.lengthTargetChars) / input.profile.lengthTargetChars) * 100);
    warnings.push({
      id: nextId(),
      severity: "warning",
      message: `Le prompt dépasse la longueur cible recommandée pour ce modèle de ${overPercent}% (${chars} caractères, cible ${input.profile.lengthTargetChars}).`,
    });
  }

  // Vague verbs.
  const vagueHits = VAGUE_VERBS.filter((v) => lower.includes(v));
  if (vagueHits.length > 0) {
    warnings.push({
      id: nextId(),
      severity: "warning",
      message: `Verbe(s) vague(s) détecté(s) sans cible mesurable : "${vagueHits.join('", "')}". Remplace par une action vérifiable.`,
    });
  }

  // Motivational filler.
  const fillerHits = MOTIVATIONAL_FILLER.filter((v) => lower.includes(v));
  if (fillerHits.length > 0) {
    warnings.push({
      id: nextId(),
      severity: "info",
      message: `Formulation motivationnelle sans effet opérationnel détectée : "${fillerHits.join('", "')}".`,
    });
  }

  // Missing output format.
  if (!input.hasOutputFormatStatement) {
    warnings.push({
      id: nextId(),
      severity: "critical",
      message: "Aucun format de sortie explicite détecté dans le prompt (Markdown/JSON/structure attendue).",
    });
  }

  // Missing target audience context.
  if (!input.hasAudienceContext) {
    warnings.push({
      id: nextId(),
      severity: "warning",
      message: "Aucun contexte de cible/audience sélectionné pour cette étape — vérifie que c'est intentionnel.",
    });
  }

  // Missing context entirely.
  if (input.selectedContext.length === 0) {
    warnings.push({
      id: nextId(),
      severity: "critical",
      message: "Aucun contexte projet/marque sélectionné — le prompt risque d'être générique.",
    });
  }

  // Placeholders left in the prompt itself (should never happen — the builder assembles from real data, but the user can edit).
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(input.finalPrompt)) {
      warnings.push({ id: nextId(), severity: "critical", message: "Placeholder détecté dans le prompt lui-même — remplace-le avant envoi." });
      break;
    }
  }

  // Weak image vocabulary / weak technical specs (only relevant for image-prompt steps).
  if (input.profile.kind === "image") {
    const weakHits = WEAK_IMAGE_WORDS.filter((v) => lower.includes(v));
    if (weakHits.length > 0) {
      warnings.push({
        id: nextId(),
        severity: "warning",
        message: `Vocabulaire image faible détecté : "${weakHits.join('", "')}" — préfère un vocabulaire concret (caméra/lumière/matières).`,
      });
    }
    if (input.profile.useNegativeConstraints && !/contrainte[s]? négative|négatif|no text|no people|sans texte/i.test(input.finalPrompt)) {
      warnings.push({
        id: nextId(),
        severity: "info",
        message: "Aucune contrainte négative explicite détectée pour un prompt image — envisage d'en ajouter (ex: \"pas de texte à l'écran\").",
      });
    }
  }

  // Too many deliverables in one step (chain steps should stay near 1, grouped steps near 2).
  if (input.step && input.step.deliverableIds.length > 2) {
    warnings.push({
      id: nextId(),
      severity: "warning",
      message: `Cette étape couvre ${input.step.deliverableIds.length} livrables à la fois — envisage de la scinder en étapes plus ciblées.`,
    });
  }

  // Repeated instructions: naive sentence-level duplicate detection.
  const sentences = input.finalPrompt
    .split(/[\n.]+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 25);
  const seen = new Map<string, number>();
  for (const s of sentences) seen.set(s, (seen.get(s) || 0) + 1);
  const repeated = [...seen.entries()].filter(([, count]) => count > 1);
  if (repeated.length > 0) {
    warnings.push({
      id: nextId(),
      severity: "info",
      message: `${repeated.length} instruction(s)/phrase(s) répétée(s) textuellement dans le prompt.`,
    });
  }

  // Budget-derived warnings are surfaced by budget.ts already, but a critical
  // over-budget status is elevated here too, so the optimizer's warning list
  // is a complete picture on its own.
  if (input.budgetReport.status === "over_budget") {
    warnings.push({
      id: nextId(),
      severity: "critical",
      message: "Le prompt dépasse le budget de l'étape — voir le rapport de budget pour les actions de compression déjà tentées.",
    });
  }

  return warnings;
}
