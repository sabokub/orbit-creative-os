"use client";

import { AnalysisResult, DeliverableStatus, StudioBrainChangeProposal } from "@/lib/responseAnalysis/types";
import { VersionDiff } from "@/lib/responseAnalysis/versioning";
import CommandIcon from "./CommandIcon";

const STATUS_META: Record<DeliverableStatus, { label: string; className: string }> = {
  complete: { label: "Complet", className: "bg-[#c3d995] text-black" },
  partial: { label: "Partiel", className: "bg-[#f5df75] text-black" },
  missing: { label: "Manquant", className: "bg-red-200 text-red-900" },
};

function ScoreBar({ label, score }: { label: string; score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-black text-black/60">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/10">
        <div
          className={`h-full rounded-full ${clamped >= 70 ? "bg-[#7ca34d]" : clamped >= 40 ? "bg-[#e0b846]" : "bg-red-400"}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

export interface ResponseAnalysisReviewProps {
  analysis: AnalysisResult;
  versionDiff: VersionDiff;
  onToggleChange: (id: string) => void;
  onSaveDraft: () => void;
  onValidate: () => void;
  onKeepRawOnly: () => void;
  onReanalyze: () => void;
  onRetryAnalysis?: () => void;
  saving: boolean;
  versionActionRequired: boolean;
  onVersionAction: (action: "replace" | "merge" | "new_version" | "cancel") => void;
}

export default function ResponseAnalysisReview({
  analysis,
  versionDiff,
  onToggleChange,
  onSaveDraft,
  onValidate,
  onKeepRawOnly,
  onReanalyze,
  onRetryAnalysis,
  saving,
  versionActionRequired,
  onVersionAction,
}: ResponseAnalysisReviewProps) {
  const semanticUnavailable = !analysis.semanticAnalysisPerformed;
  const quotaExceeded = semanticUnavailable && /quota|billing|insufficient_quota|credit|429/i.test(analysis.semanticAnalysisError || "");
  const exploitabilityMeta: Record<AnalysisResult["exploitability"], { label: string; className: string }> = {
    ready: { label: "Prêt à intégrer", className: "bg-[#c3d995]" },
    needs_edits: { label: "À corriger", className: "bg-[#f5df75]" },
    not_usable: { label: "Pas exploitable", className: "bg-red-200 text-red-900" },
  };
  const expMeta = exploitabilityMeta[analysis.exploitability];

  return (
    <section className="command-card space-y-6 p-5 sm:p-7" data-testid="analysis-review">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="command-label">{semanticUnavailable ? "Analyse partielle" : "Analyse terminée"}</span>
          <h2 className="display-serif mt-2 text-4xl sm:text-5xl">
            {semanticUnavailable ? "Analyse IA indisponible." : "Examine avant d’intégrer."}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-black/60">
            {semanticUnavailable
              ? "Orbit conserve la réponse brute et les constats structurels fiables. Aucun score ni verdict non vérifié n’est affiché."
              : analysis.summary}
          </p>
        </div>
        <span className={`command-pill shrink-0 ${semanticUnavailable ? "bg-[#f5df75] text-black" : expMeta.className}`}>
          {semanticUnavailable ? "À réessayer" : expMeta.label}
        </span>
      </div>

      {!semanticUnavailable && !analysis.matchesExpectedModule && (
        <p className="rounded-[16px] border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
          {analysis.documentType === "unknown"
            ? "Le type de document n'a pas pu être déterminé avec certitude."
            : `Cette réponse semble correspondre à un autre module (détecté : "${analysis.documentType}").`}
        </p>
      )}

      {semanticUnavailable && (
        <div className="rounded-[20px] border border-amber-300 bg-amber-50 p-4 text-amber-950">
          <p className="text-sm font-black">
            {quotaExceeded ? "Crédit API épuisé." : "Service d’analyse IA temporairement indisponible."}
          </p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-900/75">
            {quotaExceeded
              ? "Recharge le crédit OpenAI API, puis relance l’analyse. La facturation API est distincte de l’abonnement ChatGPT."
              : "Relance l’analyse plus tard. Orbit ne transforme pas une erreur technique en mauvaise note pour le livrable."}
          </p>
        </div>
      )}

      {semanticUnavailable ? (
        <div className="rounded-[18px] border border-black/12 bg-black/[0.025] p-4">
          <p className="text-sm font-black">Évaluation masquée</p>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-black/55">
            Complétude, qualité, cohérence Brand DNA, cohérence brief et exploitabilité nécessitent une analyse sémantique réussie.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-black/55">
            <span className="command-pill bg-white">Réponse brute conservée</span>
            <span className="command-pill bg-white">{analysis.extractedSections.length} section(s) détectée(s)</span>
            {analysis.placeholders.length > 0 && (
              <span className="command-pill bg-white">{analysis.placeholders.length} placeholder(s) explicite(s)</span>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <ScoreBar label="Complétude" score={analysis.completenessScore} />
          <ScoreBar label="Qualité" score={analysis.qualityScore} />
          <ScoreBar label="Cohérence Brand DNA" score={analysis.brandCoherence.score} />
          <ScoreBar label="Cohérence brief" score={analysis.briefCoherence.score} />
        </div>
      )}

      {versionDiff.hasPreviousVersion && versionDiff.significant && (
        <div className="rounded-[18px] border border-black/15 bg-[#bdd8f8]/40 p-4">
          <p className="text-sm font-black">Une version précédente de ce livrable existe.</p>
          <p className="mt-1 text-xs font-semibold text-black/60">
            {versionDiff.addedSections.length > 0 && `${versionDiff.addedSections.length} section(s) ajoutée(s). `}
            {versionDiff.removedSections.length > 0 && `${versionDiff.removedSections.length} section(s) supprimée(s). `}
            {versionDiff.changedSections.length > 0 && `${versionDiff.changedSections.length} section(s) modifiée(s).`}
          </p>
          {versionActionRequired && !semanticUnavailable && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => onVersionAction("replace")} className="command-button command-button-soft text-xs">Remplacer</button>
              <button onClick={() => onVersionAction("merge")} className="command-button command-button-soft text-xs">Fusionner</button>
              <button onClick={() => onVersionAction("new_version")} className="command-button command-button-soft text-xs">Enregistrer comme nouvelle version</button>
              <button onClick={() => onVersionAction("cancel")} className="command-button command-button-soft text-xs">Annuler</button>
            </div>
          )}
        </div>
      )}

      {!semanticUnavailable && (
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.1em] text-black/50">
            Livrables ({analysis.detectedDeliverables.filter((d) => d.status === "complete").length}/{analysis.detectedDeliverables.length} complets)
          </p>
          <ul className="space-y-2">
            {analysis.detectedDeliverables.map((d) => (
              <li key={d.id} className="rounded-[14px] border border-black/10 bg-white/55 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-black">{d.label}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] ${STATUS_META[d.status].className}`}>
                    {STATUS_META[d.status].label}
                  </span>
                </div>
                {d.reasons.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-xs font-semibold text-black/50">
                    {d.reasons.map((reason, index) => <li key={index}>· {reason}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!semanticUnavailable && (analysis.warnings.length > 0 || analysis.placeholders.length > 0 || analysis.contradictions.length > 0) && (
        <div className="space-y-2">
          {analysis.warnings.map((warning, index) => (
            <p key={`w-${index}`} className="rounded-[14px] border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">{warning}</p>
          ))}
          {analysis.placeholders.length > 0 && (
            <p className="rounded-[14px] border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">
              Placeholders détectés : {analysis.placeholders.join(", ")}
            </p>
          )}
          {analysis.contradictions.map((contradiction, index) => (
            <p key={`c-${index}`} className="rounded-[14px] border border-red-300 bg-red-50 px-3 py-2 text-xs font-bold text-red-800">{contradiction}</p>
          ))}
        </div>
      )}

      {!semanticUnavailable && analysis.proposedStudioBrainChanges.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-black uppercase tracking-[0.1em] text-black/50">Changements proposés au Studio Brain</p>
          <ul className="space-y-2">
            {analysis.proposedStudioBrainChanges.map((change: StudioBrainChangeProposal) => (
              <li key={change.id} className="flex items-start gap-3 rounded-[14px] border border-black/10 bg-white/55 p-3">
                <input
                  type="checkbox"
                  checked={change.accepted}
                  onChange={() => onToggleChange(change.id)}
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-label={change.description}
                />
                <span className="text-xs font-semibold leading-relaxed text-black/70">{change.description}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!semanticUnavailable && analysis.recommendedNextActions.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.1em] text-black/50">Prochaines actions recommandées</p>
          <ul className="space-y-1 text-xs font-semibold text-black/60">
            {analysis.recommendedNextActions.map((action, index) => <li key={index}>· {action}</li>)}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <button onClick={onReanalyze} className="command-button command-button-soft" disabled={saving}>
          <CommandIcon name="arrow" className="h-4 w-4 rotate-180" /> Modifier la réponse
        </button>
        <div className="flex flex-wrap gap-2">
          <button onClick={onKeepRawOnly} disabled={saving} className="command-button command-button-soft disabled:opacity-40">
            Garder seulement la réponse brute
          </button>
          <button onClick={onSaveDraft} disabled={saving} className="command-button command-button-soft disabled:opacity-40">
            Enregistrer comme brouillon
          </button>
          {semanticUnavailable ? (
            <button onClick={onRetryAnalysis || onReanalyze} disabled={saving} className="command-button min-w-[200px] disabled:cursor-not-allowed disabled:opacity-40">
              <CommandIcon name="sparkles" className="h-4 w-4" /> Réessayer l’analyse
            </button>
          ) : (
            <button onClick={onValidate} disabled={saving} className="command-button min-w-[200px] disabled:cursor-not-allowed disabled:opacity-40">
              <CommandIcon name={saving ? "clock" : "check"} className="h-4 w-4" />
              {saving ? "Intégration…" : "Examiner et intégrer"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
