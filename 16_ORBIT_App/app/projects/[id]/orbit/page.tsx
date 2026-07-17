"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AgentRole, MemoryEntry, MemoryStatus, OrchestrationRun } from "@/lib/agents/contracts";
import { PIPELINE_ORDER } from "@/lib/agents/contracts";
import {
  AgentRosterItem,
  listAgents,
  listMemory,
  listRuns,
  runAgent,
  runPipeline,
  runReview,
  setMemoryStatus,
} from "@/lib/agentsClient";

const STATUS_STYLE: Record<string, string> = {
  not_run: "bg-black/[0.06] text-black/50",
  draft: "bg-[#bdd8f8] text-black",
  reviewed: "bg-[#f5df75] text-black",
  approved: "bg-[#c3d995] text-black",
  rejected: "bg-red-200 text-red-900",
  superseded: "bg-black/[0.06] text-black/40",
  completed: "bg-[#c3d995] text-black",
  failed: "bg-red-200 text-red-900",
  skipped: "bg-[#f5df75] text-black",
  running: "bg-[#bdd8f8] text-black",
  idle: "bg-black/[0.06] text-black/40",
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${STATUS_STYLE[status] ?? "bg-black/[0.06]"}`}>
      {status}
    </span>
  );
}

export default function OrbitConsolePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [agents, setAgents] = useState<AgentRosterItem[]>([]);
  const [memory, setMemory] = useState<MemoryEntry[]>([]);
  const [runs, setRuns] = useState<OrchestrationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState("");
  const [intent, setIntent] = useState("");

  const refresh = useCallback(async () => {
    const [a, m, r] = await Promise.all([listAgents(projectId), listMemory(projectId), listRuns(projectId)]);
    setAgents(a);
    setMemory(m);
    setRuns(r);
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    refresh()
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [refresh]);

  async function guard(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  const activeMemory = useMemo(() => memory.filter((e) => e.status !== "superseded"), [memory]);

  function exportMemory() {
    const lines = ["# Orbit — mémoire projet", ""];
    for (const e of activeMemory) {
      lines.push(`## [${e.type}] ${e.title} — ${e.status}`, "", e.content, "");
      if (e.data) lines.push("```json", JSON.stringify(e.data, null, 2), "```", "");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orbit-${projectId}-memoire.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <div className="h-[520px] animate-pulse rounded-[34px] bg-white/45" />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="command-label">Creative Operating System</span>
          <h1 className="display-serif mt-3 text-5xl leading-[0.95] sm:text-6xl">Console Orbit</h1>
          <p className="mt-2 text-sm font-medium text-black/52">
            Agents spécialisés, mémoire partagée, orchestration de bout en bout.
          </p>
        </div>
        <Link href={`/projects/${projectId}`} className="command-button command-button-soft self-start">Retour au projet</Link>
      </header>

      {error && <p className="rounded-[20px] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p>}

      <section className="command-card p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <span className="command-label">Orchestration</span>
            <h2 className="display-serif mt-2 text-3xl">Pipeline complet</h2>
            <p className="mt-1 text-xs font-semibold text-black/45">
              {PIPELINE_ORDER.join(" → ")}
            </p>
          </div>
        </div>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          rows={2}
          placeholder="Intention optionnelle pour cette exécution (facultatif)…"
          className="mt-4 w-full px-4 py-3 text-sm font-medium"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => guard("pipeline", () => runPipeline(projectId, intent || undefined))}
            disabled={Boolean(busy)}
            className="command-button disabled:opacity-40"
          >
            {busy === "pipeline" ? "Exécution…" : "Lancer le pipeline complet"}
          </button>
          <button
            onClick={() => guard("review", () => runReview(projectId))}
            disabled={Boolean(busy)}
            className="command-button command-button-soft disabled:opacity-40"
          >
            {busy === "review" ? "Analyse…" : "Lancer Orbit Critic"}
          </button>
          <button onClick={exportMemory} disabled={activeMemory.length === 0} className="command-button command-button-soft disabled:opacity-40">
            Exporter la mémoire
          </button>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <h2 className="command-label">Agents</h2>
          {agents.map((agent) => (
            <div key={agent.role} className="command-card-flat p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">{agent.title}</p>
                  <p className="mt-0.5 text-xs font-medium text-black/50">{agent.description}</p>
                </div>
                <Badge status={agent.status} />
              </div>
              {agent.summary && agent.status !== "not_run" && (
                <p className="mt-2 text-xs font-medium text-black/60">{agent.summary}</p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => guard(agent.role, () => runAgent(projectId, agent.role as AgentRole, intent || undefined))}
                  disabled={Boolean(busy)}
                  className="command-button command-button-soft px-3 py-1.5 text-xs disabled:opacity-40"
                >
                  {busy === agent.role ? "…" : agent.status === "not_run" ? "Lancer" : "Relancer"}
                </button>
                {agent.memoryId && (agent.status === "draft" || agent.status === "reviewed") && (
                  <>
                    <button
                      onClick={() => guard(agent.role, () => setMemoryStatus(projectId, agent.memoryId!, "approved" as MemoryStatus))}
                      disabled={Boolean(busy)}
                      className="command-button px-3 py-1.5 text-xs disabled:opacity-40"
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => guard(agent.role, () => setMemoryStatus(projectId, agent.memoryId!, "rejected" as MemoryStatus))}
                      disabled={Boolean(busy)}
                      className="command-button command-button-soft px-3 py-1.5 text-xs disabled:opacity-40"
                    >
                      Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="command-label">Mémoire projet ({activeMemory.length})</h2>
          {activeMemory.length === 0 && (
            <p className="command-card-flat p-4 text-xs font-semibold text-black/45">
              Aucune mémoire pour l’instant. Lance un agent ou le pipeline.
            </p>
          )}
          {activeMemory.map((e) => (
            <details key={e.id} className="command-card-flat p-4">
              <summary className="flex cursor-pointer items-center justify-between gap-3">
                <span className="text-xs font-black">
                  <span className="mr-2 rounded bg-black/[0.06] px-1.5 py-0.5 text-[9px] uppercase">{e.type}</span>
                  {e.title}
                </span>
                <Badge status={e.status} />
              </summary>
              <p className="mt-2 text-xs font-medium text-black/60">{e.content}</p>
              {e.data && (
                <pre className="mt-2 max-h-64 overflow-auto rounded-[12px] bg-black/[0.03] p-3 text-[11px] leading-relaxed">
                  {JSON.stringify(e.data, null, 2)}
                </pre>
              )}
            </details>
          ))}

          <h2 className="command-label mt-4">Runs récents</h2>
          {runs.slice(0, 5).map((run) => (
            <div key={run.id} className="command-card-flat p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black">{run.mode}</span>
                <Badge status={run.status} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {run.steps.map((s) => (
                  <span key={s.role} className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${STATUS_STYLE[s.status] ?? ""}`}>
                    {s.role}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
