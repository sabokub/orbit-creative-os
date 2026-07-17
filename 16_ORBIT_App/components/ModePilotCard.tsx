"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useWorkMode } from "@/contexts/WorkModeContext";
import { getPilot, setFocus, completeFocus } from "@/lib/workModesClient";
import { ChartSpec, ModePilotData } from "@/lib/workModes/pilot/types";
import CommandIcon, { CommandIconName } from "./CommandIcon";

const STATUS_STYLE: Record<ModePilotData["status"], { label: string; cls: string }> = {
  "on-track": { label: "En bonne voie", cls: "bg-[#c3d995] text-black" },
  "at-risk": { label: "À risque", cls: "bg-[#f5df75] text-black" },
  blocked: { label: "Bloqué", cls: "bg-[#f2b8cf] text-black" },
  idle: { label: "À démarrer", cls: "bg-black/[0.06] text-black/55" },
  done: { label: "Terminé", cls: "bg-[#98b85f] text-white" },
};

function SegmentsChart({ data }: { data: ChartSpec["data"] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-xs font-semibold text-black/40">Données insuffisantes</p>;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full border border-black/10">
        {data.map((d) => d.value > 0 && <div key={d.label} style={{ width: `${(d.value / total) * 100}%`, background: d.color }} title={`${d.label}: ${d.value}`} />)}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {data.map((d) => (
          <span key={d.label} className="flex items-center gap-1 text-[10px] font-bold text-black/55">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.label} {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function BarsChart({ data }: { data: ChartSpec["data"] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <p className="text-xs font-semibold text-black/40">Données insuffisantes</p>;
  return (
    <div className="space-y-1.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="w-20 shrink-0 truncate text-[10px] font-bold text-black/55">{d.label}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-black/[0.05]">
            <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: d.color }} />
          </div>
          <span className="w-8 shrink-0 text-right text-[10px] font-black">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

function MeterChart({ data }: { data: ChartSpec["data"] }) {
  const d = data[0];
  if (!d) return <p className="text-xs font-semibold text-black/40">Données insuffisantes</p>;
  const pct = d.value <= 100 ? d.value : null;
  return (
    <div>
      <p className="text-3xl font-black">{d.value}{pct !== null && d.label === "Score" ? "/100" : ""}</p>
      {pct !== null && (
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-black/[0.05]">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: d.color }} />
        </div>
      )}
    </div>
  );
}

function Chart({ spec }: { spec: ChartSpec }) {
  return (
    <div className="rounded-[14px] border border-black/8 bg-white/60 p-3">
      <p className="text-[11px] font-black text-black/60">{spec.title}</p>
      <div className="mt-2">
        {spec.insufficient ? (
          <p className="text-xs font-semibold text-black/40">{spec.note || "Données insuffisantes"}</p>
        ) : spec.kind === "segments" ? (
          <SegmentsChart data={spec.data} />
        ) : spec.kind === "bars" ? (
          <BarsChart data={spec.data} />
        ) : (
          <MeterChart data={spec.data} />
        )}
      </div>
    </div>
  );
}

/**
 * ModePilotCard — the single detailed steering card for the ACTIVE mode. Shows
 * Level 1 (objective, progress, one immediate priority, next action, blocker,
 * deadline, "Continuer") ALWAYS before Level 2 (mode-specific charts), so it
 * reads top-to-bottom on mobile with no horizontal carousel. Recomputes on
 * demand (Actualiser) and after any focus action — the API recalculates live
 * from Studio Brain / memory / progress.
 */
export default function ModePilotCard() {
  const { mode, config, focusMode, setFocusMode } = useWorkMode();
  const [data, setData] = useState<ModePilotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newFocus, setNewFocus] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData(await getPilot(mode));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  async function act(fn: () => Promise<unknown>) {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-[28px] bg-white/45" />;

  if (error) {
    return (
      <section className="command-card p-5">
        <span className="command-label">Carte de pilotage — {config.label}</span>
        <p className="mt-2 text-sm font-bold text-red-800">{error}</p>
        <button onClick={() => void load()} className="command-button command-button-soft mt-3 px-3 py-1.5 text-xs">Réessayer</button>
      </section>
    );
  }
  if (!data) return null;

  const status = STATUS_STYLE[data.status];
  const focus = data.focus;

  return (
    <section className="command-card overflow-hidden p-5 sm:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#e6edcd]">
          <CommandIcon name={config.icon as CommandIconName} className="h-5 w-5" />
        </span>
        <div>
          <span className="command-label">Carte de pilotage</span>
          <h2 className="display-serif text-3xl leading-none">{data.modeLabel}</h2>
        </div>
        <span className={`ml-auto rounded-full px-3 py-1 text-[10px] font-black uppercase ${status.cls}`}>{status.label}</span>
        <div className="flex gap-2">
          <button onClick={() => void load()} disabled={busy} className="command-button command-button-soft px-3 py-1.5 text-xs disabled:opacity-40">↻</button>
          <button onClick={() => setFocusMode(!focusMode)} className="command-button px-3 py-1.5 text-xs">
            {focusMode ? "Quitter Focus" : "Focus"}
          </button>
        </div>
      </div>

      {/* Level 1 — always visible, before charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <span className="command-label">Objectif actif</span>
          {focus ? (
            <>
              <p className="mt-1 text-lg font-black">{focus.title}</p>
              {focus.description && <p className="text-xs font-medium text-black/55">{focus.description}</p>}
            </>
          ) : (
            <div className="mt-1 flex gap-2">
              <input value={newFocus} onChange={(e) => setNewFocus(e.target.value)} placeholder="Définir l'objectif principal…" className="flex-1 px-3 py-2 text-sm font-medium" />
              <button
                onClick={() => newFocus.trim() && act(() => setFocus(mode, { title: newFocus.trim() }).then(() => setNewFocus("")))}
                disabled={busy || !newFocus.trim()}
                className="command-button px-3 py-2 text-xs disabled:opacity-40"
              >
                Définir
              </button>
            </div>
          )}

          {/* Immediate priority — single */}
          {data.immediatePriority && (
            <div className="mt-3 rounded-[14px] border border-black/10 bg-[#f5df75]/40 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-black/45">Priorité immédiate</p>
              <p className="mt-0.5 text-sm font-black">{data.immediatePriority.title}</p>
              <p className="mt-0.5 text-xs font-medium text-black/60">{data.immediatePriority.reason}</p>
              <p className="mt-1 text-[11px] font-bold text-black/50">→ {data.immediatePriority.nextAction} · confiance {Math.round(data.immediatePriority.confidence * 100)}%</p>
            </div>
          )}

          {/* Primary action */}
          {data.primaryAction && (
            <Link href={data.primaryAction.href} className="command-button mt-3 inline-flex">
              <CommandIcon name="arrow" className="h-4 w-4" /> {data.primaryAction.label}
            </Link>
          )}
        </div>

        <div className="space-y-3 lg:col-span-2">
          {/* Progress */}
          <div className="rounded-[14px] border border-black/8 bg-white/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-black/45">Progression</span>
              <span className="text-lg font-black">{data.progress.reliable ? `${data.progress.percentage}%` : "—"}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-black/[0.05]">
              <div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${data.progress.reliable ? data.progress.percentage : 0}%` }} />
            </div>
            <p className="mt-1 text-[10px] font-medium text-black/40">{data.progress.reliable ? data.progress.method : "Données insuffisantes"}</p>
          </div>

          {/* Blocker */}
          {data.primaryBlocker && (
            <div className="rounded-[14px] border border-[#f2b8cf] bg-[#fdf1f5] p-3">
              <p className="text-[10px] font-black uppercase text-red-700">Blocage principal</p>
              <p className="mt-0.5 text-xs font-black">{data.primaryBlocker.title}</p>
              <p className="text-[11px] font-medium text-black/60">{data.primaryBlocker.impact}</p>
              {data.primaryBlocker.action?.href && <Link href={data.primaryBlocker.action.href} className="mt-1 inline-block text-[11px] font-black underline">{data.primaryBlocker.action.label}</Link>}
            </div>
          )}

          {/* Nearest deadline */}
          {data.nearestDeadline && (
            <div className="rounded-[14px] border border-black/8 bg-white/60 p-3">
              <p className="text-[10px] font-black uppercase text-black/45">Échéance la plus proche</p>
              <p className="mt-0.5 text-xs font-black">{data.nearestDeadline.title}</p>
              <p className={`text-[11px] font-bold ${data.nearestDeadline.overdue ? "text-red-700" : "text-black/50"}`}>
                {new Date(data.nearestDeadline.date).toLocaleDateString("fr-FR")}{data.nearestDeadline.overdue ? " · en retard" : ""}
              </p>
            </div>
          )}

          {focus && (
            <button onClick={() => act(() => completeFocus(mode, focus.id))} disabled={busy} className="command-button command-button-soft w-full px-3 py-1.5 text-xs disabled:opacity-40">
              Marquer l&apos;objectif terminé
            </button>
          )}
        </div>
      </div>

      {/* Cross-mode blockers */}
      {!focusMode && data.crossModeBlockers.length > 0 && (
        <div className="mt-4 space-y-2">
          {data.crossModeBlockers.map((b, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-[12px] border border-amber-300 bg-amber-50 px-3 py-2 text-xs">
              <span className="font-black text-amber-900">⚠ {b.title}</span>
              <span className="text-black/55">{b.impact}</span>
              <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[9px] font-bold uppercase">mode {b.sourceMode}</span>
              {b.action?.href && <Link href={b.action.href} className="ml-auto font-black underline">{b.action.label}</Link>}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {data.empty && (
        <div className="mt-4 rounded-[14px] border border-dashed border-black/15 bg-black/[0.02] p-4 text-center">
          <p className="text-sm font-bold text-black/55">{data.empty.message}</p>
          <Link href={data.empty.actionHref} className="command-button mt-2 inline-flex px-3 py-1.5 text-xs">{data.empty.actionLabel}</Link>
        </div>
      )}

      {/* Level 2 — charts (hidden in focus mode) */}
      {!focusMode && data.charts.length > 0 && (
        <div className="mt-5 border-t border-black/8 pt-4">
          <span className="command-label">Indicateurs du mode</span>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {data.charts.map((spec) => (
              <Chart key={spec.id} spec={spec} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
