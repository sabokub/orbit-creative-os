import Link from "next/link";
import CommandIcon from "@/components/CommandIcon";
import {
  CONTENT_QUEUE,
  GLOBAL_LAUNCH_PROGRESS,
  PLAN_UPDATED_AT,
  PRIORITIES,
  SITE_PAGES,
  STATUS_LABEL,
  TRACK_PROGRESS,
} from "@/lib/studioPlan";

export default function LaunchPage() {
  return (
    <div className="space-y-4 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="command-label"><CommandIcon name="launch" className="h-3.5 w-3.5" /> Opération lancement</span>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Lancement 24March Studio</h1>
          <p className="mt-1 text-sm font-medium text-black/48">Plan réel mis à jour le {PLAN_UPDATED_AT}. Aucun chiffre de démonstration.</p>
        </div>
        <Link href="/projects/new" className="command-button self-start"><CommandIcon name="plus" className="h-4 w-4" /> Ajouter un projet</Link>
      </header>

      <section className="grid min-w-0 gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="relative min-w-0 overflow-hidden rounded-[24px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8,#edf2e5)] p-4 sm:p-5">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[28px] border-[#c3d995]/30" />
          <div className="relative">
            <p className="command-label">Progression du plan</p>
            <div className="mt-3 flex items-end gap-3"><span className="text-6xl font-black tracking-[-0.07em] sm:text-8xl">{GLOBAL_LAUNCH_PROGRESS}</span><span className="mb-2 text-sm font-black uppercase leading-tight">pour cent<br />terminé</span></div>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-[#7d9f4c]">Lancement prévu le 1er septembre 2026</p>
            <div className="mt-5"><div className="flex justify-between text-[10px] font-black uppercase tracking-[0.1em]"><span>Avancement calculé</span><span>{GLOBAL_LAUNCH_PROGRESS}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${GLOBAL_LAUNCH_PROGRESS}%` }} /></div></div></div>
            <p className="mt-3 text-[10px] font-semibold text-black/42">Basé sur les tâches terminées, en cours, à relire et à faire.</p>
          </div>
        </article>

        <article className="command-card min-w-0 p-4 sm:p-5">
          <p className="command-label">Prochaine meilleure action</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">Valider ORBIT V2 sur mobile.</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-black/48">Le responsive, la navigation et les liens doivent être propres avant de passer à la communication du lancement.</p>
          <a href="#tasks" className="mt-4 block rounded-[18px] bg-[#f5df75]/70 p-4"><p className="text-sm font-black">Voir les tâches critiques</p><p className="mt-1 text-xs font-medium text-black/55">Accéder directement à ce qui reste à fermer.</p></a>
        </article>
      </section>

      <section id="roadmap" className="scroll-mt-24 grid min-w-0 gap-3 xl:grid-cols-[0.9fr_1.1fr]">
        <article className="command-card min-w-0 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="command-label">Roadmap</p><h2 className="mt-1 text-xl font-black">Progression par chantier</h2></div><span className="command-pill bg-[#e6edcd]">{TRACK_PROGRESS.length} chantiers</span></div>
          <div className="mt-4 space-y-4">{TRACK_PROGRESS.map((track) => <div key={track.label} className="grid min-w-0 grid-cols-[34px_1fr_auto] items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-[11px] bg-[#edf2e5]"><CommandIcon name={track.icon} className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-sm font-black">{track.label}</p><div className="mt-1.5 h-2 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${track.progress}%` }} /></div></div></div><span className="text-xs font-black">{track.progress}%</span></div>)}</div>
        </article>

        <article id="tasks" className="command-card min-w-0 scroll-mt-24 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div><p className="command-label">Tâches réelles</p><h2 className="mt-1 text-xl font-black">Ce qui est prioritaire maintenant</h2></div><span className="command-pill bg-[#f9d9e6]">{PRIORITIES.length} priorités</span></div>
          <div className="mt-4 space-y-2.5">{PRIORITIES.map((item) => <div key={item.title} className="flex min-w-0 items-center gap-3 rounded-[18px] border border-black/8 bg-white/70 p-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#dcecff]"><CommandIcon name="check" className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.title}</p><p className="mt-0.5 text-[11px] font-medium text-black/45">{item.area} · {item.detail}</p></div><div className="text-right"><span className="shrink-0 rounded-full border border-black/8 bg-white px-2.5 py-1 text-[9px] font-black">{STATUS_LABEL[item.status]}</span><p className="mt-1 text-[9px] font-semibold text-black/35">{item.due}</p></div></div>)}</div>
        </article>
      </section>

      <section className="grid min-w-0 gap-3 xl:grid-cols-2">
        <article id="content" className="command-card min-w-0 scroll-mt-24 p-4 sm:p-5">
          <div><p className="command-label">Calendrier éditorial réel</p><h2 className="mt-1 text-xl font-black">Contenus à créer et publier</h2></div>
          <div className="mt-4 divide-y divide-black/8">{CONTENT_QUEUE.map((item, index) => <div key={item.title} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 py-3"><div className={`h-11 rounded-[12px] ${index % 2 === 0 ? "bg-[#e6d3b5]" : "bg-[#dcecff]"}`} /><div className="min-w-0"><p className="truncate text-sm font-black">{item.title}</p><p className="text-[11px] text-black/45">{item.format}</p></div><div className="text-right"><span className="rounded-full border border-black/8 bg-white px-2 py-1 text-[9px] font-black">{item.status}</span><p className="mt-1 text-[10px] font-bold text-black/40">{item.timing}</p></div></div>)}</div>
        </article>

        <article id="site" className="command-card min-w-0 scroll-mt-24 p-4 sm:p-5">
          <div><p className="command-label">Production du site</p><h2 className="mt-1 text-xl font-black">État réel des pages</h2></div>
          <div className="mt-4 space-y-3">{SITE_PAGES.map((page) => <div key={page.title} className="grid grid-cols-[1fr_auto] items-center gap-3"><div><div className="flex justify-between gap-3 text-sm font-black"><span>{page.title}</span><span className="text-[10px] font-semibold text-black/40">{page.status}</span></div><div className="mt-2 h-2 rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${page.progress}%` }} /></div></div></div><span className="text-xs font-black">{page.progress}%</span></div>)}</div>
        </article>
      </section>
    </div>
  );
}
