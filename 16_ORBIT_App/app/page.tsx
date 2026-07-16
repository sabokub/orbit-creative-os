"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PriorityResult, Project, STUDIO_LAUNCH_MOMENT, StudioItem } from "@/lib/types";
import { listProjects } from "@/lib/storage";
import { daysUntil, scoreAll, sortByPriority } from "@/lib/priority";
import { relativeTime, formatShortDate } from "@/lib/format";
import CommandIcon from "@/components/CommandIcon";
import PanelTitle from "@/components/PanelTitle";
import MetricCard from "@/components/MetricCard";
import PriorityBadge from "@/components/PriorityBadge";
import { useStudioBrain } from "@/contexts/StudioBrainContext";

const LAUNCH_DATE = new Date(STUDIO_LAUNCH_MOMENT);

function ItemRow({
  item,
  scoreLabel,
  extra,
  onDone,
}: {
  item: StudioItem;
  scoreLabel: PriorityResult;
  extra?: string;
  onDone?: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[18px] border border-black/8 bg-[#fffdf8] p-3">
      {onDone && (
        <button
          type="button"
          onClick={() => onDone(item.id)}
          aria-label="Marquer comme terminé"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/12 bg-white text-black/35 hover:border-[#8eb15a] hover:text-[#4c6b26]"
        >
          <CommandIcon name="check" className="h-4 w-4" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-black leading-tight">{item.title}</p>
        <p className="mt-0.5 truncate text-[10px] font-medium text-black/45">
          {item.kind === "task" ? item.category : `${item.channel} · contenu`}
          {extra ? ` · ${extra}` : ""}
        </p>
      </div>
      <PriorityBadge result={scoreLabel} />
    </div>
  );
}

export default function Dashboard() {
  const { items, decisions, activity, loaded, error, updateItem, resolveDecision } = useStudioBrain();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectError, setProjectError] = useState("");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    listProjects()
      .then(setProjects)
      .catch((err) => setProjectError((err as Error).message));
  }, []);

  const scores = useMemo(() => scoreAll(items), [items]);

  const activeItems = items.filter((it) => it.status !== "done" && it.status !== "archived");
  const allBlockedItems = activeItems.filter((it) => it.status === "blocked");
  const blockedItems = sortByPriority(allBlockedItems, scores).slice(0, 6);
  const workableItems = sortByPriority(
    activeItems.filter((it) => it.status !== "blocked"),
    scores
  );
  const todayItems = workableItems.slice(0, 6);
  const topItem = todayItems[0];
  const pendingDecisions = decisions.filter((d) => d.status === "pending");

  const daysUntilLaunch = now ? Math.max(0, Math.ceil((LAUNCH_DATE.getTime() - now.getTime()) / 86_400_000)) : null;

  const criticalItems = items.filter((it) => it.launchCritical && it.status !== "archived");
  const doneCritical = criticalItems.filter((it) => it.status === "done").length;
  const overdueCritical = criticalItems.filter(
    (it) => it.status !== "done" && (daysUntil(it.dueDate) ?? 999) < 0
  ).length;
  const criticalRatio = criticalItems.length ? doneCritical / criticalItems.length : 0;

  const confidence =
    overdueCritical > 0
      ? { label: "À risque", tint: "bg-[#ffdada] text-[#7b2525]", detail: `${overdueCritical} élément(s) critique(s) en retard` }
      : criticalRatio >= 0.5
      ? { label: "Sur la bonne voie", tint: "bg-[#dfeac2] text-[#3f5a1f]", detail: `${doneCritical}/${criticalItems.length} jalons critiques faits` }
      : { label: "Sous tension", tint: "bg-[#f5df75]/70 text-[#69510a]", detail: `${doneCritical}/${criticalItems.length} jalons critiques faits` };

  const doneThisWeek = items.filter(
    (it) => it.doneAt && (Date.now() - new Date(it.doneAt).getTime()) / 86_400_000 <= 7
  ).length;
  const totalOutputs = projects.reduce((sum, project) => sum + Object.keys(project.outputs).length, 0);
  const contentCount = items.filter((it) => it.kind === "content" && it.status !== "archived").length;

  async function handleDone(id: string) {
    await updateItem(id, { status: "done" }).catch(() => {
      /* error already surfaced via the shared error banner below */
    });
  }

  async function handleDecision(id: string, resolution: string) {
    await resolveDecision(id, resolution).catch(() => {
      /* error already surfaced via the shared error banner below */
    });
  }

  function blockedReason(item: StudioItem): string {
    const pendingDeps = item.dependsOn
      .map((depId) => items.find((it) => it.id === depId))
      .filter((dep): dep is StudioItem => dep !== undefined && dep.status !== "done");
    if (pendingDeps.length === 0) return "En attente d'un dépendance non suivie";
    return `Bloqué par : ${pendingDeps.map((d) => d.title).join(", ")}`;
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">Bonjour Sab.</h1>
          <p className="mt-1 text-sm font-medium text-black/52">
            {topItem ? (
              <>
                Objectif du jour : <span className="font-black text-black/80">{topItem.title}</span>
              </>
            ) : (
              "Rien de critique en attente — bonne nouvelle."
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`command-pill ${confidence.tint}`}>
            <CommandIcon name="bolt" className="h-3.5 w-3.5" /> {confidence.label}
          </span>
          <Link href="/search" className="hidden min-w-[210px] items-center gap-2 rounded-full border border-black/10 bg-white/75 px-4 py-2.5 text-xs font-semibold text-black/35 hover:text-black/60 md:flex">
            <CommandIcon name="search" className="h-4 w-4" /> Rechercher…
          </Link>
          <Link href="/projects/new" className="command-button h-11 w-11 p-0">
            <CommandIcon name="plus" className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Pilotage ORBIT — quick nav to the other studio views */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Link href="/studio" className="command-card flex items-center gap-2.5 p-3.5 hover:bg-[#f4f1e9]">
          <CommandIcon name="target" className="h-4 w-4" /> <span className="text-[11px] font-black">Studio Pulse</span>
        </Link>
        <Link href="/dependencies" className="command-card flex items-center gap-2.5 p-3.5 hover:bg-[#f4f1e9]">
          <CommandIcon name="link" className="h-4 w-4" /> <span className="text-[11px] font-black">Dépendances</span>
        </Link>
        <Link href="/studio/timeline" className="command-card flex items-center gap-2.5 p-3.5 hover:bg-[#f4f1e9]">
          <CommandIcon name="calendar" className="h-4 w-4" /> <span className="text-[11px] font-black">Timeline</span>
        </Link>
        <Link href="/studio/integrations" className="command-card flex items-center gap-2.5 p-3.5 hover:bg-[#f4f1e9]">
          <CommandIcon name="bolt" className="h-4 w-4" /> <span className="text-[11px] font-black">Intégrations</span>
        </Link>
      </section>

      {/* Bloc 1 — greeting, objective, countdown, confidence */}
      <section className="relative min-h-[220px] overflow-hidden rounded-[30px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8_0%,#f7f3e7_55%,#edf2e5_100%)] p-5 shadow-[0_18px_44px_rgba(70,68,57,0.07)] sm:p-6">
        <div className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_80%_85%,rgba(195,217,149,0.2),transparent_34%),radial-gradient(circle_at_12%_10%,rgba(245,223,117,0.16),transparent_26%)]" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="rounded-full border border-black/10 bg-[#f4efdc]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em]">
              24March Studio / Mode build
            </span>
            <p className="mt-4 text-[11px] font-black uppercase tracking-[0.14em]">Compte à rebours lancement</p>
            <div className="mt-2 flex items-end gap-3">
              <span className="text-[56px] font-black leading-[0.82] tracking-[-0.07em] sm:text-[86px] lg:text-[100px]">
                {daysUntilLaunch ?? "—"}
              </span>
              <span className="mb-2 text-sm font-black uppercase leading-tight tracking-[0.1em]">
                jours
                <br />
                restants
              </span>
            </div>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-[#7d9f4c]">1er septembre 2026</p>
          </div>
          <div className="rounded-[18px] border border-black/10 bg-white/80 p-4 sm:min-w-[220px]">
            <p className="command-label">Confiance</p>
            <p className="mt-2 text-2xl font-black leading-none">{confidence.label}</p>
            <p className="mt-2 text-[11px] font-semibold text-black/50">{confidence.detail}</p>
          </div>
        </div>
      </section>

      {(error || projectError) && (
        <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error || projectError}</div>
      )}

      {/* Bloc 2 — Aujourd'hui */}
      <section className="command-card p-5 sm:p-6">
        <PanelTitle title={`Aujourd'hui · ${todayItems.length}`} action="Voir la banque de contenu" actionHref="/studio/content" />
        <div className="mt-4 space-y-2.5">
          {!loaded && [1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-[18px] bg-black/5" />)}
          {loaded && todayItems.map((item) => (
            <ItemRow key={item.id} item={item} scoreLabel={scores.get(item.id)!} onDone={handleDone} />
          ))}
          {loaded && !todayItems.length && (
            <div className="flex min-h-[80px] items-center justify-center rounded-[18px] border border-dashed border-black/15 text-xs font-semibold text-black/40">
              Rien à faire aujourd&apos;hui — tout est soit terminé soit bloqué.
            </div>
          )}
        </div>
      </section>

      {/* Bloc 3 — Ce qui bloque */}
      <section className="rounded-[28px] border border-black/10 bg-[#fff0f5] p-5 shadow-[0_14px_34px_rgba(70,68,57,0.05)] sm:p-6">
        <PanelTitle
          title={`Ce qui bloque · ${allBlockedItems.length}`}
          action={allBlockedItems.length > blockedItems.length ? "Voir tout dans la timeline" : undefined}
          actionHref="/studio/timeline"
        />
        <div className="mt-4 space-y-2.5">
          {loaded && blockedItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3 rounded-[16px] bg-white/70 p-3">
              <CommandIcon name="clock" className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-black">{item.title}</p>
                <p className="truncate text-[9px] font-medium text-black/45">{blockedReason(item)}</p>
              </div>
              <PriorityBadge result={scores.get(item.id)!} />
            </div>
          ))}
          {loaded && !blockedItems.length && (
            <div className="flex min-h-[70px] items-center justify-center rounded-[16px] border border-dashed border-black/15 text-xs font-semibold text-black/40">
              Rien de bloqué en ce moment.
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Bloc 4 — Ce qui a changé */}
        <section className="command-card p-5 sm:p-6">
          <PanelTitle title="Ce qui a changé" />
          <div className="mt-4 space-y-3">
            {loaded && activity.map((entry) => (
              <div key={entry.id} className="flex items-start gap-3 border-b border-black/6 pb-3 last:border-0 last:pb-0">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-[#edf2e5]">
                  <CommandIcon name="strategy" className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold leading-snug text-black/75">{entry.message}</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-black/35">
                    {now ? relativeTime(entry.createdAt, now) : ""}
                  </p>
                </div>
              </div>
            ))}
            {loaded && !activity.length && (
              <div className="flex min-h-[70px] items-center justify-center rounded-[16px] border border-dashed border-black/15 text-xs font-semibold text-black/40">
                Aucune activité récente.
              </div>
            )}
          </div>
        </section>

        {/* Bloc 5 — Décisions à valider */}
        <section className="rounded-[28px] border border-black/10 bg-[#e9e1fb] p-5 shadow-[0_14px_34px_rgba(70,68,57,0.05)] sm:p-6">
          <PanelTitle title={`Décisions à valider · ${pendingDecisions.length}`} />
          <div className="mt-4 space-y-3">
            {loaded && pendingDecisions.map((decision) => (
              <div key={decision.id} className="rounded-[18px] border border-black/10 bg-white/70 p-3.5">
                <p className="text-[12px] font-black leading-snug">{decision.question}</p>
                {decision.context && <p className="mt-1 text-[10px] font-medium text-black/50">{decision.context}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {decision.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleDecision(decision.id, option)}
                      className="rounded-full border border-black/12 bg-white px-3 py-1.5 text-[10px] font-black hover:bg-black hover:text-white"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {loaded && !pendingDecisions.length && (
              <div className="flex min-h-[70px] items-center justify-center rounded-[16px] border border-dashed border-black/15 text-xs font-semibold text-black/40">
                Aucune décision en attente.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bloc 6 — métriques compactes, en dernier */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Projets actifs" value={projects.length} note="Dans le pipeline ORBIT" icon="projects" tint="bg-[#eef7ff]" />
        <MetricCard label="Terminé cette semaine" value={doneThisWeek} note="Tâches + contenus" icon="check" tint="bg-[#f2f7e8]" />
        <MetricCard label="Contenus actifs" value={contentCount} note="Banque de contenu" icon="content" tint="bg-[#f5effd]" />
        <MetricCard label="Livrables générés" value={totalOutputs} note="Mémoire créative réutilisable" icon="sparkles" tint="bg-[#fff8e5]" />
      </section>

      <p className="text-right text-[9px] font-semibold uppercase tracking-[0.1em] text-black/30">
        Dernière échéance planifiée : {formatShortDate("2026-08-31")} — rien après le 31 août.
      </p>
    </div>
  );
}
