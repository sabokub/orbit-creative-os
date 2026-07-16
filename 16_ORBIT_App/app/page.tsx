"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Project, Stage } from "@/lib/types";
import { listProjects } from "@/lib/storage";
import { globalLaunchProgress, STATUS_LABEL, trackProgress } from "@/lib/studioPlan";
import { useStudioPlan } from "@/hooks/useStudioPlan";
import CommandIcon, { CommandIconName } from "@/components/CommandIcon";

const STAGE_PROGRESS: Record<Stage, number> = { brief: 12, strategy: 25, creative: 40, website: 58, content: 72, images: 84, review: 94, exported: 100 };
const AREA_META: Record<string, { icon: CommandIconName; color: string }> = {
  Système: { icon: "sparkles", color: "bg-[#dcecff]" },
  Produit: { icon: "library", color: "bg-[#f5df75]" },
  Contenu: { icon: "content", color: "bg-[#f9d9e6]" },
};

function PanelTitle({ title, href }: { title: string; href?: string }) {
  return <div className="flex items-center justify-between gap-4"><h2 className="text-[11px] font-black uppercase tracking-[0.12em]">{title}</h2>{href && <Link href={href} className="rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[10px] font-bold text-black/55">Voir tout</Link>}</div>;
}

function MetricCard({ label, value, note, icon, tint, href }: { label: string; value: string | number; note: string; icon: CommandIconName; tint: string; href: string }) {
  return <Link href={href} className={`block rounded-[24px] border border-black/10 p-4 ${tint}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/55">{label}</p><p className="mt-2 text-[36px] font-black leading-none">{value}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-black/10 bg-white/70"><CommandIcon name={icon} className="h-[18px] w-[18px]" /></span></div><p className="mt-3 text-[11px] font-semibold text-black/52">{note}</p></Link>;
}

function reviewScore(projects: Project[]): string {
  const reviews = projects.flatMap((project) => project.reviews);
  if (!reviews.length) return "—";
  const score = reviews.reduce((sum, review) => sum + (review.status === "Approved" ? 10 : review.status === "Needs revision" ? 6 : review.status === "Blocked" ? 2 : 0), 0) / reviews.length;
  return score.toFixed(1);
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectError, setProjectError] = useState("");
  const [daysUntilLaunch, setDaysUntilLaunch] = useState(0);
  const { plan, error: planError } = useStudioPlan();

  const refreshProjects = async () => {
    try { setProjects(await listProjects()); setProjectError(""); }
    catch (err) { setProjectError((err as Error).message); }
  };

  useEffect(() => {
    void refreshProjects();
    const interval = window.setInterval(() => void refreshProjects(), 15_000);
    const onFocus = () => void refreshProjects();
    window.addEventListener("focus", onFocus);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", onFocus); };
  }, []);

  useEffect(() => {
    setDaysUntilLaunch(Math.max(0, Math.ceil((new Date(plan.launchDate).getTime() - Date.now()) / 86_400_000)));
  }, [plan.launchDate]);

  const recentProjects = useMemo(() => [...projects].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5), [projects]);
  const totalOutputs = projects.reduce((sum, project) => sum + Object.keys(project.outputs).length, 0);
  const totalReviews = projects.reduce((sum, project) => sum + project.reviews.length, 0);
  const totalExports = projects.reduce((sum, project) => sum + project.exports.length, 0);
  const blockedReviews = projects.flatMap((project) => project.reviews.filter((review) => review.status === "Blocked").map((review) => ({ projectId: project.id, projectName: project.name, target: review.target })));
  const pendingReviews = projects.reduce((sum, project) => sum + project.reviews.filter((review) => review.status === "Needs revision").length, 0);
  const averageProjectProgress = projects.length ? Math.round(projects.reduce((sum, project) => sum + STAGE_PROGRESS[project.stage], 0) / projects.length) : 0;
  const tracks = trackProgress(plan);
  const launchProgress = globalLaunchProgress(plan);
  const qualityScore = reviewScore(projects);
  const updatedLabel = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.updatedAt));

  return <div className="mx-auto max-w-[1500px] space-y-4 pb-8">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black sm:text-3xl">👋 Bienvenue, Sab</h1><p className="mt-1 text-sm font-medium text-black/52">Les données se mettent à jour automatiquement.</p></div><div className="flex flex-wrap gap-2"><span className="command-pill bg-[#e8f3ff]">Actualisé le {updatedLabel}</span><Link href="/projects/new" className="command-button hidden sm:inline-flex"><CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet</Link></div></header>

    {(projectError || planError) && <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{projectError || planError}</div>}

    <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      <article className="relative min-h-[320px] overflow-hidden rounded-[30px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8,#edf2e5)] p-5 sm:p-6"><div className="relative flex h-full flex-col justify-between"><div className="flex items-start justify-between"><span className="rounded-full border border-black/10 bg-[#f4efdc]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em]">24March Studio / données live</span><Link href="/launch" className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 bg-white/80"><CommandIcon name="launch" className="h-5 w-5" /></Link></div><div className="mt-10"><p className="text-[11px] font-black uppercase tracking-[0.14em]">Compte à rebours lancement</p><div className="mt-2 flex items-end gap-3"><span className="text-[56px] font-black leading-[0.82] sm:text-[86px]">{daysUntilLaunch}</span><span className="mb-2 text-sm font-black uppercase leading-tight">jours<br />restants</span></div><p className="mt-2 text-sm font-black uppercase text-[#7d9f4c]">{new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(new Date(plan.launchDate))}</p><div className="mt-6"><div className="flex justify-between text-[10px] font-black uppercase"><span>Progression réelle</span><span>{launchProgress}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${launchProgress}%` }} /></div></div></div></div></article>

      <article className="rounded-[30px] border border-black/10 bg-white/78 p-5 sm:p-6"><PanelTitle title="Priorités actuelles" /><div className="mt-4 space-y-3">{plan.priorities.map((item) => { const meta = AREA_META[item.area] || AREA_META.Système; return <Link href="/launch#tasks" key={item.id} className="flex items-center gap-3 rounded-[20px] border border-black/8 bg-[#fffdf8] p-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] ${meta.color}`}><CommandIcon name={meta.icon} className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.title}</p><p className="truncate text-[11px] text-black/45">{item.detail}</p></div><div className="text-right"><span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[9px] font-black">{STATUS_LABEL[item.status]}</span><p className="mt-1 text-[9px] text-black/35">{item.due}</p></div></Link>; })}</div><Link href="/launch#tasks" className="mt-4 flex justify-end border-t border-black/8 pt-4 text-[10px] font-black uppercase">Voir toutes les tâches →</Link></article>
    </section>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard label="Projets ORBIT" value={projects.length} note={projects.length ? `Progression moyenne : ${averageProjectProgress}%` : "Aucun projet enregistré"} icon="projects" tint="bg-[#eef7ff]" href="/projects" /><MetricCard label="Livrables" value={totalOutputs} note="Outputs réellement sauvegardés" icon="sparkles" tint="bg-[#f2f7e8]" href="/visual-lab" /><MetricCard label="Relectures" value={totalReviews} note={`${pendingReviews} à corriger · ${blockedReviews.length} bloquée(s)`} icon="critic" tint="bg-[#f5effd]" href="/visual-lab" /><MetricCard label="Exports" value={totalExports} note="Exports réellement enregistrés" icon="library" tint="bg-[#fff8e5]" href="/projects" /></section>

    <section className="grid gap-4 xl:grid-cols-[0.85fr_1.25fr_1.2fr]">
      <article className="rounded-[28px] border border-black/10 bg-white/78 p-5"><PanelTitle title="Plan de lancement" /><div className="mt-4 space-y-3">{tracks.map((track) => <div key={track.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#edf2e5]"><CommandIcon name={track.icon} className="h-3.5 w-3.5" /></span><div><p className="text-[11px] font-bold">{track.label}</p><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${track.progress}%` }} /></div></div><span className="text-[10px] font-black">{track.progress}%</span></div>)}</div><Link href="/launch#roadmap" className="mt-4 flex justify-center border-t border-black/8 pt-4 text-[10px] font-black uppercase">Voir le plan complet →</Link></article>
      <article className="rounded-[28px] border border-black/10 bg-white/78 p-5"><PanelTitle title="Contenus à créer / publier" href="/launch#content" /><div className="mt-4 divide-y divide-black/7">{plan.contentQueue.map((item) => <Link href="/launch#content" key={item.id} className="grid grid-cols-[1fr_auto] gap-3 py-3"><div><p className="text-[11px] font-black">{item.title}</p><p className="text-[10px] text-black/40">{item.format}</p></div><div className="text-right"><span className="text-[9px] font-black">{item.status}</span><p className="text-[9px] text-black/35">{item.timing}</p></div></Link>)}</div></article>
      <article className="rounded-[28px] border border-black/10 bg-white/78 p-5"><PanelTitle title="État du site" href="/launch#site" /><div className="mt-4 space-y-3">{plan.sitePages.map((page) => <Link href="/launch#site" key={page.id} className="grid grid-cols-[1fr_auto] gap-3"><div><div className="flex justify-between gap-2"><span className="text-[11px] font-bold">{page.title}</span><span className="text-[9px] text-black/40">{page.status}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${page.progress}%` }} /></div></div><span className="text-[10px] font-black">{page.progress}%</span></Link>)}</div></article>
    </section>

    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.25fr_1.15fr]">
      <article className="rounded-[28px] border border-black/10 bg-[#fff0f5] p-5"><PanelTitle title={`Blocages réels · ${blockedReviews.length}`} href="/visual-lab" /><div className="mt-4">{blockedReviews.length ? blockedReviews.map((item) => <Link key={`${item.projectId}-${item.target}`} href={`/projects/${item.projectId}`} className="block rounded-[16px] bg-white/70 p-3 text-xs font-bold">{item.projectName} · {item.target}</Link>) : <p className="rounded-[16px] bg-white/60 p-3 text-xs font-semibold text-black/48">Aucune review bloquée.</p>}</div></article>
      <article className="rounded-[28px] border border-black/10 bg-white/78 p-5"><PanelTitle title="Projets récents" href="/projects" /><div className="mt-4 flex gap-3 overflow-x-auto">{recentProjects.map((project, index) => <Link key={project.id} href={`/projects/${project.id}`} className={`min-w-[145px] rounded-[18px] border border-black/8 p-3 ${index % 2 === 0 ? "bg-[#efe3cc]" : "bg-[#dcecff]"}`}><p className="text-[11px] font-black">{project.name}</p><p className="mt-1 text-[9px] uppercase text-black/40">{project.stage}</p></Link>)}{!recentProjects.length && <p className="text-xs text-black/45">Aucun projet enregistré.</p>}</div></article>
      <Link href="/visual-lab" className="block rounded-[28px] border border-black/10 bg-[#e9e1fb] p-5"><PanelTitle title="Score qualité réel" /><p className="mt-5 text-[48px] font-black leading-none">{qualityScore}<span className="text-lg">/10</span></p><p className="mt-2 text-sm font-black text-[#7259a4]">{qualityScore === "—" ? "Aucune review" : "Moyenne des reviews"}</p></Link>
    </section>
  </div>;
}
