"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Project, WorkflowStep } from "@/lib/types";
import { getProject } from "@/lib/storage";
import { buildPrompt, STEP_LABELS, STEP_ORDER } from "@/lib/prompts";
import { getBrandProfile } from "@/lib/brandProfile";
import PromptPreview from "@/components/PromptPreview";
import CommandIcon, { CommandIconName } from "@/components/CommandIcon";
import ResponseAnalysisReview from "@/components/ResponseAnalysisReview";
import PromptLab from "@/components/PromptLab";
import { AnalysisResult, AnalysisSource } from "@/lib/responseAnalysis/types";
import { VersionDiff } from "@/lib/responseAnalysis/versioning";
import {
  analyzeResponse,
  applyAnalysis,
  ApplyMode,
  VersionAction,
  clearDraft,
  loadDraft,
  saveDraft,
} from "@/lib/responseAnalysisClient";

const STEP_META: Record<WorkflowStep, { icon: CommandIconName; accent: string; caption: string }> = {
  strategy: { icon: "strategy", accent: "bg-[#f5df75]", caption: "Transforme le brief en colonne vertébrale stratégique." },
  creative: { icon: "sparkles", accent: "bg-[#f2b8cf]", caption: "Traduis la stratégie en territoire visuel." },
  website: { icon: "website", accent: "bg-[#bdd8f8]", caption: "Construis la structure, les textes, l’UX et la direction image." },
  content: { icon: "content", accent: "bg-[#f1a36f]", caption: "Crée un système de publication réutilisable." },
  images: { icon: "image", accent: "bg-[#cfc5f4]", caption: "Conçois des prompts visuels cohérents et prêts pour la production." },
  review: { icon: "critic", accent: "bg-[#c3d995]", caption: "Repère ce qui affaiblit le livrable avant sa diffusion." },
};

/** Runner pipeline states (spec: Réponse reçue -> Analyse en cours -> Analyse terminée -> Review -> Validation -> Projet mis à jour). */
type Phase = "idle" | "generating" | "analyzing" | "analysis_failed" | "review_ready" | "saving" | "saved";

const MIN_MANUAL_LENGTH = 20;

function RunnerContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const step = (searchParams.get("step") as WorkflowStep) || "strategy";

  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [reviewTarget, setReviewTarget] = useState<WorkflowStep>("website");
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState("");
  const [genError, setGenError] = useState("");
  const [analyzeError, setAnalyzeError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [versionDiff, setVersionDiff] = useState<VersionDiff | null>(null);
  const [versionActionRequired, setVersionActionRequired] = useState(false);
  const [pendingMode, setPendingMode] = useState<ApplyMode>("validate");
  const [lastSource, setLastSource] = useState<AnalysisSource>("manual");
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    getProject(params.id)
      .then(setProject)
      .catch((err) => setError((err as Error).message));
    setPasted("");
    setGenError("");
    setAnalyzeError("");
    setSaveError("");
    setPhase("idle");
    setAnalysis(null);
    setVersionDiff(null);
    setVersionActionRequired(false);
    setDraftRestored(false);
  }, [params.id, step]);

  // Restore a manual draft (localStorage, scoped per project+step+reviewTarget)
  // once the project is known — never overwrites text already in the box.
  useEffect(() => {
    if (!project) return;
    const draft = loadDraft(project.id, step, step === "review" ? reviewTarget : undefined);
    if (draft) {
      setPasted((current) => (current ? current : draft));
      setDraftRestored(true);
    }
  }, [project, step, reviewTarget]);

  if (error) return <div className="rounded-[22px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>;
  if (project === undefined) return <div className="h-[520px] animate-pulse rounded-[34px] bg-white/45" />;
  if (project === null) return <div className="command-card p-8 text-center"><p className="display-serif text-4xl">Projet introuvable.</p><Link href="/" className="command-button mt-5">Retour à l’accueil</Link></div>;

  const priorOutputs = Object.fromEntries(
    Object.entries(project.outputs).map(([key, value]) => [key, value?.content || ""])
  ) as Partial<Record<WorkflowStep, string>>;

  const brand = getBrandProfile(project.brief.brandProfileId);
  const prompt = step === "review"
    ? buildPrompt("review", brand, project.name, project.brief, priorOutputs, reviewTarget)
    : buildPrompt(step, brand, project.name, project.brief, priorOutputs);
  const meta = STEP_META[step];
  const draftKeyTarget = step === "review" ? reviewTarget : undefined;
  const busy = phase === "generating" || phase === "analyzing" || phase === "saving";

  function updatePasted(value: string) {
    setPasted(value);
    setDraftRestored(false);
    if (project) saveDraft(project.id, step, value, draftKeyTarget);
  }

  async function runAnalysis(text: string, source: AnalysisSource) {
    if (!project) return;
    if (phase === "analyzing") return; // reentrancy guard — no overlapping analysis calls
    const trimmed = text.trim();
    if (!trimmed) {
      setAnalyzeError("La réponse est vide — colle ou génère un contenu avant de l’analyser.");
      return;
    }
    if (source === "manual" && trimmed.length < MIN_MANUAL_LENGTH) {
      setAnalyzeError(`La réponse semble trop courte pour être analysée (minimum ${MIN_MANUAL_LENGTH} caractères).`);
      return;
    }
    setLastSource(source);
    setPhase("analyzing");
    setAnalyzeError("");
    setVersionActionRequired(false);
    try {
      const { analysis: result, versionDiff: diff } = await analyzeResponse({
        projectId: project.id,
        workflowStep: step,
        reviewTarget: draftKeyTarget,
        rawResponse: text,
        source,
      });
      setAnalysis(result);
      setVersionDiff(diff);
      setPhase("review_ready");
    } catch (err) {
      setAnalyzeError((err as Error).message || "L’analyse a échoué.");
      setPhase("analysis_failed");
    }
  }

  async function generateAuto() {
    if (!project || busy) return;
    setPhase("generating");
    setGenError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          step,
          reviewTarget: step === "review" ? reviewTarget : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Requête échouée (${response.status})`);
      updatePasted(data.output);
      await runAnalysis(data.output, "openai");
    } catch (err) {
      setGenError((err as Error).message);
      setPhase("idle");
    }
  }

  function toggleChange(id: string) {
    setAnalysis((current) =>
      current
        ? {
            ...current,
            proposedStudioBrainChanges: current.proposedStudioBrainChanges.map((c) =>
              c.id === id ? { ...c, accepted: !c.accepted } : c
            ),
          }
        : current
    );
  }

  async function handleApply(mode: ApplyMode, versionAction?: VersionAction) {
    if (!project || !analysis) return;
    if (phase === "saving") return; // reentrancy guard — no double-submit
    setPendingMode(mode);
    setPhase("saving");
    setSaveError("");
    try {
      const result = await applyAnalysis({
        projectId: project.id,
        workflowStep: step,
        reviewTarget: draftKeyTarget,
        analysis,
        mode,
        versionAction,
        ifMatch: project.updated_at,
      });
      setProject(result.project);
      setPhase("saved");
      setVersionActionRequired(false);
      clearDraft(project.id, step, draftKeyTarget);
      setPasted("");
      setAnalysis(null);
      setVersionDiff(null);
    } catch (err) {
      const e = err as Error & { status?: number; payload?: { versionDiff?: VersionDiff; requiresVersionAction?: boolean } };
      if (e.status === 409 && e.payload?.requiresVersionAction) {
        setVersionDiff(e.payload.versionDiff || versionDiff);
        setVersionActionRequired(true);
        setSaveError(e.message);
        setPhase("review_ready");
        return;
      }
      setSaveError(e.message || "L’intégration a échoué.");
      setPhase("review_ready");
    }
  }

  function onVersionAction(action: VersionAction) {
    if (action === "cancel") {
      setVersionActionRequired(false);
      setSaveError("");
      return;
    }
    void handleApply(pendingMode, action);
  }

  function onReanalyze() {
    setPhase("idle");
    setAnalysis(null);
    setVersionDiff(null);
    setVersionActionRequired(false);
    setAnalyzeError("");
    setSaveError("");
  }

  function clearAll() {
    updatePasted("");
    setAnalysis(null);
    setVersionDiff(null);
    setPhase("idle");
    setAnalyzeError("");
    setSaveError("");
    if (project) clearDraft(project.id, step, draftKeyTarget);
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="command-label"><CommandIcon name={meta.icon} className="h-3.5 w-3.5" /> Moteur ORBIT</span>
          <h1 className="display-serif mt-3 text-5xl leading-[0.95] sm:text-7xl">{STEP_LABELS[step]}</h1>
          <p className="mt-3 text-sm font-medium text-black/52">{meta.caption} <span className="font-black text-black/75">{project.name}</span></p>
        </div>
        <Link href={`/projects/${project.id}`} className="command-button command-button-soft self-start"><CommandIcon name="arrow" className="h-4 w-4 rotate-180" /> Retour au projet</Link>
      </header>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {STEP_ORDER.map((item) => {
          const itemMeta = STEP_META[item];
          const active = item === step;
          return (
            <Link
              key={item}
              href={`/projects/${project.id}/run?step=${item}`}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${active ? "border-black bg-black text-white" : "border-black/10 bg-white/60 text-black/48 hover:bg-white hover:text-black"}`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${active ? itemMeta.accent + " text-black" : "bg-black/[0.05]"}`}><CommandIcon name={itemMeta.icon} className="h-3.5 w-3.5" /></span>
              {STEP_LABELS[item]}
              {project.outputs[item] && <span className="h-2 w-2 rounded-full bg-[#7ca34d]" />}
            </Link>
          );
        })}
      </div>

      {step === "website" && (
        <PromptLab project={project} onProjectUpdated={setProject} />
      )}

      {step === "website" && (
        <div className="rounded-[18px] border border-black/12 bg-black/[0.02] px-4 py-3 text-xs font-bold text-black/50">
          Prompt historique (legacy) ci-dessous — toujours disponible pour comparaison, un livrable à la fois avec la chaîne modulaire ci-dessus reste recommandé.
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          {step === "review" && (
            <div className="command-card-flat p-4 sm:p-5">
              <label className="command-label">Livrable à relire</label>
              <select value={reviewTarget} onChange={(event) => setReviewTarget(event.target.value as WorkflowStep)} className="mt-3 px-4 py-3 text-sm font-bold">
                {(["website", "content", "images", "strategy", "creative"] as WorkflowStep[]).map((target) => <option key={target} value={target}>{STEP_LABELS[target]}</option>)}
              </select>
            </div>
          )}

          <div className="command-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><span className="command-label">Plan d’instructions</span><h2 className="display-serif mt-2 text-4xl">Le prompt</h2></div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 ${meta.accent}`}><CommandIcon name={meta.icon} className="h-5 w-5" /></span>
            </div>
            <div className="mt-5"><PromptPreview prompt={prompt} /></div>
          </div>
        </div>

        <aside className="space-y-4 xl:col-span-5">
          <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-white/78 p-5 shadow-[0_14px_34px_rgba(70,68,57,0.05)] sm:p-6">
            <div className={`absolute -right-10 -top-12 h-44 w-44 rounded-full opacity-60 ${meta.accent}`} />
            <div className="relative">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-black/42">Génération automatique</span>
              <h2 className="display-serif mt-3 text-4xl">Laisse ORBIT faire le gros du travail.</h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-black/52">La réponse passe automatiquement par l’analyse ORBIT, puis rien n’est sauvegardé sans ta validation explicite.</p>
              <button onClick={generateAuto} disabled={busy} className="command-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50">
                <CommandIcon name={phase === "generating" ? "clock" : "sparkles"} className="h-4 w-4" />
                {phase === "generating" ? "Génération…" : phase === "analyzing" && lastSource === "openai" ? "Analyse…" : "Générer avec OpenAI"}
              </button>
              <p className="mt-3 text-[10px] font-semibold leading-relaxed text-black/38">Nécessite OPENAI_API_KEY sur Vercel. Le copier-coller manuel reste disponible sans clé.</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/12 bg-[#f5df75] p-5">
            <span className="command-label">Mode manuel</span>
            <p className="mt-2 text-sm font-black leading-snug">Copie le prompt dans ChatGPT ou Claude, colle la réponse ci-dessous, puis clique “Analyser la réponse”.</p>
          </div>
        </aside>
      </section>

      {genError && <p className="rounded-[20px] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{genError}</p>}

      {phase !== "review_ready" && phase !== "saved" && (
        <section className="command-card p-5 sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="command-label">Zone d’import</span><h2 className="display-serif mt-2 text-4xl sm:text-5xl">Colle ou génère, puis analyse.</h2></div>
            <span className="command-pill bg-[#c3d995]">Aucune sauvegarde automatique</span>
          </div>

          {draftRestored && pasted && (
            <p className="mt-4 rounded-[16px] border border-black/15 bg-black/[0.03] px-4 py-2.5 text-xs font-bold text-black/60">
              Brouillon restauré depuis ta dernière session sur cette étape.
            </p>
          )}

          <textarea
            value={pasted}
            onChange={(event) => updatePasted(event.target.value)}
            rows={16}
            className="mt-6 min-h-[360px] px-4 py-4 font-mono text-[13px] leading-relaxed placeholder:font-sans placeholder:text-black/25"
            placeholder="Colle ou génère le livrable ici. L’analyse ORBIT détecte les livrables, les manques et les placeholders avant toute sauvegarde."
          />

          {analyzeError && (
            <p className="mt-4 rounded-[18px] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{analyzeError}</p>
          )}

          <div className="mt-5 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-xs font-semibold leading-relaxed text-black/42">
              {phase === "analysis_failed"
                ? "L’analyse a échoué mais ta réponse n’est pas perdue — corrige puis réessaie."
                : "Rien n’est intégré à la mémoire du projet avant l’étape de validation qui suit l’analyse."}
            </p>
            <div className="flex gap-2">
              <button onClick={clearAll} disabled={!pasted || busy} className="command-button command-button-soft disabled:opacity-35">Effacer</button>
              <button
                onClick={() => runAnalysis(pasted, "manual")}
                disabled={!pasted.trim() || busy}
                className="command-button min-w-[200px] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CommandIcon name={phase === "analyzing" ? "clock" : "check"} className="h-4 w-4" />
                {phase === "analyzing" ? "Analyse…" : "Analyser la réponse"}
              </button>
            </div>
          </div>
        </section>
      )}

      {analysis && versionDiff && (phase === "review_ready" || phase === "saving") && (
        <>
          {saveError && <p className="rounded-[20px] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{saveError}</p>}
          <ResponseAnalysisReview
            analysis={analysis}
            versionDiff={versionDiff}
            onToggleChange={toggleChange}
            onSaveDraft={() => handleApply("draft")}
            onValidate={() => handleApply("validate")}
            onKeepRawOnly={() => handleApply("raw_only")}
            onReanalyze={onReanalyze}
            saving={phase === "saving"}
            versionActionRequired={versionActionRequired}
            onVersionAction={onVersionAction}
          />
        </>
      )}

      {phase === "saved" && (
        <section className="command-card p-6 text-center sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#c3d995] mx-auto"><CommandIcon name="check" className="h-6 w-6" /></span>
          <h2 className="display-serif mt-4 text-4xl">Projet mis à jour.</h2>
          <p className="mt-2 text-sm font-semibold text-black/52">Le livrable et l’analyse sont enregistrés dans la mémoire du projet.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setPhase("idle")} className="command-button command-button-soft">Analyser une nouvelle réponse</button>
            <Link href={`/projects/${project.id}`} className="command-button">Retour au projet</Link>
          </div>
        </section>
      )}
    </div>
  );
}

export default function WorkflowRunnerPage() {
  return <Suspense fallback={<div className="h-[520px] animate-pulse rounded-[34px] bg-white/45" />}><RunnerContent /></Suspense>;
}
