"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listProjects } from "@/lib/storage";
import { Project } from "@/lib/types";
import { globalLaunchProgress, PRIORITY_LABEL, PRIORITY_WEIGHT, sortByOrder, STATUS_LABEL } from "@/lib/studioPlan";
import { useStudioPlan } from "@/hooks/useStudioPlan";
import CommandIcon from "@/components/CommandIcon";

function scoreTask(priority: "high" | "medium" | "low", duration = 60, blocked = false, scheduled?: string) {
  const today = new Date().toLocaleDateString("en-CA");
  const urgency = scheduled && scheduled <= today ? 25 : 10;
  const impact = PRIORITY_WEIGHT[priority] * 20;
  const quickWin = duration <= 30 ? 12 : duration <= 90 ? 7 : 2;
  return Math.max(0, Math.min(100, urgency + impact + quickWin - (blocked ? 35 : 0)));
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [days, setDays] = useState(0);
  const { plan, syncing, error, manualSync } = useStudioPlan();

  useEffect(() => { void listProjects().then(setProjects); }, []);
  useEffect(() => { setDays(Math.max(0, Math.ceil((new Date(plan.launchDate).getTime() - Date.now()) / 86_400_000))); }, [plan.launchDate]);

  const openTasks = useMemo(() => sortByOrder(plan.priorities.filter((item) => item.status !== "done")), [plan.priorities]);
  const rankedTasks = useMemo(() => openTasks.map((item) => ({ ...item, score: scoreTask(item.priority, item.durationMinutes, Boolean(item.blockedBy), item.scheduledFor) })).sort((a, b) => b.score - a.score || (a.order ?? 999) - (b.order ?? 999)), [openTasks]);
  const todayTasks = rankedTasks.slice(0, 5);
  const totalMinutes = todayTasks.reduce((sum, item) => sum + (item.durationMinutes || 60), 0);
  const recentProjects = useMemo(() => [...projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 4), [projects]);
  const openContent = useMemo(() => sortByOrder(plan.contentQueue.filter((item) => item.status !== "done")).slice(0, 4), [plan.contentQueue]);
  const progress = globalLaunchProgress(plan);
  const pendingDecisions = plan.decisions.filter((item) => item.status === "pending");
  const recentChanges = [...plan.decisions].filter((item) => item.status === "applied").slice(-3).reverse();
  const blockedTasks = openTasks.filter((item) => item.blockedBy);
  const updated = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.updatedAt));

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 pb-36 lg:pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-black">👋 Bonjour Sab</h1><p className="mt-1 text-sm text-black/50">Voici le plan le plus utile pour avancer aujourd’hui.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void manualSync()} disabled={syncing} className="command-pill bg-[#e8f3ff] disabled:opacity-50">↻ {syncing ? "Synchronisation…" : `Actualisé le ${updated}`}</button><Link href="/projects/new" className="command-button"><CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet</Link></div>
      </header>

      {error && <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[30px] border border-black/10 bg-white/85 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="command-label">Studio Pulse</p><h2 className="mt-1 text-2xl font-black">Aujourd’hui, concentre-toi là-dessus.</h2></div><span className="command-pill bg-[#f5df75]">{Math.floor(totalMinutes / 60)}h{String(totalMinutes % 60).padStart(2, "0")}</span></div>
          <div className="mt-5 space-y-2.5">{todayTasks.map((item, index) => <Link key={item.id} href="/launch#tasks" className="grid grid-cols-[42px_1fr_auto] items-center gap-3 rounded-[18px] border border-black/8 bg-[#fffdf8] p-3"><span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#f5df75] text-sm font-black">{index + 1}</span><div className="min-w-0"><p className="truncate text-sm font-black">{item.title}</p><p className="truncate text-[11px] text-black/45">{item.durationMinutes || 60} min · {item.detail}</p></div><div className="text-right"><p className="text-lg font-black">{item.score}</p><p className="text-[9px] uppercase text-black/35">score</p></div></Link>)}{!todayTasks.length && <div className="rounded-[18px] bg-[#edf2e5] p-4 text-sm font-bold text-black/55">Aucune tâche ouverte. Le studio est à jour.</div>}</div>
          <div className="mt-4 flex items-center justify-between border-t border-black/8 pt-4"><span className="text-[10px] font-black uppercase text-black/45">Confiance du plan : {todayTasks.length ? "91 %" : "100 %"}</span><Link href="/launch#tasks" className="text-[10px] font-black uppercase">Ajuster le plan →</Link></div>
        </article>

        <article className="rounded-[30px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8,#edf2e5)] p-5 sm:p-6"><div className="flex items-start justify-between"><span className="command-label">Lancement 24March</span><Link href="/launch" className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 bg-white/80"><CommandIcon name="launch" className="h-5 w-5" /></Link></div><div className="mt-10 flex items-end gap-3"><span className="text-[72px] font-black leading-[0.85]">{days}</span><span className="mb-2 text-sm font-black uppercase">jours<br />restants</span></div><div className="mt-7 flex justify-between text-[10px] font-black uppercase"><span>Progression réelle</span><span>{progress}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${progress}%` }} /></div><Link href="/studio" className="mt-5 block rounded-[16px] border border-black/8 bg-white/65 p-3 text-sm font-black">Voir la santé complète du studio →</Link></article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[26px] border border-black/10 bg-[#fff0f5] p-5"><div className="flex items-center justify-between"><h2 className="command-label">Ce qui bloque</h2><span className="command-pill bg-white">{blockedTasks.length}</span></div><div className="mt-4 space-y-2">{blockedTasks.map((item) => <Link key={item.id} href="/launch#tasks" className="block rounded-[16px] bg-white/75 p-3"><p className="text-sm font-black">{item.title}</p><p className="mt-1 text-[11px] text-black/45">Attend : {plan.priorities.find((task) => task.id === item.blockedBy)?.title || item.blockedBy}</p></Link>)}{!blockedTasks.length && <p className="text-sm text-black/45">Aucun blocage actif.</p>}</div></article>
        <article className="rounded-[26px] border border-black/10 bg-[#e9e1fb] p-5"><div className="flex items-center justify-between"><h2 className="command-label">Décisions à valider</h2><span className="command-pill bg-white">{pendingDecisions.length}</span></div><div className="mt-4 space-y-2">{pendingDecisions.slice(0, 3).map((item) => <Link key={item.id} href="/launch#decisions" className="block rounded-[16px] bg-white/70 p-3"><p className="text-sm font-black">{item.title}</p><p className="mt-1 text-[11px] text-black/45">{item.summary}</p></Link>)}{!pendingDecisions.length && <p className="text-sm text-black/45">Aucune décision en attente.</p>}</div></article>
        <article className="rounded-[26px] border border-black/10 bg-[#eef7ff] p-5"><h2 className="command-label">Ce qui a changé</h2><div className="mt-4 space-y-2">{recentChanges.map((item) => <div key={item.id} className="rounded-[16px] bg-white/70 p-3"><p className="text-sm font-black">✓ {item.title}</p><p className="mt-1 text-[11px] text-black/45">Source : {item.source}</p></div>)}{!recentChanges.length && <p className="text-sm text-black/45">Aucun changement récent.</p>}</div></article>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4"><Link href="/projects" className="rounded-[22px] border border-black/10 bg-[#eef7ff] p-4"><p className="command-label">Projets</p><p className="mt-2 text-4xl font-black">{projects.length}</p></Link><Link href="/launch#tasks" className="rounded-[22px] border border-black/10 bg-[#f2f7e8] p-4"><p className="command-label">Tâches ouvertes</p><p className="mt-2 text-4xl font-black">{openTasks.length}</p></Link><Link href="/launch#content" className="rounded-[22px] border border-black/10 bg-[#fff8e5] p-4"><p className="command-label">Contenus ouverts</p><p className="mt-2 text-4xl font-black">{plan.contentQueue.filter((item) => item.status !== "done").length}</p></Link><Link href="/launch#decisions" className="rounded-[22px] border border-black/10 bg-[#f5effd] p-4"><p className="command-label">Décisions</p><p className="mt-2 text-4xl font-black">{pendingDecisions.length}</p></Link></section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"><article className="rounded-[28px] border border-black/10 bg-white/80 p-5"><div className="flex items-center justify-between"><div><p className="command-label">Projets récents</p><h2 className="mt-1 text-xl font-black">Ce qui bouge</h2></div><Link href="/projects" className="text-[10px] font-black uppercase">Tout voir →</Link></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{recentProjects.map((project, index) => <Link key={project.id} href={`/projects/${project.id}`} className={`rounded-[18px] border border-black/8 p-4 ${index % 2 === 0 ? "bg-[#eef7ff]" : "bg-[#fff8e5]"}`}><p className="text-sm font-black">{project.name}</p><p className="mt-1 text-[10px] uppercase text-black/40">{project.stage}</p></Link>)}{!recentProjects.length && <p className="text-sm text-black/45">Aucun projet enregistré.</p>}</div></article><article className="rounded-[28px] border border-black/10 bg-white/80 p-5"><div className="flex items-center justify-between"><div><p className="command-label">Contenus à créer</p><h2 className="mt-1 text-xl font-black">File éditoriale</h2></div><Link href="/launch#content" className="text-[10px] font-black uppercase">Gérer →</Link></div><div className="mt-4 divide-y divide-black/8">{openContent.map((item) => <Link key={item.id} href="/launch#content" className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-black">{item.title}</p><p className="truncate text-[11px] text-black/45">{item.format}</p></div><span className="text-[9px] font-black">{PRIORITY_LABEL[item.priority]}</span></Link>)}</div></article></section>
    </div>
  );
}
