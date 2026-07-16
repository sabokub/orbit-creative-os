"use client";

import Link from "next/link";
import CommandIcon from "@/components/CommandIcon";
import {
  globalLaunchProgress,
  PlanPriority,
  PlanStatus,
  PRIORITY_LABEL,
  STATUS_LABEL,
  trackProgress,
} from "@/lib/studioPlan";
import { useStudioPlan } from "@/hooks/useStudioPlan";

const STATUS_OPTIONS: PlanStatus[] = ["todo", "in-progress", "review", "done"];
const PRIORITY_OPTIONS: PlanPriority[] = ["high", "medium", "low"];

export default function LaunchPage() {
  const { plan, loading, saving, error, save } = useStudioPlan();
  const tracks = trackProgress(plan);
  const progress = globalLaunchProgress(plan);
  const updatedLabel = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.updatedAt));

  async function updateTask(id: string, patch: Partial<(typeof plan.priorities)[number]>) {
    const priorities = plan.priorities.map((item) => (item.id === id ? { ...item, ...patch } : item));
    await save({ ...plan, priorities });
  }

  const nextTask = plan.priorities.find((item) => item.status !== "done");

  return (
    <div className="space-y-4 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="command-label"><CommandIcon name="launch" className="h-3.5 w-3.5" /> Opération lancement</span>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Lancement 24March Studio</h1>
          <p className="mt-1 text-sm text-black/48">Données synchronisées automatiquement · {loading ? "actualisation…" : updatedLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="command-pill bg-[#f5df75]">Enregistrement…</span>}
          <Link href="/projects/new" className="command-button self-start"><CommandIcon name="plus" className="h-4 w-4" /> Ajouter un projet</Link>
        </div>
      </header>

      {error && <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="relative overflow-hidden rounded-[24px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8,#edf2e5)] p-5">
          <p className="command-label">Progression du plan</p>
          <div className="mt-3 flex items-end gap-3"><span className="text-6xl font-black sm:text-8xl">{progress}</span><span className="mb-2 text-sm font-black uppercase leading-tight">pour cent<br />terminé</span></div>
          <p className="mt-2 text-sm font-black uppercase text-[#7d9f4c]">Lancement prévu le {new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(plan.launchDate))}</p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${progress}%` }} /></div>
        </article>

        <article className="command-card p-5">
          <p className="command-label">Prochaine meilleure action</p>
          <h2 className="mt-2 text-2xl font-black">{nextTask?.title || "Tout est terminé"}</h2>
          <p className="mt-2 text-sm text-black/48">{nextTask?.detail || "Aucune tâche ouverte dans le plan."}</p>
          <a href="#tasks" className="mt-4 block rounded-[18px] bg-[#f5df75]/70 p-4 text-sm font-black">Voir les tâches prioritaires</a>
        </article>
      </section>

      <section id="roadmap" className="scroll-mt-24 grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="command-card p-5">
          <div className="flex items-center justify-between"><div><p className="command-label">Roadmap</p><h2 className="mt-1 text-xl font-black">Progression par chantier</h2></div><span className="command-pill bg-[#e6edcd]">{tracks.length} chantiers</span></div>
          <div className="mt-4 space-y-4">
            {tracks.map((track) => (
              <div key={track.id} className="grid grid-cols-[34px_1fr_auto] items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#edf2e5]"><CommandIcon name={track.icon} className="h-4 w-4" /></span>
                <div><p className="text-sm font-black">{track.label}</p><div className="mt-1.5 h-2 rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${track.progress}%` }} /></div></div>
                <span className="text-xs font-black">{track.progress}%</span>
              </div>
            ))}
          </div>
        </article>

        <article id="tasks" className="command-card scroll-mt-24 p-5">
          <div className="flex items-center justify-between"><div><p className="command-label">Tâches réelles</p><h2 className="mt-1 text-xl font-black">Priorités actuelles</h2></div><span className="command-pill bg-[#f9d9e6]">{plan.priorities.filter((item) => item.status !== "done").length} ouvertes</span></div>
          <div className="mt-4 space-y-3">
            {plan.priorities.map((item) => (
              <div key={item.id} className={`rounded-[18px] border border-black/8 p-3 ${item.status === "done" ? "bg-[#edf2e5]/65 opacity-70" : "bg-white/70"}`}>
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => void updateTask(item.id, { status: item.status === "done" ? "todo" : "done" })} className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border ${item.status === "done" ? "border-[#7ca34d] bg-[#c3d995]" : "border-black/12 bg-white"}`} aria-label={item.status === "done" ? "Rouvrir la tâche" : "Terminer la tâche"}>
                    {item.status === "done" && <CommandIcon name="check" className="h-4 w-4" />}
                  </button>
                  <div className="min-w-0 flex-1"><p className={`text-sm font-black ${item.status === "done" ? "line-through" : ""}`}>{item.title}</p><p className="mt-0.5 text-[11px] text-black/45">{item.area} · {item.detail}</p></div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 border-t border-black/7 pt-3 sm:grid-cols-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.1em] text-black/40">Statut
                    <select value={item.status} onChange={(event) => void updateTask(item.id, { status: event.target.value as PlanStatus })} className="mt-1 !min-h-[38px] !rounded-[12px] !px-3 !py-1 text-xs font-bold">
                      {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
                    </select>
                  </label>
                  <label className="text-[9px] font-black uppercase tracking-[0.1em] text-black/40">Priorité
                    <select value={item.priority} onChange={(event) => void updateTask(item.id, { priority: event.target.value as PlanPriority })} className="mt-1 !min-h-[38px] !rounded-[12px] !px-3 !py-1 text-xs font-bold">
                      {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABEL[priority]}</option>)}
                    </select>
                  </label>
                  <label className="text-[9px] font-black uppercase tracking-[0.1em] text-black/40">Prévue pour
                    <input type="date" value={item.scheduledFor || ""} onChange={(event) => void updateTask(item.id, { scheduledFor: event.target.value || undefined, due: event.target.value ? "Planifiée" : item.due })} className="mt-1 !min-h-[38px] !rounded-[12px] !px-3 !py-1 text-xs font-bold" />
                  </label>
                </div>
              </div>
            ))}
            {!plan.priorities.length && <p className="text-sm text-black/45">Aucune priorité renseignée.</p>}
          </div>
        </article>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <article id="content" className="command-card scroll-mt-24 p-5"><p className="command-label">Calendrier éditorial</p><h2 className="mt-1 text-xl font-black">Contenus à créer et publier</h2><div className="mt-4 divide-y divide-black/8">{plan.contentQueue.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 py-3"><div><p className="text-sm font-black">{item.title}</p><p className="text-[11px] text-black/45">{item.format}</p></div><div className="text-right"><span className="text-[9px] font-black">{item.status}</span><p className="text-[10px] text-black/40">{item.timing}</p></div></div>)}{!plan.contentQueue.length && <p className="py-4 text-sm text-black/45">Aucun contenu renseigné.</p>}</div></article>
        <article id="site" className="command-card scroll-mt-24 p-5"><p className="command-label">Production du site</p><h2 className="mt-1 text-xl font-black">État réel des pages</h2><div className="mt-4 space-y-3">{plan.sitePages.map((page) => <div key={page.id} className="grid grid-cols-[1fr_auto] gap-3"><div><div className="flex justify-between gap-3"><span className="text-sm font-black">{page.title}</span><span className="text-[10px] text-black/40">{page.status}</span></div><div className="mt-2 h-2 rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${page.progress}%` }} /></div></div><span className="text-xs font-black">{page.progress}%</span></div>)}</div></article>
      </section>
    </div>
  );
}
