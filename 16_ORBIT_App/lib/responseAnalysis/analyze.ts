import "server-only";
import { BrandProfile, ProjectBrief, StudioItem, WorkflowStep } from "../types";
import { STEP_LABELS } from "../prompts";
import { getModuleContract } from "./contracts";
import { findMatchingSection } from "./contracts/types";
import {
  countWords,
  detectDuplicateSections,
  extractCTAs,
  extractFAQ,
  extractImagePrompts,
  extractListItems,
  extractSections,
  extractSEO,
  findPlaceholders,
  foldText,
  normalizeResponse,
} from "./markdown";
import { runSemanticAnalysis } from "./semantic";
import {
  AnalysisResult,
  AnalyzeOrbitResponseInput,
  DeliverableResult,
  ExtractedDecision,
  ExtractedDependency,
  ExtractedTask,
  StudioBrainChangeProposal,
} from "./types";

const MAX_RESPONSE_CHARS = 120_000;

function genAnalysisId(): string {
  return `analysis-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Text sections that plausibly indicate open tasks/next-actions, across all modules. */
const TASK_SECTION_KEYWORDS = [
  "prochaine action",
  "prochaines actions",
  "action recommandee",
  "corrections recommandees",
  "next action",
  "to do",
  "todo",
  "recommandation",
];

const DECISION_HINT_PATTERNS = [
  /hypoth[eè]se retenue\s*[:\-–]\s*(.+)/i,
  /si le positionnement est faible[^.]*\.\s*(.+)/i,
  /à trancher\s*[:\-–]\s*(.+)/i,
  /a trancher\s*[:\-–]\s*(.+)/i,
];

function slugify(text: string): string {
  return foldText(text).replace(/\s+/g, "-").slice(0, 60);
}

function extractTasksFromSections(
  sections: ReturnType<typeof extractSections>,
  projectId: string,
  step: WorkflowStep
): ExtractedTask[] {
  const tasks: ExtractedTask[] = [];
  for (const section of sections) {
    const folded = foldText(section.heading);
    const isTaskSection = TASK_SECTION_KEYWORDS.some((kw) => folded.includes(kw));
    if (!isTaskSection) continue;
    for (const item of extractListItems(section.content)) {
      const title = item.length > 140 ? `${item.slice(0, 137)}...` : item;
      tasks.push({
        title,
        sourceHeading: section.heading,
        dedupeKey: `${projectId}:${step}:${slugify(title)}`,
      });
    }
  }
  return tasks;
}

function extractDecisionsFromText(normalized: string): ExtractedDecision[] {
  const decisions: ExtractedDecision[] = [];
  for (const pattern of DECISION_HINT_PATTERNS) {
    const match = pattern.exec(normalized);
    if (match && match[1]) {
      decisions.push({
        question: `Hypothèse à valider : ${match[1].split("\n")[0].trim().slice(0, 200)}`,
        context: "Détecté automatiquement dans la réponse — le modèle a signalé une hypothèse ou une ambiguïté.",
        options: ["Valider l'hypothèse", "Redemander une clarification"],
      });
    }
  }
  return decisions;
}

/** Very deliberately minimal: dependencies are only inferred when the response explicitly says one deliverable follows another. */
function extractDependenciesFromText(normalized: string): ExtractedDependency[] {
  const deps: ExtractedDependency[] = [];
  const pattern = /apr[eè]s\s+(?:la validation|l['’]approbation)\s+de\s+([a-zàâçéèêëîïôûùüÿñæœ '’-]{3,60})/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(normalized))) {
    deps.push({ from: match[1].trim(), to: "" });
  }
  return deps;
}

export async function analyzeOrbitResponse(
  input: AnalyzeOrbitResponseInput,
  brand: BrandProfile,
  brief: ProjectBrief,
  currentStudioItems: StudioItem[] = []
): Promise<AnalysisResult> {
  const rawResponse = (input.rawResponse || "").slice(0, MAX_RESPONSE_CHARS);
  const normalized = normalizeResponse(rawResponse);
  const sections = extractSections(normalized);
  const contract = getModuleContract(input.workflowStep);
  const moduleLabel = STEP_LABELS[input.workflowStep];

  const warnings: string[] = [];
  if (rawResponse.length === 0) {
    warnings.push("La réponse est vide.");
  }
  if (input.rawResponse && input.rawResponse.length > MAX_RESPONSE_CHARS) {
    warnings.push(`La réponse dépasse la taille maximale analysée (${MAX_RESPONSE_CHARS} caractères) — le surplus a été tronqué.`);
  }
  if (!contract.implemented) {
    warnings.push(`Le contrat d'analyse du module "${moduleLabel}" n'est pas encore entièrement implémenté — seule une analyse générique est disponible.`);
  }

  // --- Document type detection -------------------------------------------------
  const { detectDocumentType } = await import("./detection");
  const detection = detectDocumentType(sections, input.workflowStep);
  if (!detection.matchesExpectedModule && detection.documentType !== "unknown") {
    warnings.push(
      `Cette réponse semble correspondre au module "${STEP_LABELS[detection.documentType]}", pas au livrable "${moduleLabel}" attendu.`
    );
  } else if (detection.documentType === "unknown") {
    warnings.push("Le type de document n'a pas pu être déterminé avec certitude à partir de la structure de la réponse.");
  }

  // --- Deliverable completeness (structural, deterministic) --------------------
  const detectedDeliverables: DeliverableResult[] = contract.deliverables.map((spec) => {
    const section = findMatchingSection(sections, spec.headingKeywords, foldText);
    const evaluation = spec.evaluate(section, normalized);
    return {
      id: spec.id,
      label: spec.label,
      status: evaluation.status,
      reasons: evaluation.reasons,
      content: section?.content,
      wordCount: section ? countWords(section.content) : 0,
    };
  });
  const expectedDeliverables = input.expectedDeliverables ?? contract.deliverables.map((d) => d.id);
  const missingDeliverables = detectedDeliverables.filter((d) => d.status === "missing").map((d) => d.id);
  const partialDeliverables = detectedDeliverables.filter((d) => d.status === "partial").map((d) => d.id);
  const completeCount = detectedDeliverables.filter((d) => d.status === "complete").length;
  const partialCount = partialDeliverables.length;
  const completenessScore = detectedDeliverables.length
    ? Math.round(((completeCount + partialCount * 0.5) / detectedDeliverables.length) * 100)
    : 0;

  // --- Placeholders / duplication ------------------------------------------------
  const placeholders = findPlaceholders(normalized);
  const contradictions = detectDuplicateSections(sections);

  // --- Cross-module structural extractions ---------------------------------------
  const ctaSection = findMatchingSection(sections, ["appels a l action", "appel a l action", "cta"], foldText);
  const extractedCTAs = ctaSection ? extractCTAs(ctaSection.content) : extractCTAs(normalized);
  const faqSection = findMatchingSection(sections, ["faq", "questions reponses"], foldText);
  const extractedFAQ = faqSection ? extractFAQ(faqSection.content) : [];
  const seoSection = findMatchingSection(sections, ["bases seo", "seo"], foldText);
  const extractedSEO = seoSection ? extractSEO(seoSection.content) : null;
  const imageSection = findMatchingSection(sections, ["prompts image par section", "prompts image", "prompt image"], foldText);
  const extractedImagePrompts = imageSection ? extractImagePrompts(imageSection.heading, imageSection.content) : [];
  const heroImageSection = findMatchingSection(sections, ["direction de l image hero", "direction image hero", "image hero"], foldText);
  const extractedImageDirections = heroImageSection ? [heroImageSection.content.trim()].filter(Boolean) : [];
  const sitemapSection = findMatchingSection(sections, ["arborescence", "sitemap", "plan du site"], foldText);
  const extractedPages = sitemapSection ? extractListItems(sitemapSection.content) : [];

  const extractedTasks = extractTasksFromSections(sections, input.projectId, input.workflowStep);
  const extractedDecisions = extractDecisionsFromText(normalized);
  const extractedDependencies = extractDependenciesFromText(normalized);

  // --- Semantic analysis (AI, optional) -------------------------------------------
  let semanticAnalysisPerformed = false;
  let semanticAnalysisError: string | undefined;
  let qualityScore = structuralQualityFallback(detectedDeliverables, placeholders, contradictions);
  let brandCoherence = { score: 50, issues: [] as string[] };
  let briefCoherence = { score: 50, issues: [] as string[] };
  let semanticRecommendations: string[] = [];
  let semanticSummary = "";

  if (!input.skipSemanticAnalysis && rawResponse.trim()) {
    const outcome = await runSemanticAnalysis(rawResponse, brand, brief, moduleLabel);
    if (outcome.performed && outcome.result) {
      semanticAnalysisPerformed = true;
      qualityScore = outcome.result.qualityScore;
      brandCoherence = { score: outcome.result.brandCoherenceScore, issues: outcome.result.brandCoherenceIssues };
      briefCoherence = { score: outcome.result.briefCoherenceScore, issues: outcome.result.briefCoherenceIssues };
      contradictions.push(...outcome.result.contradictions);
      semanticRecommendations = outcome.result.recommendations;
      semanticSummary = outcome.result.summary;
      if (outcome.result.toneMismatch) warnings.push("Le ton détecté ne correspond pas au ton de voix de la marque.");
      for (const cta of outcome.result.vagueCtas) warnings.push(`CTA vague détecté : "${cta}"`);
      for (const weak of outcome.result.weakImagePrompts) warnings.push(`Prompt image jugé faible : "${weak}"`);
    } else {
      semanticAnalysisError = outcome.error;
      warnings.push(outcome.error || "Analyse sémantique indisponible — seule l'analyse structurelle a été effectuée.");
    }
  } else if (input.skipSemanticAnalysis) {
    semanticAnalysisError = "Analyse sémantique désactivée pour cette exécution.";
  }

  const exploitability: AnalysisResult["exploitability"] =
    completenessScore >= 80 && qualityScore >= 60 && missingDeliverables.length === 0
      ? "ready"
      : completenessScore >= 40
        ? "needs_edits"
        : "not_usable";

  const recommendedNextActions = [
    ...missingDeliverables.map((id) => `Compléter le livrable manquant : "${detectedDeliverables.find((d) => d.id === id)?.label}"`),
    ...partialDeliverables.map((id) => `Renforcer le livrable partiel : "${detectedDeliverables.find((d) => d.id === id)?.label}"`),
    ...semanticRecommendations,
  ].slice(0, 30);

  // --- Studio Brain change proposals (not applied — see studioBrainSync.ts) ------
  const existingTaskTitles = new Set(
    currentStudioItems
      .filter((it) => it.kind === "task" && it.status !== "archived")
      .map((it) => foldText(it.title))
  );

  const proposedStudioBrainChanges: StudioBrainChangeProposal[] = [];
  let proposalIndex = 0;
  for (const id of missingDeliverables) {
    const label = detectedDeliverables.find((d) => d.id === id)?.label || id;
    const title = `Compléter "${label}" (${moduleLabel})`;
    if (existingTaskTitles.has(foldText(title))) continue;
    proposedStudioBrainChanges.push({
      id: `proposal-${proposalIndex++}`,
      kind: "create_task",
      description: `Créer une tâche : ${title}`,
      payload: { title, category: moduleLabel, projectId: input.projectId, deliverableId: id, workflowStep: input.workflowStep },
      accepted: true,
    });
  }
  for (const task of extractedTasks) {
    if (existingTaskTitles.has(foldText(task.title))) continue;
    proposedStudioBrainChanges.push({
      id: `proposal-${proposalIndex++}`,
      kind: "create_task",
      description: `Créer une tâche extraite de la réponse : "${task.title}"`,
      payload: { title: task.title, category: moduleLabel, projectId: input.projectId, workflowStep: input.workflowStep },
      accepted: true,
    });
  }
  if (missingDeliverables.length === 0 && partialDeliverables.length === 0 && detectedDeliverables.length > 0) {
    proposedStudioBrainChanges.push({
      id: `proposal-${proposalIndex++}`,
      kind: "complete_task",
      description: `Marquer l'étape "${moduleLabel}" comme terminée pour ce projet (tous les livrables sont complets).`,
      payload: { workflowStep: input.workflowStep, projectId: input.projectId },
      accepted: true,
    });
  }
  for (const decision of extractedDecisions) {
    proposedStudioBrainChanges.push({
      id: `proposal-${proposalIndex++}`,
      kind: "create_decision",
      description: `Créer une décision : "${decision.question}"`,
      payload: { ...decision, projectId: input.projectId },
      accepted: true,
    });
  }

  const summary =
    semanticSummary ||
    `${completeCount} livrable(s) complet(s) sur ${detectedDeliverables.length}, ${partialCount} partiel(s), ${missingDeliverables.length} manquant(s), ${extractedCTAs.length} CTA détecté(s).`;

  return {
    id: genAnalysisId(),
    projectId: input.projectId,
    workflowStep: input.workflowStep,
    promptId: input.promptId,
    source: input.source,
    createdAt: new Date().toISOString(),

    documentType: detection.documentType,
    documentTypeConfidence: detection.confidence,
    matchesExpectedModule: detection.matchesExpectedModule,

    rawResponse,
    normalizedResponse: normalized,
    summary,

    completenessScore,
    qualityScore,
    exploitability,

    brandCoherence,
    briefCoherence,

    semanticAnalysisPerformed,
    semanticAnalysisError,

    expectedDeliverables,
    detectedDeliverables,
    missingDeliverables,
    partialDeliverables,

    extractedEntities: {},
    extractedTasks,
    extractedDecisions,
    extractedDependencies,
    extractedContent: sections,
    extractedPages,
    extractedSections: sections,
    extractedCTAs,
    extractedFAQ,
    extractedSEO,
    extractedImageDirections,
    extractedImagePrompts,

    warnings,
    contradictions,
    placeholders,

    recommendedNextActions,
    proposedStudioBrainChanges,
  };
}

/** Deterministic fallback quality estimate used when semantic analysis didn't run — never presented as an AI judgment. */
function structuralQualityFallback(
  deliverables: DeliverableResult[],
  placeholders: string[],
  contradictions: string[]
): number {
  if (deliverables.length === 0) return 0;
  const complete = deliverables.filter((d) => d.status === "complete").length;
  const partial = deliverables.filter((d) => d.status === "partial").length;
  let score = ((complete + partial * 0.5) / deliverables.length) * 100;
  score -= placeholders.length * 5;
  score -= contradictions.length * 5;
  return Math.round(Math.max(0, Math.min(100, score)));
}
