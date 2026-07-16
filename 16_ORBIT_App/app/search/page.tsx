"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useStudioPlan } from "@/hooks/useStudioPlan";
import { listProjects } from "@/lib/storage";
import { Project } from "@/lib/types";

export default function SearchPage() {
  const { plan } = useStudioPlan();
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  useEffect(() => { void listProjects().then(setProjects); }, []);

  const results = useMemo(() => {
    const rows = [
      ...plan.priorities.map((item) => ({ id: `task-${item.id}`, type: "Tâche", title: item.title, subtitle: item.detail, href: "/launch#tasks" })),
      ...plan.contentQueue.map((item) => ({ id: `content-${item.id}`, type: "Contenu", title: item.title, subtitle: item.format, href: "/launch#content" })),
      ...plan.decisions.map((item) => ({ id: `decision-${item.id}`, type: "Décision", title: item.title, subtitle: item.summary, href: "/launch#decisions" })),
      ...plan.sitePages.map((item) => ({ id: `page-${item.id}`, type: "Page du site", title: item.title, subtitle: item.status, href: "/launch#site" })),
      ...projects.map((item) => ({ id: `project-${item.id}`, type: "Projet", title: item.name, subtitle: item.stage, href: `/projects/${item.id}` })),
    ];
    const needle = query.trim().toLowerCase();
    return needle ? rows.filter((row) => `${row.type} ${row.title} ${row.subtitle}`.toLowerCase().includes(needle)) : rows.slice(0, 12);
  }, [plan, projects, query]);

  return <div className="space-y-4 pb-36 lg:pb-8">
    <header><p className="command-label">Recherche universelle</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Tout retrouver dans ORBIT</h1><p className="mt-1 text-sm text-black/48">Tâches, contenus, décisions, pages et projets dans une seule recherche.</p></header>
    <section className="command-card p-4 sm:p-5">
      <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ex. guide, homepage, Instagram…" className="w-full !min-h-[52px] !rounded-[16px] border border-black/10 bg-white px-4 text-sm font-bold outline-none" />
      <div className="mt-4 space-y-2">
        {results.map((result) => <Link href={result.href} key={result.id} className="flex items-center justify-between gap-4 rounded-[18px] border border-black/8 bg-white/75 p-4"><div className="min-w-0"><span className="rounded-full bg-[#edf2e5] px-2 py-1 text-[9px] font-black uppercase">{result.type}</span><p className="mt-2 truncate text-sm font-black">{result.title}</p><p className="mt-1 truncate text-[11px] text-black/45">{result.subtitle}</p></div><span className="shrink-0 text-black/30">→</span></Link>)}
        {!results.length && <p className="rounded-[18px] bg-[#fff8e5] p-4 text-sm font-semibold text-black/50">Aucun résultat.</p>}
      </div>
    </section>
  </div>;
}
