import { BrandProfile, ProjectBrief, StudioItem } from "../../types";
import { WebsiteChainStep } from "../contracts/types";
import { OmittedContextItem, SelectedContextItem } from "../types";

/** Rough, deterministic token estimate — see budget.ts for the shared constant. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

const BRAND_FIELD_LABELS: Record<keyof BrandProfile, string> = {
  id: "Identifiant marque",
  name: "Nom de marque",
  activity: "Activité",
  positioning: "Positionnement",
  audience: "Cible",
  offer: "Offre",
  brandPromise: "Promesse de marque",
  messagePillars: "Piliers de message",
  visualDirection: "Direction visuelle",
  toneOfVoice: "Ton de voix",
  colors: "Couleurs",
  photographyDirection: "Direction photo",
  contentDirection: "Direction contenu",
  websiteDirection: "Direction site web",
  imagePromptRules: "Règles de prompting image",
  avoid: "À éviter",
  successCriteria: "Critères de réussite",
};

function brandFieldValue(brand: BrandProfile, field: keyof BrandProfile): string {
  const raw = brand[field];
  if (Array.isArray(raw)) return raw.map((v) => `- ${v}`).join("\n");
  return String(raw ?? "");
}

/** Fields kept even when a step doesn't request them, per the issue's "avoid list is a hard constraint" principle. */
const ALWAYS_INCLUDE_BRAND_FIELDS: (keyof BrandProfile)[] = ["avoid"];

export interface BriefFieldSelection {
  field: keyof ProjectBrief;
  label: string;
}

const BRIEF_FIELD_LABELS: Record<string, string> = {
  projectGoal: "Objectif du projet",
  specificContext: "Contexte spécifique",
  deliverableType: "Type de livrable",
  references: "Références",
  constraints: "Contraintes",
  channels: "Canaux",
  format: "Format",
  successCriteria: "Critères de réussite (brief)",
};

/** Brief fields always relevant to every Website chain step — the variable, per-project part of context. */
const CORE_BRIEF_FIELDS: (keyof ProjectBrief)[] = ["projectGoal", "specificContext"];

export interface ContextSelectionResult {
  selected: SelectedContextItem[];
  omitted: OmittedContextItem[];
}

/**
 * Context selection for a single Website chain step (issue #13 section 4).
 * Never blindly injects the full project/brand — only fields the step's
 * contract actually declares relevant, plus a small always-included brand
 * safety set, plus validated prior-step outputs the step depends on.
 */
export function selectWebsiteStepContext(
  step: WebsiteChainStep,
  brand: BrandProfile,
  brief: ProjectBrief,
  previousValidatedOutputs: Record<string, string>,
  studioItems: StudioItem[] = []
): ContextSelectionResult {
  const selected: SelectedContextItem[] = [];
  const omitted: OmittedContextItem[] = [];

  const brandFieldsToInclude = new Set<keyof BrandProfile>([...step.requiredBrandFields, ...ALWAYS_INCLUDE_BRAND_FIELDS]);
  for (const field of Object.keys(BRAND_FIELD_LABELS) as (keyof BrandProfile)[]) {
    if (field === "id" || field === "name") continue; // structural, not prompt content on its own
    const value = brandFieldValue(brand, field);
    if (!value.trim()) continue;
    const item: SelectedContextItem = {
      key: `brand.${field}`,
      label: BRAND_FIELD_LABELS[field],
      value,
      source: "brandDNA",
      reason: brandFieldsToInclude.has(field)
        ? `Champ Brand DNA requis par le contrat de l'étape "${step.title}".`
        : "Non requis par cette étape.",
      importance: field === "avoid" ? 5 : step.requiredBrandFields.includes(field) ? 4 : 1,
      estimatedTokens: estimateTokens(value),
    };
    if (brandFieldsToInclude.has(field)) {
      selected.push(item);
    } else {
      omitted.push({ ...item, omittedReason: `Champ "${BRAND_FIELD_LABELS[field]}" non pertinent pour l'étape "${step.title}".` });
    }
  }

  // Brand name is always included as identity anchor, cheap and universally relevant.
  selected.unshift({
    key: "brand.name",
    label: BRAND_FIELD_LABELS.name,
    value: brand.name,
    source: "brandDNA",
    reason: "Identité de marque — toujours incluse comme ancre.",
    importance: 3,
    estimatedTokens: estimateTokens(brand.name),
  });

  for (const field of Object.keys(BRIEF_FIELD_LABELS) as (keyof ProjectBrief)[]) {
    const value = String(brief[field] ?? "");
    if (!value.trim()) continue;
    const relevant = CORE_BRIEF_FIELDS.includes(field);
    const item: SelectedContextItem = {
      key: `brief.${field}`,
      label: BRIEF_FIELD_LABELS[field],
      value,
      source: "projectBrief",
      reason: relevant ? "Contexte de projet toujours pertinent (objectif / contexte spécifique)." : "Non requis par cette étape.",
      importance: relevant ? 4 : 1,
      estimatedTokens: estimateTokens(value),
    };
    if (relevant) selected.push(item);
    else omitted.push({ ...item, omittedReason: `Champ de brief "${BRIEF_FIELD_LABELS[field]}" non nécessaire pour l'étape "${step.title}".` });
  }

  for (const depId of step.dependsOnSteps) {
    const output = previousValidatedOutputs[depId];
    if (!output || !output.trim()) continue;
    selected.push({
      key: `prior.${depId}`,
      label: `Livrable validé : ${depId}`,
      value: output,
      source: "priorOutput",
      reason: `Dépendance déclarée par l'étape "${step.title}" (voir WEBSITE_CHAIN.dependsOnSteps).`,
      importance: 5,
      estimatedTokens: estimateTokens(output),
    });
  }

  // Prior validated outputs NOT depended on by this step are explicitly omitted (never blind full-project injection).
  for (const [stepId, output] of Object.entries(previousValidatedOutputs)) {
    if (step.dependsOnSteps.includes(stepId)) continue;
    if (!output || !output.trim()) continue;
    omitted.push({
      key: `prior.${stepId}`,
      label: `Livrable validé : ${stepId}`,
      value: output,
      source: "priorOutput",
      reason: "Non déclaré comme dépendance de cette étape.",
      importance: 1,
      estimatedTokens: estimateTokens(output),
      omittedReason: `L'étape "${step.title}" ne dépend pas du livrable "${stepId}".`,
    });
  }

  // Studio Brain items linked to this project — only surfaced as context if launch-critical or explicitly relevant; never the full backlog.
  const relevantItems = studioItems.filter((it) => it.launchCritical).slice(0, 5);
  if (relevantItems.length > 0) {
    const value = relevantItems.map((it) => `- ${it.title}`).join("\n");
    selected.push({
      key: "studioBrain.launchCritical",
      label: "Tâches critiques pour le lancement",
      value,
      source: "studioBrain",
      reason: "Tâches marquées critiques pour le lancement — contexte de contrainte, jamais le backlog complet.",
      importance: 2,
      estimatedTokens: estimateTokens(value),
    });
  }
  const omittedItemsCount = studioItems.length - relevantItems.length;
  if (omittedItemsCount > 0) {
    omitted.push({
      key: "studioBrain.rest",
      label: `${omittedItemsCount} autre(s) élément(s) Studio Brain`,
      value: "",
      source: "studioBrain",
      reason: "Non critique pour le lancement.",
      importance: 1,
      estimatedTokens: 0,
      omittedReason: "Le backlog complet n'est jamais injecté — seules les tâches critiques pour le lancement le sont.",
    });
  }

  return { selected, omitted };
}
