"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ConversationAnalysis,
  ConversationSource,
  ExternalConversation,
  ExternalTarget,
  ProgressEntry,
  SyncStatusReport,
} from "@/lib/sync/contracts";
import {
  addProgress,
  exportContext,
  getSyncStatus,
  importConversation,
  listConversations,
  listProgress,
} from "@/lib/syncClient";

const SOURCES: ConversationSource[] = ["chatgpt", "claude", "claude-code", "manual-import"];

export default function ConversationsSyncPage() {
  const { id: projectId } = useParams<{ id: string }>();

  const [conversations, setConversations] = useState<ExternalConversation[]>([]);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [status, setStatus] = useState<SyncStatusReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const [source, setSource] = useState<ConversationSource>("chatgpt");
  const [paste, setPaste] = useState("");
  const [analysis, setAnalysis] = useState<ConversationAnalysis | null>(null);
  const [objective, setObjective] = useState("");
  const [contextOut, setContextOut] = useState("");

  const refresh = useCallback(async () => {
    const [c, p, s] = await Promise.all([listConversations(projectId), listProgress(projectId), getSyncStatus(projectId)]);
    setConversations(c);
    setProgress(p);
    setStatus(s);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    refresh().catch((e) => setError((e as Error).message)).finally(() => setLoading(false));
  }, [refresh]);

  async function guard(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function doImport() {
    await guard("import", async () => {
      const { analysis: a } = await importConversation(projectId, source, paste, undefined);
      setAnalysis(a);
      setPaste("");
      await refresh();
    });
  }

  async function doExport(target: ExternalTarget) {
    await guard(`export-${target}`, async () => {
      const res = await exportContext(projectId, target, objective || undefined);
      setContextOut(res.text);
    });
  }

  if (loading) return <div className="h-[520px] animate-pulse rounded-[34px] bg-white/45" />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="command-label">Source de vérité centrale</span>
          <h1 className="display-serif mt-3 text-5xl leading-[0.95] sm:text-6xl">Conversations &amp; Sync</h1>
          <p className="mt-2 text-sm font-medium text-black/52">ChatGPT, Claude, Claude Code et Orbit alimentent un même historique.</p>
        </div>
        <Link href={`/projects/${projectId}`} className="command-button command-button-soft self-start">Retour au projet</Link>
      </header>

      {error && <p className="rounded-[20px] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p>}

      {status && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Conversations", value: status.conversationCount },
            { label: "Entrées journal", value: status.progressCount },
            { label: "En attente", value: status.pendingConversations },
            { label: "Conflits", value: status.openConflicts },
          ].map((s) => (
            <div key={s.label} className="command-card-flat p-4">
              <p className="text-3xl font-black">{s.value}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-black/45">{s.label}</p>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-2">
        {/* Import */}
        <div className="command-card p-5">
          <span className="command-label">Importer / coller une conversation</span>
          <div className="mt-3 flex flex-wrap gap-2">
            {SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-black ${source === s ? "bg-black text-white" : "bg-black/[0.05] text-black/55"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <textarea
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            rows={8}
            placeholder="Colle ici la conversation ChatGPT / Claude, un rapport, ou un export…"
            className="mt-3 w-full px-4 py-3 font-mono text-[13px]"
          />
          <button onClick={doImport} disabled={!paste.trim() || Boolean(busy)} className="command-button mt-3 disabled:opacity-40">
            {busy === "import" ? "Analyse…" : "Importer & extraire"}
          </button>

          {analysis && (
            <div className="mt-4 rounded-[16px] border border-black/10 bg-black/[0.02] p-4">
              <p className="text-xs font-black">Extraction ({analysis.items.length} élément·s)</p>
              <p className="mt-1 text-xs font-medium text-black/55">{analysis.summary}</p>
              {analysis.contradictions.length > 0 && (
                <p className="mt-2 rounded bg-red-50 px-2 py-1 text-[11px] font-bold text-red-800">
                  ⚠ {analysis.contradictions.join(" ")}
                </p>
              )}
              <ul className="mt-2 space-y-1">
                {analysis.items.slice(0, 12).map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 rounded bg-black/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase">{it.kind}</span>
                    <span className="font-medium text-black/70">{it.content}</span>
                    {it.requiresConfirmation && <span className="ml-auto text-[9px] font-bold text-amber-700">à confirmer</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Context export */}
        <div className="command-card p-5">
          <span className="command-label">Paquet de contexte pour un assistant</span>
          <input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Objectif de la session (optionnel)…"
            className="mt-3 w-full px-4 py-3 text-sm font-medium"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {(["chatgpt", "claude", "claude-code"] as ExternalTarget[]).map((t) => (
              <button key={t} onClick={() => doExport(t)} disabled={Boolean(busy)} className="command-button command-button-soft px-3 py-1.5 text-xs disabled:opacity-40">
                {busy === `export-${t}` ? "…" : `Contexte ${t}`}
              </button>
            ))}
          </div>
          {contextOut && (
            <>
              <textarea readOnly value={contextOut} rows={12} className="mt-3 w-full px-4 py-3 font-mono text-[12px]" />
              <button onClick={() => navigator.clipboard?.writeText(contextOut)} className="command-button mt-2 px-3 py-1.5 text-xs">
                Copier
              </button>
            </>
          )}
        </div>
      </section>

      {/* Progress journal */}
      <section className="command-card p-5">
        <div className="flex items-center justify-between">
          <span className="command-label">Journal d’avancement</span>
          <button
            onClick={() => guard("note", async () => { await addProgress(projectId, "Note manuelle", undefined); await refresh(); })}
            disabled={Boolean(busy)}
            className="command-button command-button-soft px-3 py-1.5 text-xs disabled:opacity-40"
          >
            + Note rapide
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {progress.length === 0 && <p className="text-xs font-semibold text-black/45">Aucune entrée. Importe une conversation ou ajoute une note.</p>}
          {progress.map((p) => (
            <div key={p.id} className="rounded-[14px] border border-black/8 bg-white/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black">
                  <span className="mr-2 rounded bg-black/[0.06] px-1.5 py-0.5 text-[9px] uppercase">{p.source}</span>
                  {p.summary}
                </span>
                <span className="text-[10px] font-semibold text-black/40">{new Date(p.date).toLocaleString("fr-FR")}</span>
              </div>
              {p.details && <p className="mt-1 text-xs font-medium text-black/55">{p.details}</p>}
              {(p.commitSha || p.pullRequest || p.branch) && (
                <p className="mt-1 text-[10px] font-bold text-black/40">
                  {p.branch && `branche ${p.branch} · `}{p.commitSha && `commit ${p.commitSha.slice(0, 7)} · `}{p.pullRequest}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
