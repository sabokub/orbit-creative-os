import { WebsiteChainStep } from "../contracts/types";
import { WEBSITE_DELIVERABLE_HEADINGS } from "../contracts/website";
import { getKnowledgeItem } from "../knowledge/query";
import { ModelProfile } from "../intelligence/modelProfiles";
import { PromptSection, PromptSectionId, SelectedContextItem, SelectedKnowledgeItem } from "../types";

/**
 * Generation Layer — renders the actual, predictable prompt structure
 * (issue #13 section 7): Role, Objective, Current task, Relevant project
 * context, Relevant Brand DNA, Validated prior decisions, Required
 * deliverable, Method/quality rules, Output structure, Constraints,
 * Verification checklist. Deliberately avoids repeating the same
 * instruction across sections and avoids filler language.
 *
 * This module ONLY renders text from already-selected context/knowledge —
 * it never decides *what* to select (that's intelligence/contextSelection.ts
 * and intelligence/knowledgeSelection.ts) and never dumps full knowledge
 * rationale/examples into the prompt — only the short `principle` statement,
 * referenced by id in the source trace (see builder.ts).
 */

function section(id: PromptSectionId, title: string, content: string): PromptSection {
  const trimmed = content.trim();
  return { id, title, content: trimmed, charCount: trimmed.length };
}

function renderContextBlock(items: SelectedContextItem[]): string {
  if (items.length === 0) return "(aucun élément sélectionné)";
  return items.map((item) => `- ${item.label} : ${item.value}`).join("\n");
}

export interface WebsiteStepSectionInputs {
  step: WebsiteChainStep;
  profile: ModelProfile;
  projectName: string;
  userIntent?: string;
  desiredOutputFormat?: string;
  brandContext: SelectedContextItem[];
  briefContext: SelectedContextItem[];
  priorDecisionContext: SelectedContextItem[];
  selectedKnowledge: SelectedKnowledgeItem[];
}

export function buildWebsiteStepSections(input: WebsiteStepSectionInputs): PromptSection[] {
  const { step, profile } = input;

  const role = section(
    "role",
    "Rôle",
    `Tu es Orbit Website, le générateur de livrable "${step.title}" (étape ${step.order}/13 de la chaîne Website) pour le projet "${input.projectName}".`
  );

  const objective = section("objective", "Objectif", step.purpose);

  const currentTask = section(
    "currentTask",
    "Tâche actuelle",
    input.userIntent?.trim() ||
      `Produis uniquement le livrable "${step.title}" (id: ${step.deliverableIds.join(", ") || "revue de cohérence"}). Ne produis aucun autre livrable de la chaîne Website à cette étape.`
  );

  const projectContext = section("projectContext", "Contexte projet pertinent", renderContextBlock(input.briefContext));

  const brandDNA = section("brandDNA", "Brand DNA pertinent", renderContextBlock(input.brandContext));

  const priorDecisions = section(
    "priorDecisions",
    "Décisions validées précédemment",
    input.priorDecisionContext.length > 0
      ? renderContextBlock(input.priorDecisionContext)
      : "(aucune étape précédente validée pertinente pour celle-ci — première étape de la chaîne ou aucune dépendance déclarée.)"
  );

  const headings = step.deliverableIds.map((id) => WEBSITE_DELIVERABLE_HEADINGS[id]).filter(Boolean);
  const requiredDeliverable = section(
    "requiredDeliverable",
    "Livrable attendu",
    headings.length > 0
      ? `Structure attendue :\n${headings.map((h) => `## ${h}`).join("\n")}\n\n${step.outputFormatHint}`
      : step.outputFormatHint
  );

  const methodRules = section(
    "methodRules",
    "Règles de méthode",
    input.selectedKnowledge.length > 0
      ? input.selectedKnowledge.map((k) => `- ${getKnowledgeItem(k.id)?.principle || k.title}`).join("\n")
      : "(aucune règle de connaissance sélectionnée pour cette étape.)"
  );

  const outputFormatLine = input.desiredOutputFormat?.trim() || (profile.markdownStructure ? "Markdown, en français, avec les titres ## exacts indiqués ci-dessus." : profile.outputFormattingNote);
  const outputStructure = section("outputStructure", "Format de sortie", outputFormatLine);

  const constraintLines: string[] = [];
  const avoidItem = input.brandContext.find((c) => c.key === "brand.avoid");
  if (avoidItem) constraintLines.push(`À ne jamais produire : ${avoidItem.value.replace(/\n/g, "; ")}`);
  const constraintsField = input.briefContext.find((c) => c.key === "brief.constraints");
  if (constraintsField) constraintLines.push(`Contraintes du projet : ${constraintsField.value}`);
  constraintLines.push("Aucun placeholder (\"[à compléter]\", \"TODO\", \"Lorem ipsum\") — si une information manque, indique l'hypothèse retenue puis continue.");
  if (profile.useNegativeConstraints) constraintLines.push("Formule explicitement ce qui ne doit pas apparaître dans le résultat.");
  const constraints = section("constraints", "Contraintes", constraintLines.join("\n"));

  const checklistLines = [...step.validationCriteria, "Aucun placeholder.", "Le format de sortie demandé est respecté."];
  const verificationChecklist = section("verificationChecklist", "Checklist de vérification", checklistLines.map((c) => `- ${c}`).join("\n"));

  const sections = [role, objective, currentTask, projectContext, brandDNA, priorDecisions, requiredDeliverable, methodRules, outputStructure, constraints, verificationChecklist];

  // Order sections per the target model's preferred order — same content, different emphasis/order.
  const orderIndex = new Map(profile.sectionOrderHint.map((id, idx) => [id, idx]));
  return [...sections].sort((a, b) => (orderIndex.get(a.id) ?? 99) - (orderIndex.get(b.id) ?? 99));
}

export function assembleFinalPrompt(sections: PromptSection[]): string {
  return sections
    .filter((s) => s.content.trim().length > 0)
    .map((s) => `## ${s.title}\n${s.content}`)
    .join("\n\n");
}
