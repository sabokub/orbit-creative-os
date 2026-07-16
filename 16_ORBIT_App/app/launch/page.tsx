"use client";

import Link from "next/link";
import CommandIcon from "@/components/CommandIcon";
import { globalLaunchProgress, STATUS_LABEL, trackProgress } from "@/lib/studioPlan";
import { useStudioPlan } from "@/hooks/useStudioPlan";

export default function LaunchPage() {
  const { plan, loading, error } = useStudioPlan();
  const tracks = trackProgress(plan);
  const progress = globalLaunchProgress(plan);
  const updatedLabel = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.updatedAt));

  return <div className="space-y-4 pb-8">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><span className="command-label"><CommandIcon name="launch" className="h-3.5 w-3.5" /> Opération lancement</span><h1 className="mt-2 text-3xl font-black sm:text-4xl">Lancement 24March Studio</h1><p className="mt-1 text-sm text-black/48">Données synchronisées automatiquement · {loading ? "actualisation…" : updatedLabel}</p></div><Link href="/projects/new" className="command-button self-start"><CommandIcon name="plus" className="h-4 w-4" /> Ajouter un projet</Link></header>

    {error && <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>}

    <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
      <article className="relative overflow-hidden rounded-[24px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8,#edf2e5)] p-5"><p className="command-label">Progression du plan</p><div className="mt-3 flex items-end gap-3"><span className="text-6xl font-black sm:text-8xl">{progress}</span><span className="mb-2 text-sm font-black uppercase leading-tight">pour cent<br />terminé</span></div><p className="mt-2 text-sm font-black uppercase text-[#7d9f4c]">Lancement prévu le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(plan.launchDate))}</p><div className="mt-5 h-3 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${progress}%` }} /></div></article>
      <article className="command-card p-5"><p className="command-label">Prochaine meilleure action</p><h2 className="mt-2 text-2xl font-black">{plan.priorities[0]?.title || "Aucune priorité renseignée"}</h2><p className="mt-2 text-sm text-black/48">{plan.priorities[0]?.detail || "Ajoute une priorité au plan de lancement."}</p><a href="#tasks" className="mt-4 block rounded-[18px] bg-[#f5df75]/70 p-4 text-sm font-black">Voir les tâches prioritaires</a></article>
    </section>

    <section id="roadmap" className="scroll-mt-24 grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
      <article className="command-card p-5"><div className="flex items-center justify-between"><div><p className="command-label">Roadmap</p><h2 className="mt-1 text-xl font-black">Progression par chantier</h2></div><span className="command-pill bg-[#e6edcd]">{tracks.length} chantiers</span></div><div className="mt-4 space-y-4">{tracks.map((track) => <div key={track.id} className="grid grid-cols-[34px_1fr_auto] items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#edf2e5]"><CommandIcon name={track.icon} className="h-4 w-4" /></span><div><p className="text-sm font-black">{track.label}</p><div className="mt-1.5 h-2 rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${track.progress}%` }} /></div></div><span className="text-xs font-black">{track.progress}%</span></div>)}</div></article>
      <article id="tasks" className="command-card scroll-mt-24 p-5"><div className="flex items-center justify-between"><div><p className="command-label">Tâches réelles</p><h2 className="mt-1 text-xl font-black">Priorités actuelles</h2></div><span className="command-pill bg-[#f9d9e6]">{plan.priorities.length}</span></div><div className="mt-4 space-y-2.5">{plan.priorities.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-[18px] border border-black/8 bg-white/70 p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#dcecff]"><CommandIcon name="check" className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.title}</p><p className="text-[11px] text-black/45">{item.area} · {item.detail}</p></div><div className="text-right"><span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[9px] font-black">{STATUS_LABEL[item.status]}</span><p className="mt-1 text-[9px] text-black/35">{item.due}</p></div></div>)}{!plan.priorities.length && <p className="text-sm text-black/45">Aucune priorité renseignée.</p>}</div></article>
    </section>

    <section className="grid gap-3 xl:grid-cols-2">
      <article id="content" className="command-card scroll-mt-24 p-5"><p className="command-label">Calendrier éditorial</p><h2 className="mt-1 text-xl font-black">Contenus à créer et publier</h2><div className="mt-4 divide-y divide-black/8">{plan.contentQueue.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 py-3"><div><p className="text-sm font-black">{item.title}</p><p className="text-[11px] text-black/45">{item.format}</p></div><div className="text-right"><span className="text-[9px] font-black">{item.status}</span><p className="text-[10px] text-black/40">{item.timing}</p></div></div>)}{!plan.contentQueue.length && <p className="py-4 text-sm text-black/45">Aucun contenu renseigné.</p>}</div></article>
      <article id="site" className="command-card scroll-mt-24 p-5"><p className="command-label">Production du site</p><h2 className="mt-1 text-xl font-black">État réel des pages</h2><div className="mt-4 space-y-3">{plan.sitePages.map((page) => <div key={page.id} className="grid grid-cols-[1fr_auto] gap-3"><div><div className="flex justify-between gap-3"><span className="text-sm font-black">{page.title}</span><span className="text-[10px] text-black/40">{page.status}</span></div><div className="mt-2 h-2 rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${page.progress}%` }} /></div></div><span className="text-xs font-black">{page.progress}%</span></div>)}</div></article>
    </section>
  </div>;
}
