"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Project, Stage } from "@/lib/types";
import { listProjects } from "@/lib/storage";
import {
  CONTENT_QUEUE,
  GLOBAL_LAUNCH_PROGRESS,
  LAUNCH_DATE,
  PLAN_UPDATED_AT,
  PRIORITIES,
  SITE_PAGES,
  STATUS_LABEL,
  TRACK_PROGRESS,
} from "@/lib/studioPlan";
import CommandIcon, { CommandIconName } from "@/components/CommandIcon";

const STAGE_PROGRESS: Record<Stage, number> = {
  brief: 12,
  strategy: 25,
  creative: 40,
  website: 58,
  content: 72,
  images: 84,
  review: 94,
  exported: 100,
};

const AREA_META: Record<string, { icon: CommandIconName; color: string }> = {
  Système: { icon: "sparkles", color: "bg-[#dcecff]" },
  Produit: { icon: "library", color: "bg-[#f5df75]" },
  Contenu: { icon: "content", color: "bg-[#f9d9e6]" },
};

function PanelTitle({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[11px] font-black uppercase tracking-[0.12em]">{title}</h2>
      {href && (
        <Link href={href} className="rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[10px] font-bold text-black/55">
          Voir tout
        </Link>
      )}
    </div>
  );
}

function MetricCard({ label, value, note, icon, tint, href }: {
  label: string;
  value: string | number;
  note: string;
  icon: CommandIconName;
  tint: string;
  href: string;
}) {
  return (
    <Link href={href} className={`block rounded-[24px] border border-black/10 p-4 shadow-[0_10px_28px_rgba(38,37,32,0.05)] ${tint}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/55">{label}</p>
          <p className="mt-2 text-[36px] font-black leading-none tracking-[-0.04em]">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-black/10 bg-white/70">
          <CommandIcon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[11px] font-semibold text-black/52">{note}</p>
    </Link>
  );
}

function reviewScore(projects: Project[]): string {
  const reviews = projects.flatMap((project) => project.reviews);
  if (!reviews.length) return "—";
  const score = reviews.reduce((sum, review) => {
    if (review.status === "Approved") return sum + 10;
    if (review.status === "Needs revision") return sum + 6;
    if (review.status === "Blocked") return sum + 2;
    return sum;
  }, 0) / reviews.length;
  return score.toFixed(1);
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [daysUntilLaunch, setDaysUntilLaunch] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilLaunch(Math.max(0, Math.ceil((LAUNCH_DATE.getTime() - Date.now()) / 86_400_000)));
    listProjects()
      .then((items) => {
        setProjects(items);
        setLoaded(true);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoaded(true);
      });
  }, []);

  const recentProjects = useMemo(
    () => [...projects].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5),
    [projects]
  );

  const totalOutputs = projects.reduce((sum, project) => sum + Object.keys(project.outputs).length, 0);
  const totalReviews = projects.reduce((sum, project) => sum + project.reviews.length, 0);
  const totalExports = projects.reduce((sum, project) => sum + project.exports.length, 0);
  const blockedReviews = projects.flatMap((project) =>
    project.reviews
      .filter((review) => review.status === "Blocked")
      .map((review) => ({ projectId: project.id, projectName: project.name, target: review.target }))
  );
  const pendingReviews = projects.reduce(
    (sum, project) => sum + project.reviews.filter((review) => review.status === "Needs revision").length,
    0
  );
  const averageProjectProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + STAGE_PROGRESS[project.stage], 0) / projects.length)
    : 0;
  const qualityScore = reviewScore(projects);

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">👋 Bienvenue, Sab</h1>
          <p className="mt-1 text-sm font-medium text-black/52">Données ORBIT réelles + plan de lancement 24March.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="command-pill bg-[#e8f3ff]"><CommandIcon name="sparkles" className="h-3.5 w-3.5" /> Mis à jour le {PLAN_UPDATED_AT}</span>
          <Link href="/projects/new" className="command-button hidden sm:inline-flex"><CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet</Link>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
        <article className="relative min-h-[320px] overflow-hidden rounded-[30px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8_0%,#f7f3e7_55%,#edf2e5_100%)] p-5 shadow-[0_18px_44px_rgba(70,68,57,0.07)] sm:p-6">
          <div className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_80%_85%,rgba(195,217,149,0.2),transparent_34%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <span className="rounded-full border border-black/10 bg-[#f4efdc]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em]">24March Studio / plan réel</span>
              <Link href="/launch" className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 bg-white/80" aria-label="Ouvrir le lancement">
                <CommandIcon name="launch" className="h-5 w-5" />
              </Link>
            </div>
            <div className="mt-10">
              <p className="text-[11px] font-black uppercase tracking-[0.14em]">Compte à rebours lancement</p>
              <div className="mt-2 flex items-end gap-3"><span className="text-[56px] font-black leading-[0.82] tracking-[-0.07em] sm:text-[86px] lg:text-[106px]">{daysUntilLaunch ?? "—"}</span><span className="mb-2 text-sm font-black uppercase leading-tight tracking-[0.1em]">jours<br />restants</span></div>
              <p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-[#7d9f4c]">1er septembre 2026</p>
              <div className="mt-6 max-w-xl">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.11em]"><span>Progression du plan de lancement</span><span>{GLOBAL_LAUNCH_PROGRESS}%</span></div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${GLOBAL_LAUNCH_PROGRESS}%` }} /></div>
              </div>
              <p className="mt-3 text-[10px] font-semibold text-black/42">Calculée à partir des tâches terminées, en cours, à relire et à faire.</p>
            </div>
          </div>
        </article>

        <article className="rounded-[30px] border border-black/10 bg-white/78 p-5 shadow-[0_18px_44px_rgba(70,68,57,0.06)] sm:p-6">
          <PanelTitle title="Priorités réelles" />
          <div className="mt-4 space-y-3">
            {PRIORITIES.map((item) => {
              const meta = AREA_META[item.area] || AREA_META.Système;
              return (
                <Link href="/launch#tasks" key={item.title} className="flex items-center gap-3 rounded-[20px] border border-black/8 bg-[#fffdf8] p-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] ${meta.color}`}><CommandIcon name={meta.icon} className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.title}</p><p className="mt-0.5 truncate text-[11px] font-medium text-black/45">{item.detail}</p></div>
                  <div className="text-right"><span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[9px] font-black">{STATUS_LABEL[item.status]}</span><p className="mt-1 text-[9px] font-semibold text-black/35">{item.due}</p></div>
                </Link>
              );
            })}
          </div>
          <Link href="/launch#tasks" className="mt-4 flex items-center justify-end gap-2 border-t border-black/8 pt-4 text-[10px] font-black uppercase tracking-[0.1em]">Voir toutes les tâches <CommandIcon name="arrow" className="h-4 w-4" /></Link>
        </article>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Projets ORBIT" value={projects.length} note={projects.length ? `Progression moyenne : ${averageProjectProgress}%` : "Aucun projet enregistré"} icon="projects" tint="bg-[#eef7ff]" href="/projects" />
        <MetricCard label="Livrables enregistrés" value={totalOutputs} note="Outputs réellement sauvegardés" icon="sparkles" tint="bg-[#f2f7e8]" href="/visual-lab" />
        <MetricCard label="Relectures" value={totalReviews} note={`${pendingReviews} à corriger · ${blockedReviews.length} bloquée(s)`} icon="critic" tint="bg-[#f5effd]" href="/visual-lab" />
        <MetricCard label="Exports créés" value={totalExports} note="Exports réellement enregistrés" icon="library" tint="bg-[#fff8e5]" href="/projects" />
      </section>

      {error && <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-4 xl:grid-cols-[0.85fr_1.25fr_1.2fr]">
        <article className="rounded-[28px] border border-black/10 bg-white/78 p-5"><PanelTitle title="Plan de lancement" /><div className="mt-4 space-y-3.5">{TRACK_PROGRESS.map((track) => <div key={track.label} className="grid grid-cols-[28px_1fr_auto] items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#edf2e5]"><CommandIcon name={track.icon} className="h-3.5 w-3.5" /></span><div><p className="text-[11px] font-bold">{track.label}</p><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${track.progress}%` }} /></div></div><span className="text-[10px] font-black">{track.progress}%</span></div>)}</div><Link href="/launch#roadmap" className="mt-4 flex w-full items-center justify-center gap-2 border-t border-black/8 pt-4 text-[10px] font-black uppercase tracking-[0.1em]">Voir le plan complet <CommandIcon name="arrow" className="h-4 w-4" /></Link></article>

        <article className="rounded-[28px] border border-black/10 bg-white/78 p-5"><PanelTitle title="Contenus réels à créer / publier" href="/launch#content" /><div className="mt-4 divide-y divide-black/7">{CONTENT_QUEUE.map((item, index) => <Link href="/launch#content" key={item.title} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 py-2.5"><div className={`h-11 rounded-[12px] ${index % 2 === 0 ? "bg-[#e6d3b5]" : "bg-[#dcecff]"}`} /><div className="min-w-0"><p className="truncate text-[11px] font-black">{item.title}</p><p className="mt-0.5 truncate text-[10px] font-medium text-black/40">{item.format}</p></div><div className="text-right"><span className="rounded-full border border-black/8 bg-[#f8faf4] px-2 py-1 text-[9px] font-black">{item.status}</span><p className="mt-1 text-[9px] font-semibold text-black/35">{item.timing}</p></div></Link>)}</div></article>

        <article className="rounded-[28px] border border-black/10 bg-white/78 p-5"><PanelTitle title="État réel du site" href="/launch#site" /><div className="mt-4 space-y-3">{SITE_PAGES.map((page) => <Link href="/launch#site" key={page.title} className="grid grid-cols-[1fr_auto] items-center gap-3"><div><div className="flex justify-between gap-2"><span className="text-[11px] font-bold">{page.title}</span><span className="truncate text-[9px] font-semibold text-black/38">{page.status}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${page.progress}%` }} /></div></div><span className="text-[10px] font-black">{page.progress}%</span></Link>)}</div></article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.25fr_1.15fr]">
        <article className="rounded-[28px] border border-black/10 bg-[#fff0f5] p-5"><PanelTitle title={`Blocages réels · ${blockedReviews.length}`} href="/visual-lab" /><div className="mt-4 space-y-2.5">{blockedReviews.length ? blockedReviews.map((item) => <Link key={`${item.projectId}-${item.target}`} href={`/projects/${item.projectId}`} className="flex items-center gap-3 rounded-[16px] bg-white/70 p-3"><CommandIcon name="clock" className="h-4 w-4" /><div className="min-w-0"><p className="truncate text-[11px] font-black">{item.projectName}</p><p className="text-[9px] font-medium text-black/40">Étape bloquée : {item.target}</p></div></Link>) : <p className="rounded-[16px] bg-white/60 p-3 text-xs font-semibold text-black/48">Aucune review bloquée dans ORBIT.</p>}</div></article>

        <article className="rounded-[28px] border border-black/10 bg-white/78 p-5"><PanelTitle title="Projets récents" href="/projects" /><div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">{!loaded && [1, 2, 3].map((item) => <div key={item} className="h-32 min-w-[128px] animate-pulse rounded-[18px] bg-black/5" />)}{loaded && recentProjects.map((project, index) => <Link key={project.id} href={`/projects/${project.id}`} className={`min-w-[145px] rounded-[18px] border border-black/8 p-3 ${index % 2 === 0 ? "bg-[#efe3cc]" : "bg-[#dcecff]"}`}><div className="h-16 rounded-[12px] bg-white/45" /><p className="mt-3 line-clamp-2 text-[11px] font-black">{project.name}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-black/40">{project.stage}</p></Link>)}{loaded && !recentProjects.length && <p className="text-xs font-semibold text-black/45">Aucun projet enregistré.</p>}</div></article>

        <Link href="/visual-lab" className="block rounded-[28px] border border-black/10 bg-[#e9e1fb] p-5"><PanelTitle title="Score qualité réel" /><div className="mt-5"><p className="text-[48px] font-black leading-none tracking-[-0.06em]">{qualityScore}<span className="text-lg">/10</span></p><p className="mt-2 text-sm font-black text-[#7259a4]">{qualityScore === "—" ? "Aucune review enregistrée" : "Moyenne des statuts de review"}</p></div><p className="mt-3 text-right text-[10px] font-bold text-black/45">Basé sur {totalReviews} relecture(s)</p></Link>
      </section>
    </div>
  );
}
