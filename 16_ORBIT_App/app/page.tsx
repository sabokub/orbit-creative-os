"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listProjects } from "@/lib/storage";
import { Project } from "@/lib/types";
import { scoreAll, sortByPriority } from "@/lib/priority";
import { relativeTime } from "@/lib/format";
import { useStudioBrain } from "@/contexts/StudioBrainContext";
import { importanceTier, tierStyleForPriority } from "@/lib/importanceColor";
import CommandIcon from "@/components/CommandIcon";
import ModePilotCard from "@/components/ModePilotCard";
import { useWorkMode } from "@/contexts/WorkModeContext";
import CriticalTaskCard from "@/components/CriticalTaskCard";
import ImportanceMark from "@/components/ImportanceMark";

const PILOT_VIEWS = [
  { href: "/studio", title: "Studio", note: "Santé globale, charge et risques", icon: "home" as const, tint: "bg-[#eef7ff]" },
  { href: "/dependencies", title: "Dépendances", note: "Visualise ce qui bloque quoi", icon: "projects" as const, tint: "bg-[#fff0f5]" },
  { href: "/timeline", title: "Timeline", note: "Échéances, décisions et historique", icon: "launch" as const, tint: "bg-[#fff8e5]" },
  { href: "/search", title: "Recherche", note: "Retrouve tout dans ORBIT", icon: "sparkles" as const, tint: "bg-[#f5effd]" },
];

export default function Dashboard() {
  const { focusMode } = useWorkMode();
  const { items, decisions, activity, loaded, error, refresh, updateItem, resolveDecision } = useStudioBrain();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectError, setProjectError] = useState("");
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch((err) => setProjectError((err as Error).message));
  }, []);

  const scores = useMemo(() => scoreAll(items), [items]);
  const active = items.filter((it) => it.status !== "done" && it.status !== "archived");
  const openTasks = active.filter((it) => it.kind === "task");
  const blockedTasks = active.filter((it) => it.status === "blocked");
  const openContent = sortByPriority(
    active.filter((it) => it.kind === "content" && it.status !== "blocked"),
    scores
  ).slice(0, 4);

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
      {!focusMode && (
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
          <Link href="/execution" className="block rounded-[30px] border border-black/10 bg-[#171c28] p-6 text-white sm:p-7">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c3e8a0]">ORBIT V4 / Action first</span>
            <h2 className="mt-3 text-3xl font-black">Une priorité. Trois actions. Une preuve.</h2>
            <p className="mt-3 max-w-[600px] text-sm text-white/65">Passe du plan de septembre à la validation réelle de 24March : parcours client, offre vendable, preuve de valeur. SMART + TAPP, connecté à Studio Brain.</p>
            <span className="mt-6 inline-flex rounded-full bg-[#c3e8a0] px-4 py-2.5 text-xs font-black text-[#171c28]">Ouvrir mon plan d&apos;exécution →</span>
          </Link>
          <article className="rounded-[30px] border border-black/10 bg-[#e6edcd] p-6 sm:p-7">
            <p className="command-label">Phase actuelle</p>
            <h2 className="mt-3 text-2xl font-black">Activer, tester, vendre.</h2>
            <p className="mt-3 text-sm text-black/55">Waitlist déjà publiée. Le déploiement technique ne prouve pas que le parcours commercial fonctionne.</p>
            <Link href="/launch" className="mt-5 inline-block text-xs font-black underline">Voir les points de validation</Link>
          </article>
        </section>
      )}

      <ModePilotCard />
      {!focusMode && (
        <>
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

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="rounded-[26px] border border-black/10 bg-[#fff0f5] p-5">
              <div className="flex items-center justify-between">
                <h2 className="command-label">Ce qui bloque</h2>
                <span className="command-pill bg-white">{blockedTasks.length}</span>
              </div>
              <div className="mt-4 space-y-2">
                {loaded &&
                  blockedTasks.map((item) => (
                    <Link key={item.id} href={`/studio/items/${encodeURIComponent(item.id)}`} className="block rounded-[16px] bg-white/75 p-3">
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
        </>
      )}
    </div>
  );
}
