"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStudioBrain } from "@/contexts/StudioBrainContext";
import { scoreAll, sortByPriority } from "@/lib/priority";
import { formatShortDate } from "@/lib/format";
import CommandIcon from "@/components/CommandIcon";
import PriorityBadge from "@/components/PriorityBadge";
import { tierStyleForPriority } from "@/lib/importanceColor";

const STATUS_WEIGHT: Record<string, number> = { done: 1, in_progress: 0.6, today: 0.4, blocked: 0.2, backlog: 0, archived: 1 };

function progress(items: { status: string }[]): number {
  if (!items.length) return 0;
  const total = items.reduce((sum, it) => sum + (STATUS_WEIGHT[it.status] ?? 0), 0);
  return Math.round((total / items.length) * 100);
}

export default function StudioHealthPage() {
  const { items, decisions, loaded, error } = useStudioBrain();
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const active = items.filter((it) => it.status !== "archived");
  const tasks = active.filter((it) => it.kind === "task");
  const content = active.filter((it) => it.kind === "content");
  const blocked = active.filter((it) => it.status === "blocked");
  const pendingDecisions = decisions.filter((d) => d.status === "pending");

  const launchProgress = progress(active);
  const taskProgress = progress(tasks);
  const contentProgress = progress(content);

  const scores = useMemo(() => scoreAll(items), [items]);
  const openTasks = sortByPriority(
    tasks.filter((it) => it.status !== "done"),
    scores
  ).slice(0, 8);

  const byCategory = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const it of active) {
      const key = it.kind === "task" ? it.category : it.channel || "Contenu";
      const bucket = map.get(key) || { done: 0, total: 0 };
      bucket.total += 1;
      if (it.status === "done") bucket.done += 1;
      map.set(key, bucket);
    }
    return [...map.entries()]
      .map(([label, v]) => ({ label, progress: v.total ? Math.round((v.done / v.total) * 100) : 0, total: v.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [active]);

  async function runFullSync() {
    setSyncing(true);
    setSyncMessage("");
    try {
      const ids = ["redis", "github", "vercel"] as const;
      const results = await Promise.all(
        ids.map((id) =>
          fetch("/api/studio/integrations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          }).then((r) => r.json())
        )
      );
      setSyncMessage(`Synchronisé : ${results.map((r) => r.label).join(", ")}`);
    } catch (err) {
      setSyncMessage((err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 pb-36 lg:pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="command-label">
            <CommandIcon name="sparkles" className="h-3.5 w-3.5" /> Studio Pulse
          </span>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Santé globale de 24March Studio</h1>
          <p className="mt-1 text-sm text-black/48">Une seule vue pour savoir si le studio avance vraiment.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button type="button" onClick={() => void runFullSync()} disabled={syncing} className="command-button self-start">
            ↻ {syncing ? "Synchronisation…" : "Synchroniser tout"}
          </button>
          {syncMessage && <p className="text-[10px] font-semibold text-black/45">{syncMessage}</p>}
        </div>
      </header>

      {error && <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="rounded-[24px] border border-black/10 bg-[#eef7ff] p-5">
          <p className="command-label">Lancement</p>
          <p className="mt-2 text-4xl font-black">{launchProgress}%</p>
        </article>
        <article className="rounded-[24px] border border-black/10 bg-[#f2f7e8] p-5">
          <p className="command-label">Tâches</p>
          <p className="mt-2 text-4xl font-black">{taskProgress}%</p>
        </article>
        <article className="rounded-[24px] border border-black/10 bg-[#fff8e5] p-5">
          <p className="command-label">Contenus</p>
          <p className="mt-2 text-4xl font-black">{contentProgress}%</p>
        </article>
        <article className="rounded-[24px] border border-black/10 bg-[#f5effd] p-5">
          <p className="command-label">Décisions</p>
          <p className="mt-2 text-4xl font-black">{pendingDecisions.length}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-black/10 bg-white/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="command-label">Chantiers</p>
              <h2 className="mt-1 text-xl font-black">Progression par catégorie</h2>
            </div>
            <span className="command-pill bg-[#e6edcd]">{byCategory.length}</span>
          </div>
          <div className="mt-5 space-y-4">
            {loaded &&
              byCategory.map((track) => (
                <div key={track.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
                  <div>
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-black">{track.label}</p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/7">
                      <div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${track.progress}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-black">{track.progress}%</span>
                </div>
              ))}
            {loaded && !byCategory.length && <p className="text-sm text-black/45">Pas encore de données.</p>}
          </div>
        </article>

        <article className="rounded-[28px] border border-black/10 bg-[#fff0f5] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="command-label">Risques</p>
              <h2 className="mt-1 text-xl font-black">Ce qui peut ralentir le lancement</h2>
            </div>
            <span className="command-pill bg-white">{blocked.length}</span>
          </div>
          <div className="mt-4 space-y-3">
            {loaded &&
              blocked.map((item) => {
                const dep = items.find((it) => item.dependsOn.includes(it.id) && it.status !== "done");
                return (
                  <Link key={item.id} href="/timeline" className="block rounded-[18px] bg-white/75 p-4">
                    <p className="text-sm font-black">{item.title}</p>
                    <p className="mt-1 text-[11px] text-black/45">Bloqué par : {dep?.title || "une dépendance"}</p>
                  </Link>
                );
              })}
            {loaded && !blocked.length && <p className="text-sm text-black/45">Aucun risque bloquant détecté.</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-[28px] border border-black/10 bg-white/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="command-label">Charge</p>
              <h2 className="mt-1 text-xl font-black">Travail encore ouvert, par priorité</h2>
            </div>
            <Link href="/studio/content" className="text-[10px] font-black uppercase">
              Gérer →
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {loaded &&
              openTasks.map((item) => {
                const priority = scores.get(item.id)!;
                const tier = tierStyleForPriority(priority);
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 rounded-[16px] border border-black/8 ${tier.cardBorder} ${tier.cardTint} bg-[#fffdf8] p-3`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{item.title}</p>
                      <p className="mt-1 truncate text-[11px] text-black/45">
                        {item.category} · {item.estimateMinutes} min
                      </p>
                    </div>
                    <PriorityBadge result={priority} />
                  </div>
                );
              })}
            {loaded && !openTasks.length && <p className="text-sm text-black/45">Rien d&apos;ouvert.</p>}
          </div>
        </article>
        <article className="rounded-[28px] border border-black/10 bg-white/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="command-label">Décisions</p>
              <h2 className="mt-1 text-xl font-black">À trancher</h2>
            </div>
            <Link href="/" className="text-[10px] font-black uppercase">
              Détails →
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {loaded &&
              pendingDecisions.map((decision) => (
                <div key={decision.id} className="rounded-[16px] border border-black/8 bg-[#fffdf8] p-3">
                  <p className="text-sm font-black">{decision.question}</p>
                  {decision.context && <p className="mt-1 text-[11px] text-black/45">{decision.context}</p>}
                  {decision.source && <p className="mt-1 text-[9px] font-black uppercase text-black/30">source : {decision.source}</p>}
                </div>
              ))}
            {loaded && !pendingDecisions.length && <p className="text-sm text-black/45">Aucune décision en attente.</p>}
          </div>
        </article>
      </section>

      <p className="text-right text-[9px] font-semibold uppercase tracking-[0.1em] text-black/30">
        Dernière échéance planifiée : {formatShortDate("2026-08-31")} — rien après le 31 août.
      </p>
    </div>
  );
}
