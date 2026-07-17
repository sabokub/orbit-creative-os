"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listProjects } from "@/lib/storage";
import { Project, STUDIO_LAUNCH_MOMENT } from "@/lib/types";
import { scoreAll, sortByPriority } from "@/lib/priority";
import { relativeTime } from "@/lib/format";
import { useStudioBrain } from "@/contexts/StudioBrainContext";
import { importanceTier, tierStyleForPriority } from "@/lib/importanceColor";
import CommandIcon from "@/components/CommandIcon";
import WorkModeBanner from "@/components/WorkModeBanner";
import CriticalTaskCard from "@/components/CriticalTaskCard";
import ImportanceMark from "@/components/ImportanceMark";

const LAUNCH_DATE = new Date(STUDIO_LAUNCH_MOMENT);

const PILOT_VIEWS = [
  { href: "/studio", title: "Studio", note: "Santé globale, charge et risques", icon: "home" as const, tint: "bg-[#eef7ff]" },
  { href: "/dependencies", title: "Dépendances", note: "Visualise ce qui bloque quoi", icon: "projects" as const, tint: "bg-[#fff0f5]" },
  { href: "/timeline", title: "Timeline", note: "Échéances, décisions et historique", icon: "launch" as const, tint: "bg-[#fff8e5]" },
  { href: "/search", title: "Recherche", note: "Retrouve tout dans ORBIT", icon: "sparkles" as const, tint: "bg-[#f5effd]" },
];

