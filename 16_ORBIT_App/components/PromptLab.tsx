"use client";

import { useEffect, useState } from "react";
import { Project } from "@/lib/types";
import { AnalysisResult } from "@/lib/responseAnalysis/types";
import { VersionDiff } from "@/lib/responseAnalysis/versioning";
import { PromptBuildResult, TargetModel } from "@/lib/promptIntelligence/types";
import { PROMPT_TARGET_MODELS } from "@/lib/promptIntelligence/knowledge/schema";
import { ChainStepWithState, buildWebsitePrompt, fetchWebsiteChain, promptMetaFromBuildResult } from "@/lib/promptIntelligenceClient";
import { analyzeResponse, applyAnalysis, ApplyMode, VersionAction, clearDraft, loadDraft, saveDraft } from "@/lib/responseAnalysisClient";
import ResponseAnalysisReview from "@/components/ResponseAnalysisReview";
import CommandIcon from "@/components/CommandIcon";

type LabPhase = "idle" | "building" | "built" | "generating" | "analyzing" | "analysis_failed" | "review_ready" | "saving" | "saved";

const MODEL_LABELS: Record<TargetModel, string> = {
  "openai-text": "OpenAI — texte",
  "claude-text": "Claude — texte",
  "openai-image": "OpenAI — image",
  "nano-banana-image": "Nano Banana / Gemini — image",
  "sora-video": "Sora — vidéo",
  "manual-export": "Export manuel",
};

const MIN_MANUAL_LENGTH = 20;

export interface PromptLabProps {
  project: Project;
  onProjectUpdated: (project: Project) => void;
}

/**
 * Prompt Lab — the UI for the Website prompt chain (issue #13 section 12).
 * Progressive disclosure: the prompt + top-line stats are always visible,
 * everything else (selected context, knowledge/source trace, budget
 * breakdown, version history) is behind expandable sections.
 */
