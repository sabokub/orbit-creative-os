"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { listProjects } from "@/lib/storage";
import CommandIcon from "@/components/CommandIcon";

export default function VisualLabPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { listProjects().then(setProjects).finally(() => setLoading(false)); }, []);

  const visualItems = useMemo(() => projects.flatMap((project) => Object.entries(project.outputs)
    .filter(([step]) => step === "images" || step === "creative")
    .map(([step, output]) => ({ project, step, output }))), [projects]);

  return (
    <div className="space-y-4 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><span className="command-label"><CommandIcon name="sparkles" className="h-3.5 w-3.5" /> Production visuelle</span><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Laboratoire visuel</h1><p className="mt-1 text-sm font-medium text-black/48">Prompts, directions créatives et générations liées à tes projets.</p></div>
        <Link href="/projects/new" className="command-button self-start"><CommandIcon name="plus" className="h-4 w-4" /> Nouveau brief visuel</Link>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Directions", visualItems.filter((item) => item.step === "creative").length, "bg-[#f9e9f0]"],
          ["Prompts image", visualItems.filter((item) => item.step === "images").length, "bg-[#efeafd]"],
          ["Projets sources", new Set(visualItems.map((item) => item.project.id)).size, "bg-[#eef7ff]"],
          ["À relire", projects.reduce((sum, p) => sum + p.reviews.filter((r) => r.status !== "Approved").length, 0), "bg-[#f2f7e8]"],
        ].map(([label, value, color]) => <article key={String(label)} className={`rounded-[20px] border border-black/10 p-4 ${color}`}><p className="text-[9px] font-black uppercase tracking-[0.1em] text-black/48">{label}</p><p className="mt-2 text-3xl font-black tracking-[-0.05em]">{value}</p></article>)}
      </section>

      <section className="command-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><p className="command-label">Mémoire visuelle</p><h2 className="mt-1 text-xl font-black">Derniers éléments</h2></div><span className="command-pill bg-[#cfc5f4]/55">{visualItems.length} éléments</span></div>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading && [0,1,2].map((item) => <div key={item} className="h-44 animate-pulse rounded-[22px] bg-black/5" />)}
          {!loading && visualItems.map(({ project, step, output }) => (
            <Link key={`${project.id}-${step}`} href={`/projects/${project.id}`} className="min-w-0 rounded-[22px] border border-black/10 bg-white/70 p-4 transition hover:-translate-y-0.5 hover:bg-white">
              <div className="flex items-center justify-between gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-[13px] ${step === 'images' ? 'bg-[#cfc5f4]' : 'bg-[#f2b8cf]'}`}><CommandIcon name={step === 'images' ? 'image' : 'sparkles'} className="h-4 w-4" /></span><span className="command-pill">{step === 'images' ? 'Prompt image' : 'Direction créative'}</span></div>
              <h3 className="mt-4 truncate text-base font-black">{project.name}</h3>
              <p className="mt-2 line-clamp-4 text-xs font-medium leading-relaxed text-black/48">{output?.content || "Contenu indisponible"}</p>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.1em] text-black/38">Ouvrir le projet →</p>
            </Link>
          ))}
        </div>
        {!loading && visualItems.length === 0 && <div className="mt-4 rounded-[20px] border border-dashed border-black/15 p-8 text-center"><CommandIcon name="image" className="mx-auto h-6 w-6" /><p className="mt-3 text-lg font-black">Le lab est encore vide.</p><p className="mt-1 text-sm text-black/45">Lance un moteur Direction créative ou Images depuis un projet.</p></div>}
      </section>
    </div>
  );
}
