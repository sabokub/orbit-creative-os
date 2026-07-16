"use client";

import { useMemo } from "react";
import { useStudioPlan } from "@/hooks/useStudioPlan";
import { STATUS_LABEL } from "@/lib/studioPlan";

export default function TimelinePage() {
  const { plan } = useStudioPlan();
  const events = useMemo(() => {
    const taskEvents = plan.priorities.map((task) => ({ id: `task-${task.id}`, date: task.scheduledFor || plan.launchDate.slice(0, 10), title: task.title, meta: `Tâche · ${STATUS_LABEL[task.status]}` }));
    const contentEvents = plan.contentQueue.map((item) => ({ id: `content-${item.id}`, date: item.scheduledFor || plan.launchDate.slice(0, 10), title: item.title, meta: `Contenu · ${STATUS_LABEL[item.status]}` }));
    const decisionEvents = plan.decisions.map((item) => ({ id: `decision-${item.id}`, date: item.createdAt.slice(0, 10), title: item.title, meta: `Décision · ${item.status}` }));
    return [...taskEvents, ...contentEvents, ...decisionEvents].sort((a, b) => a.date.localeCompare(b.date));
  }, [plan]);

  const groups = useMemo(() => events.reduce<Record<string, typeof events>>((acc, event) => {
    const month = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${event.date}T12:00:00`));
    (acc[month] ||= []).push(event);
    return acc;
  }, {}), [events]);

  return <div className="space-y-4 pb-36 lg:pb-8">
    <header><p className="command-label">Roadmap vivante</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Timeline du studio</h1><p className="mt-1 text-sm text-black/48">Décisions, tâches et contenus réunis dans une seule chronologie.</p></header>
    <section className="command-card p-5">
      <div className="relative ml-3 border-l-2 border-black/10 pl-6">
        {Object.entries(groups).map(([month, monthEvents]) => <div key={month} className="mb-8 last:mb-0">
          <div className="-ml-[35px] flex items-center gap-3"><span className="h-4 w-4 rounded-full border-4 border-[#f6f3ec] bg-[#9dbd61]" /><h2 className="text-lg font-black capitalize">{month}</h2></div>
          <div className="mt-4 space-y-3">{monthEvents.map((event) => <div key={event.id} className="rounded-[18px] border border-black/8 bg-white/75 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black">{event.title}</p><p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-black/40">{event.meta}</p></div><span className="rounded-full bg-[#eef7ff] px-2.5 py-1 text-[9px] font-black">{new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(`${event.date}T12:00:00`))}</span></div></div>)}</div>
        </div>)}
      </div>
    </section>
  </div>;
}
