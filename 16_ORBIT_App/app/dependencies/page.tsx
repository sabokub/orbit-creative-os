"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStudioPlan } from "@/hooks/useStudioPlan";
import { PlanItem, PRIORITY_LABEL, PRIORITY_WEIGHT, STATUS_LABEL, sortByOrder } from "@/lib/studioPlan";

function scoreTask(task: PlanItem, all: PlanItem[]) {
  const dependents = all.filter((item) => item.blockedBy === task.id).length;
  const urgency = task.scheduledFor ? Math.max(0, 18 - Math.ceil((new Date(task.scheduledFor).getTime() - Date.now()) / 86_400_000)) : 5;
  const priority = PRIORITY_WEIGHT[task.priority] * 18;
  const leverage = dependents * 14;
  const effort = task.durationMinutes ? Math.max(0, 14 - Math.round(task.durationMinutes / 30)) : 7;
  return Math.min(100, priority + urgency + leverage + effort);
}

export default function DependenciesPage() {
  const { plan } = useStudioPlan();
  const tasks = useMemo(() => sortByOrder(plan.priorities), [plan.priorities]);
  const byId = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const ranked = useMemo(() => [...tasks].filter((task) => task.status !== "done").sort((a, b) => scoreTask(b, tasks) - scoreTask(a, tasks)), [tasks]);

  return (
    <div className="space-y-4 pb-36 lg:pb-8">
      <header><p className="command-label">Sprint 2</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Dépendances & priorités</h1><p className="mt-1 text-sm text-black/48">Comprendre ce qui bloque, ce qui débloque le reste et pourquoi ORBIT recommande cet ordre.</p></header>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="command-card p-5">
          <div className="flex items-center justify-between"><div><p className="command-label">Graphe opérationnel</p><h2 className="mt-1 text-xl font-black">Chaîne de dépendances</h2></div><span className="command-pill bg-[#f9d9e6]">{tasks.filter((item) => item.blockedBy).length} liens</span></div>
          <div className="mt-5 space-y-3">
            {tasks.map((task) => {
              const blocker = task.blockedBy ? byId.get(task.blockedBy) : undefined;
              return <div key={task.id} className={`rounded-[20px] border p-4 ${task.status === "done" ? "border-[#9dbd61]/25 bg-[#edf2e5]" : blocker && blocker.status !== "done" ? "border-[#e9a9bd]/35 bg-[#fff0f5]" : "border-black/8 bg-white/75"}`}>
                {blocker && <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-black/42"><span className="rounded-full bg-white px-2 py-1">{blocker.title}</span><span>→ débloque →</span></div>}
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black">{task.title}</p><p className="mt-1 text-[11px] text-black/45">{task.detail}</p></div><span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[9px] font-black">{STATUS_LABEL[task.status]}</span></div>
                {blocker && blocker.status !== "done" && <p className="mt-3 text-[10px] font-black uppercase text-[#b45d7a]">Bloquée tant que « {blocker.title} » n’est pas terminé.</p>}
              </div>;
            })}
          </div>
        </article>

        <article className="command-card p-5">
          <div><p className="command-label">Moteur explicable</p><h2 className="mt-1 text-xl font-black">Ordre recommandé</h2></div>
          <div className="mt-4 space-y-3">
            {ranked.map((task, index) => {
              const score = scoreTask(task, tasks);
              const dependents = tasks.filter((item) => item.blockedBy === task.id).length;
              return <Link href="/launch#tasks" key={task.id} className="block rounded-[20px] border border-black/8 bg-white/75 p-4">
                <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#f5df75] text-lg font-black">{score}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{index + 1}. {task.title}</p><p className="mt-1 text-[10px] text-black/42">Priorité {PRIORITY_LABEL[task.priority].toLowerCase()} · {task.durationMinutes || "?"} min · débloque {dependents} tâche(s)</p></div></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${score}%` }} /></div>
              </Link>;
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
