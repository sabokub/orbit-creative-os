"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project, Stage } from "@/lib/types";
import { listProjects } from "@/lib/storage";
import CommandIcon, { CommandIconName } from "@/components/CommandIcon";

const LAUNCH_DATE = new Date("2026-09-01T09:00:00+02:00");
const STAGE_PROGRESS: Record<Stage, number> = { brief: 12, strategy: 25, creative: 40, website: 58, content: 72, images: 84, review: 94, exported: 100 };
const PRIORITIES = [
  { title: "Finaliser la homepage", detail: "Structure dense + direction visuelle", tag: "Site web", color: "bg-[#dfeac2]", icon: "website" as CommandIconName },
  { title: "Préparer le contenu teasing", detail: "Vidéo fondatrice + carousel", tag: "Contenu", color: "bg-[#dcecff]", icon: "content" as CommandIconName },
  { title: "Valider le guide client", detail: "Version finale avant lancement", tag: "Orbit Critic", color: "bg-[#f9d9e6]", icon: "critic" as CommandIconName },
];
const LAUNCH_BOARD = [["Identité & marque",100,"brain"],["Site web",78,"website"],["Contenus & réseaux",64,"content"],["Produits & ressources",52,"library"],["Système & automatisations",86,"sparkles"]] as const;
const CONTENT_QUEUE = [["Teasing 24March OS","Post Instagram","À créer","18 juil."],["Studio Life #3","Reel / coulisses","À publier","20 juil."],["Guide client","Carousel Instagram","À revoir","22 juil."],["Pourquoi 24March","TikTok / Reel","À écrire","24 juil."]] as const;
const SITE_PAGES = [["Accueil",88],["À propos",72],["Journal",42],["Contact",30],["Mentions légales",20]] as const;

function PanelTitle({ title, href }: { title: string; href?: string }) {
  return <div className="flex items-center justify-between gap-4"><h2 className="text-[11px] font-black uppercase tracking-[0.12em]">{title}</h2>{href && <Link href={href} className="rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[10px] font-bold text-black/55">Voir tout</Link>}</div>;
}

