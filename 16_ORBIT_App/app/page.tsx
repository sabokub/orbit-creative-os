"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { listProjects } from "@/lib/storage";
import { Project } from "@/lib/types";
import { globalLaunchProgress, PRIORITY_LABEL, sortByOrder, STATUS_LABEL } from "@/lib/studioPlan";
import { useStudioPlan } from "@/hooks/useStudioPlan";
import CommandIcon from "@/components/CommandIcon";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [days, setDays] = useState(0);
  const { plan, syncing, error, manualSync } = useStudioPlan();

  useEffect(() => { void listProjects().then(setProjects); }, []);
  useEffect(() => { setDays(Math.max(0, Math.ceil((new Date(plan.launchDate).getTime() - Date.now()) / 86_400_000))); }, [plan.launchDate]);

  const tasks = useMemo(() => sortByOrder(plan.priorities.filter((item) => item.status !== "done")).slice(0, 6), [plan.priorities]);
  const progress = globalLaunchProgress(plan);
  const pendingDecisions = plan.decisions.filter((item) => item.status === "pending").length;
  const updated = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.updatedAt));

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 pb-36 lg:pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-3xl font-black">👋 Bienvenue, Sab</h1><p className="mt-1 text-sm text-black/50">Voilà ce qui mérite ton attention aujourd’hui.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void manualSync()} disabled={syncing} className="command-pill bg-[#e8f3ff] disabled:opacity-50">↻ {syncing ? "Synchronisation…" : `Actualisé le ${updated}`}</button>
          <Link href="/projects/new" className="command-button"><CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet</Link>
        </div>
      </header>

      {error && <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className="rounded-[30px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8,#edf2e5)] p-6">
          <div className="flex items-start justify-between"><span className="command-label">24March Studio / données live</span><Link href="/launch" className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 bg-white/80"><CommandIcon name="launch" className="h-5 w-5" /></Link></div>
          <p className="mt-16 text-[11px] font-black uppercase tracking-[0.14em]">Compte à rebours lancement</p>
          <div className="mt-2 flex items-end gap-3"><span className="text-[76px] font-black leading-[0.85]">{days}</span><span className="mb-2 text-sm font-black uppercase">jours<br />restants</span></div>
          <p className="mt-3 text-sm font-black uppercase text-[#7d9f4c]">1 septembre 2026</p>
          <div className="mt-7 flex justify-between text-[10px] font-black uppercase"><span>Progression réelle</span><span>{progress}%</span></div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${progress}%` }} /></div>
        </article>

        <article className="rounded-[30px] border border-black/10 bg-white/80 p-5">
          <div className="flex items-center justify-between"><h2 className="text-[11px] font-black uppercase tracking-[0.12em]">Ordre du jour</h2><Link href="/launch#tasks" className="text-[10px] font-black">Modifier l’ordre</Link></div>
          <div className="mt-4 space-y-2.5">
            {tasks.map((item, index) => <Link key={item.id} href="/launch#tasks" className="flex items-center gap-3 rounded-[18px] border border-black/8 bg-[#fffdf8] p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f5df75] text-sm font-black">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.title}</p><p className="truncate text-[11px] text-black/45">{item.durationMinutes ? `${item.durationMinutes} min · ` : ""}{item.detail}</p></div><div className="text-right"><span className="rounded-full border border-black/8 bg-white px-2 py-1 text-[9px] font-black">{PRIORITY_LABEL[item.priority]}</span><p className="mt-1 text-[9px] text-black/35">{STATUS_LABEL[item.status]}</p></div></Link>)}
          </div>
          <div className="mt-4 flex justify-between border-t border-black/8 pt-4 text-[10px] font-black uppercase"><span>{plan.priorities.filter((item) => item.status !== "done").length} tâches ouvertes</span><Link href="/launch#tasks">Tout afficher →</Link></div>
        </article>
      </section>

      {pendingDecisions > 0 && <Link href="/launch#decisions" className="flex items-center justify-between rounded-[22px] border border-[#8d72bd]/20 bg-[#e9e1fb] p-4"><div><p className="text-[10px] font-black uppercase text-[#7259a4]">Studio Brain</p><p className="mt-1 text-sm font-black">{pendingDecisions} décision{pendingDecisions > 1 ? "s" : ""} à valider</p></div><span>→</span></Link>}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Link href="/projects" className="rounded-[22px] border border-black/10 bg-[#eef7ff] p-4"><p className="command-label">Projets</p><p className="mt-2 text-4xl font-black">{projects.length}</p></Link>
        <Link href="/launch#tasks" className="rounded-[22px] border border-black/10 bg-[#f2f7e8] p-4"><p className="command-label">Tâches ouvertes</p><p className="mt-2 text-4xl font-black">{plan.priorities.filter((item) => item.status !== "done").length}</p></Link>
        <Link href="/launch#content" className="rounded-[22px] border border-black/10 bg-[#fff8e5] p-4"><p className="command-label">Contenus ouverts</p><p className="mt-2 text-4xl font-black">{plan.contentQueue.filter((item) => item.status !== "done").length}</p></Link>
        <Link href="/launch#decisions" className="rounded-[22px] border border-black/10 bg-[#f5effd] p-4"><p className="command-label">Décisions</p><p className="mt-2 text-4xl font-black">{pendingDecisions}</p></Link>
      </section>
    </div>
  );
}
