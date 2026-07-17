import { BudgetReport, OptimizerWarning, PromptSection, QualityReport, QualityScoreDimension, SelectedContextItem, SelectedKnowledgeItem } from "../types";

/**
 * Deterministic, rule-based prompt quality score (issue #13, section 10).
 * Ten dimensions, 10 points each (100 total). Every point gained/lost is
 * explainable from the inputs — no fake precision, no AI judgment mixed in
 * here (an optional AI-semantic layer, if ever added, must stay clearly
 * separate — see `qualityReport.semantic` in types.ts, always `undefined`
 * unless a caller explicitly attaches one, and always degrading honestly
 * without a key, exactly like lib/responseAnalysis/semantic.ts).
 */

function dim(id: string, label: string, score: number, explanation: string): QualityScoreDimension {
  const clamped = Math.max(0, Math.min(10, score));
  return { id, label, score: Math.round(clamped * 10) / 10, max: 10, explanation };
}

export interface ScoringInput {
  finalPrompt: string;
  sections: PromptSection[];
  selectedContext: SelectedContextItem[];
  selectedKnowledge: SelectedKnowledgeItem[];
  budgetReport: BudgetReport;
  warnings: OptimizerWarning[];
  hasOutputFormatStatement: boolean;
  hasAudienceContext: boolean;
  hasVerificationChecklist: boolean;
}

export function scorePrompt(input: ScoringInput): QualityReport {
  const criticalCount = input.warnings.filter((w) => w.severity === "critical").length;
  const warningCount = input.warnings.filter((w) => w.severity === "warning").length;

  const clarity = dim(
    "clarity",
    "Clarté",
    10 - criticalCount * 3 - warningCount * 1,
    `${criticalCount} avertissement(s) critique(s), ${warningCount} avertissement(s) standard détecté(s) par l'optimiseur.`
  );

  const vagueWarnings = input.warnings.filter((w) => w.message.toLowerCase().includes("vague")).length;
  const specificity = dim(
    "specificity",
    "Spécificité",
    10 - vagueWarnings * 3,
    vagueWarnings > 0 ? `${vagueWarnings} formulation(s) vague(s) détectée(s).` : "Aucun verbe vague détecté par l'optimiseur.",
  );

  const hasAllCoreSections = ["role", "objective", "currentTask", "requiredDeliverable", "outputStructure"].every((id) =>
    input.sections.some((s) => s.id === id && s.content.trim().length > 0)
  );
  const structure = dim(
    "structure",
    "Structure",
    hasAllCoreSections ? 10 : 6,
    hasAllCoreSections
      ? "Toutes les sections structurelles essentielles (rôle, objectif, tâche, livrable, format) sont présentes."
      : "Une ou plusieurs sections structurelles essentielles sont vides.",
  );

  const contextRelevanceScore = input.selectedContext.length === 0 ? 0 : Math.min(10, 4 + input.selectedContext.filter((c) => c.importance >= 4).length);
  const contextRelevance = dim(
    "context-relevance",
    "Pertinence du contexte",
    contextRelevanceScore,
    `${input.selectedContext.length} élément(s) de contexte sélectionné(s), dont ${input.selectedContext.filter((c) => c.importance >= 4).length} de haute importance (>=4/5).`,
  );

  const knowledgeApplied = input.selectedKnowledge.length;
  const technicalWording = dim(
    "technical-wording",
    "Vocabulaire technique",
    knowledgeApplied === 0 ? 5 : Math.min(10, 5 + knowledgeApplied),
    `${knowledgeApplied} règle(s) de la Knowledge Layer appliquée(s) à ce prompt.`,
  );

  const outputDefinition = dim(
    "output-definition",
    "Définition du livrable attendu",
    input.hasOutputFormatStatement ? 10 : 2,
    input.hasOutputFormatStatement ? "Format de sortie explicitement défini." : "Aucun format de sortie explicite détecté.",
  );

  const modelFit = dim(
    "model-fit",
    "Adéquation au modèle cible",
    input.budgetReport.status === "over_budget" ? 4 : input.budgetReport.status === "compressed" ? 7 : 10,
    `Statut budget pour ce modèle : ${input.budgetReport.status}.`,
  );

  const brandDnaFit = dim(
    "brand-dna-fit",
    "Adéquation Brand DNA",
    input.selectedContext.some((c) => c.key === "brand.avoid") ? 10 : 6,
    input.selectedContext.some((c) => c.key === "brand.avoid")
      ? "La liste 'À éviter' de la marque est incluse comme contrainte."
      : "La liste 'À éviter' de la marque n'a pas été incluse.",
  );

  const repeatedWarning = input.warnings.find((w) => w.message.includes("répété"));
  const redundancy = dim(
    "redundancy",
    "Redondance",
    repeatedWarning ? 5 : 10,
    repeatedWarning ? repeatedWarning.message : "Aucune instruction répétée détectée.",
  );

  const budgetCompliance = dim(
    "budget-compliance",
    "Conformité budget",
    input.budgetReport.status === "within_budget" ? 10 : input.budgetReport.status === "compressed" ? 7 : 3,
    `${input.budgetReport.estimatedPromptChars} caractères estimés sur ${input.budgetReport.maxChars} autorisés.`,
  );

  const dimensions = [clarity, specificity, structure, contextRelevance, technicalWording, outputDefinition, modelFit, brandDnaFit, redundancy, budgetCompliance];
  const total = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) * (100 / (dimensions.length * 10)));

  return {
    total: Math.max(0, Math.min(100, total)),
    maxTotal: 100,
    dimensions,
    deterministic: true,
  };
}