export default function PromptLab({ project, onProjectUpdated }: PromptLabProps) {
  const [steps, setSteps] = useState<ChainStepWithState[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [targetModel, setTargetModel] = useState<TargetModel>("openai-text");

  const [phase, setPhase] = useState<LabPhase>("idle");
  const [buildResult, setBuildResult] = useState<PromptBuildResult | null>(null);
  const [buildError, setBuildError] = useState("");
  const [editedPrompt, setEditedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [pasted, setPasted] = useState("");
  const [genError, setGenError] = useState("");
  const [analyzeError, setAnalyzeError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [versionDiff, setVersionDiff] = useState<VersionDiff | null>(null);
  const [versionActionRequired, setVersionActionRequired] = useState(false);
  const [pendingMode, setPendingMode] = useState<ApplyMode>("validate");

  const [showContext, setShowContext] = useState(false);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showBudget, setShowBudget] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchWebsiteChain(project.id)
      .then((loaded) => {
        setSteps(loaded);
        const firstIncomplete = loaded.find((s) => !s.hasValidatedOutput && s.deliverableIds.length > 0) || loaded[0];
        setCurrentStepId(firstIncomplete.id);
        setTargetModel(firstIncomplete.targetModel);
      })
      .catch((err) => setLoadError((err as Error).message));
  }, [project.id]);

  const currentStep = steps?.find((s) => s.id === currentStepId) || null;

  useEffect(() => {
    if (!currentStep) return;
    setTargetModel(currentStep.targetModel);
    setBuildResult(null);
    setEditedPrompt(null);
    setPhase("idle");
    setPasted("");
    setAnalysis(null);
    setVersionDiff(null);
    setAnalyzeError("");
    setSaveError("");
    setGenError("");
    const draft = loadDraft(project.id, "website", currentStep.id);
    if (draft) setPasted(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `currentStep` is recomputed every render from `steps`; only its id should retrigger this reset.
  }, [currentStep?.id, project.id]);

  if (loadError) {
    return <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{loadError}</div>;
  }
  if (!steps || !currentStep) {
    return <div className="h-40 animate-pulse rounded-[24px] bg-white/45" />;
  }

  const busy = phase === "building" || phase === "generating" || phase === "analyzing" || phase === "saving";
  const activePrompt = editedPrompt ?? buildResult?.finalPrompt ?? "";

  async function runBuild() {
    if (!currentStep) return;
    setPhase("building");
    setBuildError("");
    try {
      const result = await buildWebsitePrompt({ projectId: project.id, chainStepId: currentStep.id, targetModel });
      setBuildResult(result);
      setEditedPrompt(null);
      setPhase("built");
    } catch (err) {
      setBuildError((err as Error).message);
      setPhase("idle");
    }
  }

  async function copyPrompt() {
    if (!activePrompt) return;
    try {
      await navigator.clipboard.writeText(activePrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — no-op, the prompt is still selectable/visible.
    }
  }

  function updatePasted(value: string) {
    setPasted(value);
    if (currentStep) saveDraft(project.id, "website", value, currentStep.id);
  }

  async function generateAuto() {
    if (!currentStep || busy) return;
    setPhase("generating");
    setGenError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, step: "website", chainStepId: currentStep.id, targetModel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Requête échouée (${response.status})`);
      if (data.buildResult) setBuildResult(data.buildResult);
      updatePasted(data.output);
      await runAnalysis(data.output);
    } catch (err) {
      setGenError((err as Error).message);
      setPhase("built");
    }
  }

  async function runAnalysis(text: string) {
    if (!currentStep) return;
    const trimmed = text.trim();
    if (!trimmed) {
      setAnalyzeError("La réponse est vide — colle ou génère un contenu avant de l'analyser.");
      return;
    }
    if (trimmed.length < MIN_MANUAL_LENGTH) {
      setAnalyzeError(`La réponse semble trop courte pour être analysée (minimum ${MIN_MANUAL_LENGTH} caractères).`);
      return;
    }
    setPhase("analyzing");
    setAnalyzeError("");
    setVersionActionRequired(false);
    try {
      const { analysis: result, versionDiff: diff } = await analyzeResponse({
        projectId: project.id,
        workflowStep: "website",
        reviewTarget: currentStep.id,
        promptId: buildResult?.promptVersion,
        rawResponse: text,
        source: phase === "generating" ? "openai" : "manual",
        expectedDeliverables: currentStep.deliverableIds,
      });
      setAnalysis(result);
      setVersionDiff(diff);
      setPhase("review_ready");
    } catch (err) {
      setAnalyzeError((err as Error).message || "L'analyse a échoué.");
      setPhase("analysis_failed");
    }
  }

  function toggleChange(id: string) {
    setAnalysis((current) =>
      current
        ? { ...current, proposedStudioBrainChanges: current.proposedStudioBrainChanges.map((c) => (c.id === id ? { ...c, accepted: !c.accepted } : c)) }
        : current
    );
  }

  async function handleApply(mode: ApplyMode, versionAction?: VersionAction) {
    if (!currentStep || !analysis || !buildResult) return;
    if (phase === "saving") return;
    setPendingMode(mode);
    setPhase("saving");
    setSaveError("");
    try {
      const result = await applyAnalysis({
        projectId: project.id,
        workflowStep: "website",
        reviewTarget: currentStep.id,
        analysis,
        mode,
        versionAction,
        ifMatch: project.updated_at,
        chainStepId: currentStep.id,
        promptMeta: promptMetaFromBuildResult(buildResult, editedPrompt || undefined),
      });
      onProjectUpdated(result.project);
      setPhase("saved");
      setVersionActionRequired(false);
      clearDraft(project.id, "website", currentStep.id);
      setPasted("");
      setAnalysis(null);
      setVersionDiff(null);
      fetchWebsiteChain(project.id).then(setSteps).catch(() => undefined);
    } catch (err) {
      const e = err as Error & { status?: number; payload?: { versionDiff?: VersionDiff; requiresVersionAction?: boolean } };
      if (e.status === 409 && e.payload?.requiresVersionAction) {
        setVersionDiff(e.payload.versionDiff || versionDiff);
        setVersionActionRequired(true);
        setSaveError(e.message);
        setPhase("review_ready");
        return;
      }
      setSaveError(e.message || "L'intégration a échoué.");
      setPhase("review_ready");
    }
  }

  function goToNextStep() {
    if (buildResult?.nextStep) {
      setCurrentStepId(buildResult.nextStep);
      return;
    }
    if (currentStep && steps) {
      const idx = steps.findIndex((s) => s.id === currentStep.id);
      if (idx >= 0 && idx < steps.length - 1) setCurrentStepId(steps[idx + 1].id);
    }
  }

  const budget = buildResult?.budgetReport;
  const quality = buildResult?.qualityReport;

  return (
    <section className="command-card space-y-5 p-5 sm:p-6" data-testid="prompt-lab">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="command-label">Prompt Lab — Chaîne Website</span>
          <h2 className="display-serif mt-2 text-3xl sm:text-4xl">{currentStep.title}</h2>
          <p className="mt-1 text-xs font-semibold text-black/50">{currentStep.purpose}</p>
        </div>
        <span className="text-xs font-black text-black/40">Étape {currentStep.order}/13</span>
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={() => setCurrentStepId(s.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black ${
              s.id === currentStep.id ? "border-black bg-black text-white" : "border-black/10 bg-white/60 text-black/48 hover:bg-white hover:text-black"
            }`}
          >
            {s.order}. {s.title}
            {s.hasValidatedOutput && <span className="h-1.5 w-1.5 rounded-full bg-[#7ca34d]" />}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="text-xs font-black text-black/50">
          Modèle cible
          <select
            value={targetModel}
            onChange={(e) => setTargetModel(e.target.value as TargetModel)}
            className="ml-2 rounded-[12px] border border-black/15 bg-white px-3 py-2 text-xs font-bold"
          >
            {PROMPT_TARGET_MODELS.map((m) => (
              <option key={m} value={m}>
                {MODEL_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        <button onClick={runBuild} disabled={busy} className="command-button command-button-soft disabled:opacity-40">
          <CommandIcon name={phase === "building" ? "clock" : "bolt"} className="h-4 w-4" />
          {phase === "building" ? "Construction…" : buildResult ? "Reconstruire le prompt (Optimiser)" : "Construire le prompt"}
        </button>
      </div>

      {buildError && <p className="rounded-[16px] border border-red-300 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">{buildError}</p>}

      {buildResult && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="command-pill bg-[#bdd8f8]">{buildResult.budgetReport.estimatedPromptChars} caractères</span>
            <span className="command-pill bg-[#cfc5f4]">~{buildResult.budgetReport.estimatedPromptTokens} tokens</span>
            <span
              className={`command-pill ${
                budget?.status === "within_budget" ? "bg-[#c3d995]" : budget?.status === "compressed" ? "bg-[#f5df75]" : "bg-red-200 text-red-900"
              }`}
            >
              Budget : {budget?.status === "within_budget" ? "dans le budget" : budget?.status === "compressed" ? "compressé" : "dépassé"}
            </span>
            <span className="command-pill bg-[#f2b8cf]">Score qualité : {quality?.total}/100</span>
          </div>

          {buildResult.warnings.length > 0 && (
            <div className="space-y-1.5">
              {buildResult.warnings.map((w) => (
                <p
                  key={w.id}
                  className={`rounded-[14px] border px-3 py-2 text-xs font-bold ${
                    w.severity === "critical"
                      ? "border-red-300 bg-red-50 text-red-800"
                      : w.severity === "warning"
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : "border-black/15 bg-black/[0.03] text-black/60"
                  }`}
                >
                  {w.message}
                </p>
              ))}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <span className="command-label">Le prompt final</span>
              <button onClick={copyPrompt} className="command-button command-button-soft text-xs">
                <CommandIcon name="link" className="h-3.5 w-3.5" /> {copied ? "Copié !" : "Copier le prompt"}
              </button>
            </div>
            <textarea
              value={activePrompt}
              onChange={(e) => setEditedPrompt(e.target.value)}
              rows={12}
              className="mt-3 min-h-[220px] w-full rounded-[16px] border border-black/12 bg-white/70 px-4 py-3 font-mono text-[12px] leading-relaxed"
            />
            {editedPrompt !== null && editedPrompt !== buildResult.finalPrompt && (
              <p className="mt-1.5 text-[10px] font-bold text-black/40">Prompt édité manuellement — l&apos;édition est tracée dans l&apos;historique de version.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={generateAuto} disabled={busy} className="command-button disabled:opacity-40">
              <CommandIcon name={phase === "generating" ? "clock" : "sparkles"} className="h-4 w-4" />
              {phase === "generating" ? "Génération…" : "Générer avec OpenAI"}
            </button>
          </div>
          {genError && <p className="rounded-[16px] border border-red-300 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">{genError}</p>}

          <div className="space-y-2">
            <button onClick={() => setShowContext((v) => !v)} className="text-xs font-black text-black/50 underline underline-offset-2">
              {showContext ? "Masquer" : "Voir"} le contexte sélectionné ({buildResult.selectedContext.length} inclus, {buildResult.omittedContext.length} omis)
            </button>
            {showContext && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[14px] border border-black/10 bg-white/55 p-3">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-black/45">Inclus</p>
                  <ul className="space-y-1 text-[11px] font-semibold text-black/65">
                    {buildResult.selectedContext.map((c) => (
                      <li key={c.key}>
                        <strong>{c.label}</strong> — {c.reason}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[14px] border border-black/10 bg-black/[0.02] p-3">
                  <p className="mb-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-black/45">Omis</p>
                  <ul className="space-y-1 text-[11px] font-semibold text-black/45">
                    {buildResult.omittedContext.map((c) => (
                      <li key={c.key}>
                        <strong>{c.label}</strong> — {c.omittedReason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button onClick={() => setShowKnowledge((v) => !v)} className="text-xs font-black text-black/50 underline underline-offset-2">
              {showKnowledge ? "Masquer" : "Voir"} la trace des sources ({buildResult.selectedKnowledge.length} règle(s) de connaissance)
            </button>
            {showKnowledge && (
              <ul className="space-y-1.5 text-[11px] font-semibold text-black/65">
                {buildResult.sourceTrace.map((t, i) => (
                  <li key={i} className="rounded-[12px] border border-black/10 bg-white/55 px-3 py-2">
                    <span className="font-black">{t.label}</span> — {t.note}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <button onClick={() => setShowBudget((v) => !v)} className="text-xs font-black text-black/50 underline underline-offset-2">
              {showBudget ? "Masquer" : "Voir"} le détail du budget
            </button>
            {showBudget && budget && (
              <div className="space-y-1 text-[11px] font-semibold text-black/60">
                {budget.actionsTaken.map((a, i) => (
                  <p key={i}>· {a}</p>
                ))}
                {budget.bySection.map((s) => (
                  <p key={s.id}>
                    {s.id} — {s.chars} caractères ({s.percentOfTotal}% du total){s.overBudget ? " — dépasse son budget dédié" : ""}
                  </p>
                ))}
              </div>
            )}
          </div>

          {currentStep.versionHistory.length > 0 && (
            <div className="space-y-2">
              <button onClick={() => setShowHistory((v) => !v)} className="text-xs font-black text-black/50 underline underline-offset-2">
                {showHistory ? "Masquer" : "Voir"} l&apos;historique de versions ({currentStep.versionHistory.length})
              </button>
              {showHistory && (
                <ul className="space-y-1.5 text-[11px] font-semibold text-black/60">
                  {currentStep.versionHistory.map((v) => (
                    <li key={v.id} className="flex items-center justify-between gap-2 rounded-[12px] border border-black/10 bg-white/55 px-3 py-2">
                      <span>
                        {new Date(v.createdAt).toLocaleString("fr-FR")} — score {v.qualityScore}/100 — {v.outcomeStatus}
                      </span>
                      <button onClick={() => setEditedPrompt(v.finalPrompt)} className="command-button command-button-soft text-[10px]">
                        Restaurer
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      {buildResult && phase !== "review_ready" && phase !== "saved" && (
        <section className="rounded-[20px] border border-black/10 bg-white/55 p-4 sm:p-5">
          <p className="text-sm font-black">Colle la réponse du modèle, puis analyse-la.</p>
          <textarea
            value={pasted}
            onChange={(e) => updatePasted(e.target.value)}
            rows={10}
            className="mt-3 min-h-[200px] w-full rounded-[16px] border border-black/12 bg-white px-4 py-3 font-mono text-[12px] leading-relaxed"
            placeholder="Colle ici la réponse pour cette étape uniquement."
          />
          {analyzeError && <p className="mt-2 rounded-[14px] border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">{analyzeError}</p>}
          <div className="mt-3 flex justify-end">
            <button onClick={() => runAnalysis(pasted)} disabled={!pasted.trim() || busy} className="command-button disabled:opacity-40">
              <CommandIcon name={phase === "analyzing" ? "clock" : "check"} className="h-4 w-4" />
              {phase === "analyzing" ? "Analyse…" : "Analyser la réponse"}
            </button>
          </div>
        </section>
      )}

      {analysis && versionDiff && (phase === "review_ready" || phase === "saving") && (
        <>
          {saveError && <p className="rounded-[16px] border border-red-300 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">{saveError}</p>}
          <ResponseAnalysisReview
            analysis={analysis}
            versionDiff={versionDiff}
            onToggleChange={toggleChange}
            onSaveDraft={() => handleApply("draft")}
            onValidate={() => handleApply("validate")}
            onKeepRawOnly={() => handleApply("raw_only")}
            onReanalyze={() => {
              setPhase("built");
              setAnalysis(null);
              setVersionDiff(null);
            }}
            saving={phase === "saving"}
            versionActionRequired={versionActionRequired}
            onVersionAction={(action) => (action === "cancel" ? (setVersionActionRequired(false), setSaveError("")) : handleApply(pendingMode, action))}
          />
        </>
      )}

      {phase === "saved" && (
        <div className="rounded-[20px] border border-[#7ca34d]/30 bg-[#c3d995]/40 p-5 text-center">
          <p className="text-sm font-black">Étape validée et enregistrée.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <button onClick={goToNextStep} className="command-button">
              <CommandIcon name="arrow" className="h-4 w-4" /> Continuer à l&apos;étape suivante
            </button>
            <button onClick={() => setPhase("built")} className="command-button command-button-soft">
              Rester sur cette étape
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