function MetricCard({ label, value, note, icon, tint, href }: { label: string; value: string | number; note: string; icon: CommandIconName; tint: string; href: string }) {
  return <Link href={href} className={`block rounded-[24px] border border-black/10 p-4 shadow-[0_10px_28px_rgba(38,37,32,0.05)] ${tint}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/55">{label}</p><p className="mt-2 text-[36px] font-black leading-none tracking-[-0.04em]">{value}</p></div><span className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-black/10 bg-white/70"><CommandIcon name={icon} className="h-[18px] w-[18px]" /></span></div><p className="mt-3 text-[11px] font-semibold text-black/52">{note}</p></Link>;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [daysUntilLaunch, setDaysUntilLaunch] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilLaunch(Math.max(0, Math.ceil((LAUNCH_DATE.getTime() - Date.now()) / 86_400_000)));
    listProjects().then((items) => { setProjects(items); setLoaded(true); }).catch((err) => { setError((err as Error).message); setLoaded(true); });
  }, []);

  const recentProjects = [...projects].sort((a,b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0,5);
  const totalOutputs = projects.reduce((sum,p) => sum + Object.keys(p.outputs).length,0);
  const totalReviews = projects.reduce((sum,p) => sum + p.reviews.length,0);
  const totalExports = projects.reduce((sum,p) => sum + p.exports.length,0);
  const needsAttention = projects.reduce((sum,p) => sum + p.reviews.filter((r) => r.status === "Needs revision" || r.status === "Blocked").length,0);
  const averageProgress = projects.length ? Math.round(projects.reduce((sum,p) => sum + STAGE_PROGRESS[p.stage],0) / projects.length) : 0;
  const qualityScore = totalReviews ? Math.max(6.8, Math.min(9.4, 8.2 - needsAttention * 0.2 + totalExports * 0.05)).toFixed(1) : "—";

  return <div className="mx-auto max-w-[1500px] space-y-4 pb-8">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">👋 Bienvenue, Sab</h1><p className="mt-1 text-sm font-medium text-black/52">Voici ce qui se passe aujourd’hui dans ton studio.</p></div><div className="flex flex-wrap items-center gap-2"><span className="command-pill bg-[#e8f3ff]"><CommandIcon name="sparkles" className="h-3.5 w-3.5" /> Mode Build</span><div className="hidden min-w-[210px] items-center gap-2 rounded-full border border-black/10 bg-white/75 px-4 py-2.5 text-xs font-semibold text-black/35 md:flex"><CommandIcon name="focus" className="h-4 w-4" /> Rechercher…</div><Link href="/projects/new" className="command-button hidden sm:inline-flex"><CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet</Link></div></header>

    <section className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
      <article className="relative min-h-[320px] overflow-hidden rounded-[30px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8_0%,#f7f3e7_55%,#edf2e5_100%)] p-5 shadow-[0_18px_44px_rgba(70,68,57,0.07)] sm:p-6"><div className="absolute inset-0 opacity-80 [background:radial-gradient(circle_at_80%_85%,rgba(195,217,149,0.2),transparent_34%),radial-gradient(circle_at_12%_10%,rgba(245,223,117,0.16),transparent_26%)]" /><div className="relative flex h-full flex-col justify-between"><div className="flex items-start justify-between gap-3"><span className="rounded-full border border-black/10 bg-[#f4efdc]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em]">24March Studio / Mode build</span><Link href="/launch" className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 bg-white/80" aria-label="Ouvrir le lancement"><CommandIcon name="launch" className="h-5 w-5" /></Link></div><div className="mt-10"><p className="text-[11px] font-black uppercase tracking-[0.14em]">Compte à rebours lancement</p><div className="mt-2 flex items-end gap-3"><span className="text-[56px] font-black leading-[0.82] tracking-[-0.07em] sm:text-[86px] lg:text-[106px]">{daysUntilLaunch ?? "—"}</span><span className="mb-2 text-sm font-black uppercase leading-tight tracking-[0.1em]">jours<br />restants</span></div><p className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-[#7d9f4c]">1er septembre 2026</p><div className="mt-6 max-w-xl"><div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.11em]"><span>Progression globale</span><span>{averageProgress}%</span></div><div className="mt-2 h-3 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${averageProgress}%` }} /></div></div></div></div></article>

      <article className="rounded-[30px] border border-black/10 bg-white/78 p-5 shadow-[0_18px_44px_rgba(70,68,57,0.06)] sm:p-6"><PanelTitle title="Priorités du jour" /><div className="mt-4 space-y-3">{PRIORITIES.map((item) => <Link href="/launch#tasks" key={item.title} className="flex items-center gap-3 rounded-[20px] border border-black/8 bg-[#fffdf8] p-3"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] ${item.color}`}><CommandIcon name={item.icon} className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-black">{item.title}</p><p className="mt-0.5 truncate text-[11px] font-medium text-black/45">{item.detail}</p></div><span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[9px] font-black">{item.tag}</span></Link>)}</div><Link href="/launch#tasks" className="mt-4 flex items-center justify-end gap-2 border-t border-black/8 pt-4 text-[10px] font-black uppercase tracking-[0.1em]">Voir toutes les tâches <CommandIcon name="arrow" className="h-4 w-4" /></Link></article>
    </section>

    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4"><MetricCard label="Projets actifs" value={projects.length} note="Dans le pipeline ORBIT" icon="projects" tint="bg-[#eef7ff]" href="/projects" /><MetricCard label="Livrables générés" value={totalOutputs} note="Mémoire créative réutilisable" icon="sparkles" tint="bg-[#f2f7e8]" href="/visual-lab" /><MetricCard label="Relectures Orbit Critic" value={totalReviews} note={`${needsAttention} en attente`} icon="critic" tint="bg-[#f5effd]" href="/visual-lab" /><MetricCard label="Exports prêts" value={totalExports} note="Versions validées" icon="library" tint="bg-[#fff8e5]" href="/projects" /></section>
    {error && <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}

    <section className="grid gap-4 xl:grid-cols-[0.85fr_1.25fr_1.2fr]">
      <article className="rounded-[28px] border border-black/10 bg-white/78 p-5 shadow-[0_14px_34px_rgba(70,68,57,0.05)]"><PanelTitle title="Board lancement" /><div className="mt-4 space-y-3.5">{LAUNCH_BOARD.map(([label,value,icon]) => <div key={label} className="grid grid-cols-[28px_1fr_auto] items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-[#edf2e5]"><CommandIcon name={icon} className="h-3.5 w-3.5" /></span><div><p className="text-[11px] font-bold">{label}</p><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/7"><div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${value}%` }} /></div></div><span className="text-[10px] font-black">{value}%</span></div>)}</div><Link href="/launch#roadmap" className="mt-4 flex w-full items-center justify-center gap-2 border-t border-black/8 pt-4 text-[10px] font-black uppercase tracking-[0.1em]">Voir le plan complet <CommandIcon name="arrow" className="h-4 w-4" /></Link></article>

      <article className="rounded-[28px] border border-black/10 bg-white/78 p-5 shadow-[0_14px_34px_rgba(70,68,57,0.05)]"><PanelTitle title="Contenus à créer / publier" href="/launch#content" /><div className="mt-4 divide-y divide-black/7">{CONTENT_QUEUE.map(([title,type,status,date],index) => <Link href="/launch#content" key={title} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 py-2.5"><div className={`h-11 rounded-[12px] ${index===0?"bg-[#e6d3b5]":index===1?"bg-[#d7d7d7]":index===2?"bg-[#f3d9cf]":"bg-[#dcecff]"}`} /><div className="min-w-0"><p className="truncate text-[11px] font-black">{title}</p><p className="mt-0.5 truncate text-[10px] font-medium text-black/40">{type}</p></div><div className="text-right"><span className="rounded-full border border-black/8 bg-[#f8faf4] px-2 py-1 text-[9px] font-black">{status}</span><p className="mt-1 text-[9px] font-semibold text-black/35">{date}</p></div></Link>)}</div></article>

      <article className="rounded-[28px] border border-black/10 bg-white/78 p-5 shadow-[0_14px_34px_rgba(70,68,57,0.05)]"><PanelTitle title="Pages du site à terminer" href="/launch#site" /><div className="mt-4 grid gap-4 sm:grid-cols-[0.8fr_1.2fr] xl:grid-cols-1 2xl:grid-cols-[0.8fr_1.2fr]"><div className="space-y-3">{SITE_PAGES.map(([label,value]) => <Link href="/launch#site" key={label} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#c3d995] text-[8px] font-black">{value}%</span><span className="text-[11px] font-bold">{label}</span></Link>)}</div><Link href="/launch#site" className="min-h-[170px] rounded-[18px] border border-black/10 bg-[#f5f3ed] p-3"><div className="h-full rounded-[12px] border border-black/8 bg-white p-3"><p className="display-serif text-2xl leading-none">24MARCH<br />STUDIO</p><div className="mt-5 h-14 rounded-[8px] bg-[#dfddd6]" /></div></Link></div></article>
    </section>

    <section className="grid gap-4 xl:grid-cols-[0.8fr_1.25fr_1.15fr]">
      <article className="rounded-[28px] border border-black/10 bg-[#fff0f5] p-5"><PanelTitle title={`Tâches bloquées · ${needsAttention}`} href="/launch#tasks" /><div className="mt-4 space-y-2.5"><Link href="/launch#tasks" className="flex items-center gap-3 rounded-[16px] bg-white/70 p-3"><CommandIcon name="clock" className="h-4 w-4" /><p className="text-[11px] font-black">Validation visuelle finale</p></Link><Link href="/launch#tasks" className="flex items-center gap-3 rounded-[16px] bg-white/70 p-3"><CommandIcon name="clock" className="h-4 w-4" /><p className="text-[11px] font-black">Connexion du domaine</p></Link></div></article>
      <article className="rounded-[28px] border border-black/10 bg-white/78 p-5"><PanelTitle title="Projets récents" href="/projects" /><div className="mt-4 flex gap-3 overflow-x-auto pb-1 scrollbar-hide">{!loaded && [1,2,3].map((i)=><div key={i} className="h-32 min-w-[128px] animate-pulse rounded-[18px] bg-black/5" />)}{loaded && recentProjects.map((project,index)=><Link key={project.id} href={`/projects/${project.id}`} className={`min-w-[145px] rounded-[18px] border border-black/8 p-3 ${index%2===0?"bg-[#efe3cc]":"bg-[#dcecff]"}`}><div className="h-16 rounded-[12px] bg-white/45" /><p className="mt-3 line-clamp-2 text-[11px] font-black">{project.name}</p></Link>)}</div></article>
      <Link href="/visual-lab" className="block rounded-[28px] border border-black/10 bg-[#e9e1fb] p-5"><PanelTitle title="Score qualité" /><div className="mt-5"><p className="text-[48px] font-black leading-none tracking-[-0.06em]">{qualityScore}<span className="text-lg">/10</span></p><p className="mt-2 text-sm font-black text-[#7259a4]">{qualityScore === "—" ? "En attente" : "Très solide"}</p></div><p className="mt-3 text-right text-[10px] font-bold text-black/45">Basé sur {totalReviews} relectures</p></Link>
    </section>
  </div>;
}