export default function Dashboard() {
  const { items, decisions, activity, loaded, error, refresh, updateItem, resolveDecision } = useStudioBrain();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectError, setProjectError] = useState("");
  const [days, setDays] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((err) => setProjectError((err as Error).message));
  }, []);
  useEffect(() => {
    setDays(Math.max(0, Math.ceil((LAUNCH_DATE.getTime() - Date.now()) / 86_400_000)));
  }, []);

  const scores = useMemo(() => scoreAll(items), [items]);
  const active = items.filter((it) => it.status !== "done" && it.status !== "archived");
  const openTasks = active.filter((it) => it.kind === "task");
  const blockedTasks = active.filter((it) => it.status === "blocked");
  const openContent = sortByPriority(
    active.filter((it) => it.kind === "content" && it.status !== "blocked"),
    scores
  ).slice(0, 4);

  const todayTasks = sortByPriority(
    openTasks.filter((it) => it.status !== "blocked"),
    scores
  ).slice(0, 5);
  const totalMinutes = todayTasks.reduce((sum, item) => sum + item.estimateMinutes, 0);

  const criticalTasks = useMemo(
    () =>
      sortByPriority(
        active.filter((it) => importanceTier(scores.get(it.id) ?? { label: "Faible" }) === "critical"),
        scores
      ).slice(0, 4),
    [active, scores]
  );

  const recentProjects = useMemo(() => [...projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 4), [projects]);
  const pendingDecisions = decisions.filter((d) => d.status === "pending");
  const recentChanges = activity.slice(0, 3);

  const doneCount = items.filter((it) => it.status === "done").length;
  const totalCount = items.filter((it) => it.status !== "archived").length;
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  async function handleSync() {
    setSyncing(true);
    try {
      await refresh();
    } finally {
      setSyncing(false);
    }
  }

  function blockedReason(item: (typeof items)[number]): string {
    const pendingDeps = item.dependsOn.map((depId) => items.find((it) => it.id === depId)).filter((d): d is NonNullable<typeof d> => Boolean(d) && d!.status !== "done");
    return pendingDeps[0]?.title || "une dépendance";
  }

  /** Titles of active items that are waiting on `item` — the inverse of dependsOn ("what does finishing this unblock"). */
  function dependentTitlesOf(item: (typeof items)[number]): string[] {
    return active.filter((candidate) => candidate.id !== item.id && candidate.dependsOn.includes(item.id)).map((candidate) => candidate.title);
  }

  function blockedByTitleOf(item: (typeof items)[number]): string | null {
    if (item.status !== "blocked") return null;
    return blockedReason(item);
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 pb-36 lg:pb-8">
      <WorkModeBanner />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black">👋 Bonjour Sab</h1>
          <p className="mt-1 text-sm text-black/50">Voici le plan le plus utile pour avancer aujourd&rsquo;hui.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void handleSync()} disabled={syncing} className="command-pill bg-[#e8f3ff] disabled:opacity-50">
            ↻ {syncing ? "Synchronisation…" : "Actualiser"}
          </button>
          <Link href="/projects/new" className="command-button">
            <CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet
          </Link>
        </div>
      </header>

      {(error || projectError) && <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error || projectError}</div>}

      {loaded && criticalTasks.length > 0 && (
        <section className="rounded-[28px] border border-black/10 bg-white/82 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="command-label">Priorité absolue</p>
              <h2 className="mt-1 text-xl font-black">Tâches critiques du studio</h2>
            </div>
            <span className="command-pill bg-[#fbdede]">{criticalTasks.length}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {criticalTasks.map((item) => (
              <CriticalTaskCard
                key={item.id}
                item={item}
                priority={scores.get(item.id)!}
                dependentTitles={dependentTitlesOf(item)}
                blockedByTitle={blockedByTitleOf(item)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[30px] border border-black/10 bg-white/85 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="command-label">Studio Pulse</p>
              <h2 className="mt-1 text-2xl font-black">Aujourd&rsquo;hui, concentre-toi là-dessus.</h2>
            </div>
            <span className="command-pill bg-[#f5df75]">
              {Math.floor(totalMinutes / 60)}h{String(totalMinutes % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-5 space-y-2.5">
            {loaded &&
              todayTasks.map((item, index) => {
                const priority = scores.get(item.id);
                const tier = priority ? tierStyleForPriority(priority) : null;
                return (
                  <Link
                    key={item.id}
                    href="/launch#tasks"
                    className={`grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-[18px] border border-black/8 ${tier?.cardBorder ?? ""} ${tier?.cardTint ?? ""} bg-[#fffdf8] p-3`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#f5df75] text-sm font-black">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black">{item.title}</p>
                      <p className="truncate text-[11px] text-black/45">
                        {item.estimateMinutes} min · {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black">{priority?.score ?? 0}</p>
                      <p className="text-[9px] uppercase text-black/35">{tier?.tag ?? "score"}</p>
                    </div>
                  </Link>
                );
              })}
            {loaded && !todayTasks.length && (
              <div className="rounded-[18px] bg-[#edf2e5] p-4 text-sm font-bold text-black/55">Aucune tâche ouverte. Le studio est à jour.</div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-black/8 pt-4">
            <span className="text-[10px] font-black uppercase text-black/45">
              Confiance du plan : {todayTasks.length ? "91 %" : "100 %"}
            </span>
            <Link href="/launch#tasks" className="text-[10px] font-black uppercase">
              Ajuster le plan →
            </Link>
          </div>
        </article>

        <article className="rounded-[30px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8,#edf2e5)] p-5 sm:p-6">
          <div className="flex items-start justify-between">
            <span className="command-label">Lancement 24March</span>
            <Link href="/launch" className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 bg-white/80">
              <CommandIcon name="launch" className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-10 flex items-end gap-3">
            <span className="text-[72px] font-black leading-[0.85]">{days}</span>
            <span className="mb-2 text-sm font-black uppercase">
              jours
              <br />
              restants
            </span>
          </div>
          <div className="mt-7 flex justify-between text-[10px] font-black uppercase">
            <span>Progression réelle</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/7">
            <div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${progress}%` }} />
          </div>
          <Link href="/studio" className="mt-5 block rounded-[16px] border border-black/8 bg-white/65 p-3 text-sm font-black">
            Voir la santé complète du studio →
          </Link>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[26px] border border-black/10 bg-[#fff0f5] p-5">
          <div className="flex items-center justify-between">
            <h2 className="command-label">Ce qui bloque</h2>
            <span className="command-pill bg-white">{blockedTasks.length}</span>
          </div>
          <div className="mt-4 space-y-2">
            {loaded &&
              blockedTasks.map((item) => (
                <Link key={item.id} href="/launch#tasks" className="block rounded-[16px] bg-white/75 p-3">
                  <p className="text-sm font-black">{item.title}</p>
                  <p className="mt-1 text-[11px] text-black/45">Attend : {blockedReason(item)}</p>
                </Link>
              ))}
            {loaded && !blockedTasks.length && <p className="text-sm text-black/45">Aucun blocage actif.</p>}
          </div>
        </article>
        <article className="rounded-[26px] border border-black/10 bg-[#e9e1fb] p-5">
          <div className="flex items-center justify-between">
            <h2 className="command-label">Décisions à valider</h2>
            <span className="command-pill bg-white">{pendingDecisions.length}</span>
          </div>
          <div className="mt-4 space-y-2">
            {pendingDecisions.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-[16px] bg-white/70 p-3">
                <p className="text-sm font-black">{item.question}</p>
                {item.context && <p className="mt-1 text-[11px] text-black/45">{item.context}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => void resolveDecision(item.id, option).catch(() => {})}
                      className="rounded-full border border-black/10 bg-white px-2 py-1 text-[9px] font-black hover:bg-black hover:text-white"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {!pendingDecisions.length && <p className="text-sm text-black/45">Aucune décision en attente.</p>}
          </div>
        </article>
        <article className="rounded-[26px] border border-black/10 bg-[#eef7ff] p-5">
          <h2 className="command-label">Ce qui a changé</h2>
          <div className="mt-4 space-y-2">
            {recentChanges.map((entry) => (
              <div key={entry.id} className="rounded-[16px] bg-white/70 p-3">
                <p className="text-sm font-black">✓ {entry.message}</p>
                <p className="mt-1 text-[11px] text-black/45">{relativeTime(entry.createdAt)}</p>
              </div>
            ))}
            {!recentChanges.length && <p className="text-sm text-black/45">Aucun changement récent.</p>}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/projects" className="rounded-[22px] border border-black/10 bg-[#eef7ff] p-4">
          <p className="command-label">Projets</p>
          <p className="mt-2 text-4xl font-black">{projects.length}</p>
        </Link>
        <Link href="/launch#tasks" className="rounded-[22px] border border-black/10 bg-[#f2f7e8] p-4">
          <p className="command-label">Tâches ouvertes</p>
          <p className="mt-2 text-4xl font-black">{openTasks.length}</p>
        </Link>
        <Link href="/launch#content" className="rounded-[22px] border border-black/10 bg-[#fff8e5] p-4">
          <p className="command-label">Contenus ouverts</p>
          <p className="mt-2 text-4xl font-black">{active.filter((it) => it.kind === "content").length}</p>
        </Link>
        <Link href="/launch#decisions" className="rounded-[22px] border border-black/10 bg-[#f5effd] p-4">
          <p className="command-label">Décisions</p>
          <p className="mt-2 text-4xl font-black">{pendingDecisions.length}</p>
        </Link>
      </section>

      <section className="rounded-[28px] border border-black/10 bg-white/82 p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="command-label">Pilotage ORBIT</p>
            <h2 className="mt-1 text-xl font-black">Les vues qui font avancer le studio</h2>
          </div>
          <span className="hidden text-[10px] font-black uppercase text-black/35 sm:block">Aussi accessibles avec ⌘K</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PILOT_VIEWS.map((view) => (
            <Link key={view.href} href={view.href} className={`group rounded-[20px] border border-black/8 p-4 ${view.tint}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-black/8 bg-white/75">
                <CommandIcon name={view.icon} className="h-5 w-5" />
              </span>
              <p className="mt-4 text-sm font-black">{view.title}</p>
              <p className="mt-1 text-[11px] leading-snug text-black/48">{view.note}</p>
              <p className="mt-4 text-[10px] font-black uppercase">Ouvrir →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-black/10 bg-white/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="command-label">Projets récents</p>
              <h2 className="mt-1 text-xl font-black">Ce qui bouge</h2>
            </div>
            <Link href="/projects" className="text-[10px] font-black uppercase">
              Tout voir →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recentProjects.map((project, index) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className={`rounded-[18px] border border-black/8 p-4 ${index % 2 === 0 ? "bg-[#eef7ff]" : "bg-[#fff8e5]"}`}
              >
                <p className="text-sm font-black">{project.name}</p>
                <p className="mt-1 text-[10px] uppercase text-black/40">{project.stage}</p>
              </Link>
            ))}
            {!recentProjects.length && <p className="text-sm text-black/45">Aucun projet enregistré.</p>}
          </div>
        </article>
        <article className="rounded-[28px] border border-black/10 bg-white/80 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="command-label">Contenus à créer</p>
              <h2 className="mt-1 text-xl font-black">File éditoriale</h2>
            </div>
            <Link href="/launch#content" className="text-[10px] font-black uppercase">
              Gérer →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-black/8">
            {openContent.map((item) => {
              const priority = scores.get(item.id);
              const tier = priority ? tierStyleForPriority(priority) : null;
              return (
                <Link key={item.id} href="/launch#content" className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{item.title}</p>
                    <p className="truncate text-[11px] text-black/45">{item.channel}</p>
                  </div>
                  {tier && priority && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.06em] ${tier.badge}`}>
                      <ImportanceMark shape={tier.mark} color={tier.markColor} />
                      {priority.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
