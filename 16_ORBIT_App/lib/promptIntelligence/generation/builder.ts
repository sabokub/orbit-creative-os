import { getWebsiteChainStep } from "../contracts/website";
import { selectWebsiteStepContext } from "../intelligence/contextSelection";
import { selectKnowledgeForWebsiteStep } from "../intelligence/knowledgeSelection";
import { defaultBudgetForWebsiteStep, applyBudget } from "../intelligence/budget";
import { getModelProfile } from "../intelligence/modelProfiles";
import { runPromptOptimizer } from "../intelligence/optimizer";
import { scorePrompt } from "../intelligence/scoring";
import { assembleFinalPrompt, buildWebsiteStepSections } from "./sections";
import { nextWebsiteChainStepId } from "../contracts/website";
import { PromptBuildInput, PromptBuildResult, SourceTraceEntry } from "../types";

/**
 * Canonical Generation Layer entry point (issue #13 section 6). Both the
 * manual-copy path (PromptLab "Copy prompt" button) and the API-generation
 * path ("Générer avec OpenAI") call this exact function for the Website
 * chain — there is no second prompt-construction path for Website.
 *
 * Only `module: "website"` with a `chainStepId` is fully implemented in this
 * PR (matches the issue's scope control: Website is production-ready, the
 * other modules stay on the legacy `lib/prompts.ts` templates via the
 * adapter documented in `../migration.ts`). Calling this for another module
 * throws an explicit, honest error rather than silently degrading.
 */

export const BUILDER_VERSION = "1.0.0";

function genPromptVersion(): string {
  return `pv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildOrbitPrompt(input: PromptBuildInput): PromptBuildResult {
  if (input.module !== "website" || !input.chainStepId) {
    throw new Error(
      "buildOrbitPrompt : seul le module 'website' avec un chainStepId est implémenté dans cette version. Les autres modules utilisent encore lib/prompts.ts (voir lib/promptIntelligence/migration.ts)."
    );
  }

  const step = getWebsiteChainStep(input.chainStepId);
  if (!step) {
    throw new Error(`Étape de chaîne Website inconnue : "${input.chainStepId}".`);
  }

  const profile = getModelProfile(input.targetModel);

  const { selected, omitted } = selectWebsiteStepContext(step, input.brandDNA, input.brief, input.previousValidatedOutputs, input.studioItems || []);
  const brandContext = selected.filter((c) => c.source === "brandDNA");
  const briefContext = selected.filter((c) => c.source === "projectBrief");
  const priorDecisionContext = selected.filter((c) => c.source === "priorOutput");
  const studioBrainContext = selected.filter((c) => c.source === "studioBrain");

  let selectedKnowledge = selectKnowledgeForWebsiteStep(step, input.targetModel);

  const rebuildSections = (
    contextForRebuild: typeof selected,
    knowledgeForRebuild: typeof selectedKnowledge
  ) =>
    buildWebsiteStepSections({
      step,
      profile,
      projectName: input.projectName,
      userIntent: input.userIntent,
      desiredOutputFormat: input.desiredOutputFormat,
      brandContext: contextForRebuild.filter((c) => c.source === "brandDNA"),
      briefContext: contextForRebuild.filter((c) => c.source === "projectBrief"),
      priorDecisionContext: contextForRebuild.filter((c) => c.source === "priorOutput"),
      studioBrainContext: contextForRebuild.filter((c) => c.source === "studioBrain"),
      selectedKnowledge: knowledgeForRebuild,
    });

  const initialSections = rebuildSections([...brandContext, ...briefContext, ...priorDecisionContext, ...studioBrainContext], selectedKnowledge);

  const budgetConfig = {
    ...defaultBudgetForWebsiteStep(step, profile),
    ...(input.budgetOverride?.maxChars ? { maxChars: input.budgetOverride.maxChars } : {}),
    ...(input.budgetOverride?.maxEstimatedTokens ? { maxEstimatedTokens: input.budgetOverride.maxEstimatedTokens } : {}),
    ...(input.budgetOverride?.reservedOutputTokens ? { reservedOutputTokens: input.budgetOverride.reservedOutputTokens } : {}),
  };

  const budgetResult = applyBudget(
    {
      sections: initialSections,
      selectedContext: [...brandContext, ...briefContext, ...priorDecisionContext, ...studioBrainContext],
      omittedContext: omitted,
      selectedKnowledge,
      budget: budgetConfig,
    },
    rebuildSections
  );

  selectedKnowledge = budgetResult.compressedKnowledge;
  const finalSections = budgetResult.compressedSections;
  const finalPrompt = assembleFinalPrompt(finalSections);

  const hasOutputFormatStatement = finalSections.some((s) => s.id === "outputStructure" && s.content.trim().length > 0);
  const hasAudienceContext = budgetResult.compressedContext.some((c) => c.key === "brand.audience" || c.key === "brief.specificContext");

  const warnings = runPromptOptimizer({
    finalPrompt,
    step,
    profile,
    selectedContext: budgetResult.compressedContext,
    budgetReport: budgetResult.report,
    hasAudienceContext,
    hasOutputFormatStatement,
  });

  const qualityReport = scorePrompt({
    finalPrompt,
    sections: finalSections,
    selectedContext: budgetResult.compressedContext,
    selectedKnowledge,
    budgetReport: budgetResult.report,
    warnings,
    hasOutputFormatStatement,
    hasAudienceContext,
    hasVerificationChecklist: finalSections.some((s) => s.id === "verificationChecklist" && s.content.trim().length > 0),
  });

  const sourceTrace: SourceTraceEntry[] = [
    ...selectedKnowledge.map((k): SourceTraceEntry => ({
      kind: "knowledge",
      refId: k.id,
      label: k.title,
      note: `${k.sourceDocument}${k.sourcePageOrSection ? ` — ${k.sourcePageOrSection}` : ""} (pertinence ${k.relevance}).`,
    })),
    ...budgetResult.compressedContext.map((c): SourceTraceEntry => ({
      kind: c.source === "brandDNA" ? "brandDNA" : c.source === "projectBrief" ? "projectBrief" : c.source === "priorOutput" ? "priorOutput" : "studioBrain",
      refId: c.key,
      label: c.label,
      note: c.reason,
    })),
  ];

  return {
    builderVersion: BUILDER_VERSION,
    promptVersion: genPromptVersion(),
    createdAt: new Date().toISOString(),
    module: input.module,
    workflowStep: input.workflowStep,
    chainStepId: input.chainStepId,
    targetModel: input.targetModel,
    finalPrompt,
    sections: finalSections,
    selectedContext: budgetResult.compressedContext,
    omittedContext: omitted,
    selectedKnowledge,
    budgetReport: budgetResult.report,
    qualityReport,
    warnings,
    sourceTrace,
    nextStep: nextWebsiteChainStepId(step.id),
  };
}
