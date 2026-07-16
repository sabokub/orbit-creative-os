"use client";

import Link from "next/link";
import { globalLaunchProgress, progressFromStatuses, trackProgress } from "@/lib/studioPlan";
import { useStudioPlan } from "@/hooks/useStudioPlan";
import CommandIcon from "@/components/CommandIcon";

export default function StudioPage() {
  const { plan, syncing, manualSync } = useStudioPlan();
  const tracks = trackProgress(plan);
  const launchProgress = globalLaunchProgress(plan);
  const openTasks = plan.priorities.filter((item) => item.status !== "done");
  const blocked = openTasks.filter((item) => item.blockedBy);
  const pendingDecisions = plan.decisions.filter((item) => item.status === "pending");
  const contentProgress = progressFromStatuses(plan.contentQueue.map((item) => item.status));
  const siteProgress = plan.sitePages.length ? Math.round(plan.sitePages.reduce((sum, item) => sum + item.progress, 0) / plan.sitePages.length) : 0;

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 pb-36 lg:pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><span className="command-label"><CommandIcon name="sparkles" className="h-3.5 w-3.5" /> Studio Pulse</span><h1 className="mt-2 text-3xl font-black sm:text-4xl">Santé globale de 24March Studio</h1><p className="mt-1 text-sm text-black/48">Une seule vue pour savoir si le studio avance vraiment.</p></div>
        <button type="button" onClick={() => void manualSync()} disabled={syncing} className="command-button self-start">↻ {syncing ? "Synchronisation…" : "Actualiser"}</button>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <article className="rounded-[24px] border border-black/10 bg-[#eef7ff] p-5"><p className="command-label">Lancement</p><p className="mt-2 text-4xl font-black">{launchProgress}%</p></article>
        <article className="rounded-[24px] border border-black/10 bg-[#f2f7e8] p-5"><p className="command-label">Site</p><p className="mt-2 text-4xl font-black">{siteProgress}%</p></article>
        <article className="rounded-[24px] border border-black/10 bg-[#fff8e5] p-5"><p className="command-label">Contenus</p><p className="mt-2 text-4xl font-black">{contentProgress}%</p></article>
        <article className="rounded-[24px] border border-black/10 bg-[#f5effd] p-5"><p className="command-label">Décisions</p><p className="mt-2 text-4xl font-black">{pendingDecisions.length}</p></article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-black/10 bg-white/80 p-5"><div className="flex items-center justify-between"><div><p className="command-label">Chantiers</p><h2 className="mt-1 text-xl font-black">Progression du studio</h2></div><span className="command-pill bg-[#e6edcd]">{tracks.length}</span></div><div className="mt-5 space-y-4">{tracks.map((track) => <div key={track.id} className="grid grid-cols-[34px_1fr_auto] items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#edf2e5]"><CommandIcon name={track.icon} className="h-4 w-4" /></span><div><div className="flex justify-between gap-3"><p className="text-sm font-black">{track.label}</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${track.progress}%` }} /></div></div><span className="text-xs font-black">{track.progress}%</span></div>)}</div></article>

        <article className="rounded-[28px] border border-black/10 bg-[#fff0f5] p-5"><div className="flex items-center justify-between"><div><p className="command-label">Risques</p><h2 className="mt-1 text-xl font-black">Ce qui peut ralentir le lancement</h2></div><span className="command-pill bg-white">{blocked.length}</span></div><div className="mt-4 space-y-3">{blocked.map((item) => <Link key={item.id} href="/launch#tasks" className="block rounded-[18px] bg-white/75 p-4"><p className="text-sm font-black">{item.title}</p><p className="mt-1 text-[11px] text-black/45">Bloquée par : {plan.priorities.find((task) => task.id === item.blockedBy)?.title || item.blockedBy}</p></Link>)}{!blocked.length && <p className="text-sm text-black/45">Aucun risque bloquant détecté.</p>}</div></article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2"><article className="rounded-[28px] border border-black/10 bg-white/80 p-5"><div className="flex items-center justify-between"><div><p className="command-label">Charge</p><h2 className="mt-1 text-xl font-black">Travail encore ouvert</h2></div><Link href="/launch#tasks" className="text-[10px] font-black uppercase">Gérer →</Link></div><div className="mt-4 space-y-3">{openTasks.map((item) => <div key={item.id} className="rounded-[16px] border border-black/8 bg-[#fffdf8] p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black">{item.title}</p><span className="text-[9px] font-black uppercase">{item.durationMinutes || 60} min</span></div><p className="mt-1 text-[11px] text-black/45">{item.detail}</p></div>)}</div></article><article className="rounded-[28px] border border-black/10 bg-white/80 p-5"><div className="flex items-center justify-between"><div><p className="command-label">Pages</p><h2 className="mt-1 text-xl font-black">Production du site</h2></div><Link href="/launch#site" className="text-[10px] font-black uppercase">Détails →</Link></div><div className="mt-4 space-y-4">{plan.sitePages.map((page) => <div key={page.id} className="grid grid-cols-[1fr_auto] items-center gap-3"><div><div className="flex justify-between gap-3"><span className="text-sm font-black">{page.title}</span><span className="text-[10px] text-black/40">{page.status}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${page.progress}%` }} /></div></div><span className="text-xs font-black">{page.progress}%</span></div>)}</div></article></section>
    </div>
  );
}
