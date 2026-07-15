"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Project, WorkflowStep } from "@/lib/types";
import { getProject } from "@/lib/storage";
import { STEP_LABELS } from "@/lib/prompts";
import ExportButton from "@/components/ExportButton";
import CommandIcon, { CommandIconName } from "@/components/CommandIcon";

const FILTERS: Array<"all" | Exclude<WorkflowStep, "review">> = ["all", "strategy", "creative", "website", "content", "images"];

const META: Record<Exclude<WorkflowStep, "review">, { icon: CommandIconName; accent: string }> = {
  strategy: { icon: "strategy", accent: "bg-[#f5df75]" },
  creative: { icon: "sparkles", accent: "bg-[#f2b8cf]" },
  website: { icon: "website", accent: "bg-[#bdd8f8]" },
  content: { icon: "content", accent: "bg-[#f1a36f]" },
  images: { icon: "image", accent: "bg-[#cfc5f4]" },
};

export default function OutputLibraryPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [error, setError] = useState("");

  useEffect(() => {
    getProject(params.id)
      .then(setProject)
      .catch((err) => setError((err as Error).message));
  }, [params.id]);

  if (error) return <div className="rounded-[22px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>;
  if (project === undefined) return <div className="h-[520px] animate-pulse rounded-[34px] bg-white/45" />;
  if (project === null) return <div className="command-card p-8 text-center"><p className="display-serif text-4xl">Project not found.</p><Link href="/" className="command-button mt-5">Back home</Link></div>;

  const outputEntries = Object.entries(project.outputs).filter(([step]) => filter === "all" || filter === step);

  return (
    <div className="space-y-5 sm:space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="command-label"><CommandIcon name="library" className="h-3.5 w-3.5" /> System memory</span>
          <h1 className="display-serif mt-3 text-5xl leading-[0.95] sm:text-7xl">Output <span className="italic">Library.</span></h1>
          <p className="mt-3 text-sm font-medium text-black/52">{project.name} · {Object.keys(project.outputs).length} saved outputs · {project.exports.length} exports</p>
        </div>
        <Link href={`/projects/${project.id}`} className="command-button command-button-soft self-start"><CommandIcon name="arrow" className="h-4 w-4 rotate-180" /> Back to project</Link>
      </header>

      <section className="relative overflow-hidden rounded-[32px] border border-black/12 bg-[#151515] p-5 text-white sm:p-7">
        <div className="dot-grid absolute inset-0 opacity-[0.1]" />
        <div className="absolute -right-12 -top-14 h-52 w-52 rounded-full bg-[#cfc5f4]" />
        <div className="relative grid gap-5 sm:grid-cols-3">
          <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38">Saved outputs</p><p className="display-serif mt-2 text-6xl">{Object.keys(project.outputs).length}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38">Reviews</p><p className="display-serif mt-2 text-6xl">{project.reviews.length}</p></div>
          <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/38">Exports</p><p className="display-serif mt-2 text-6xl">{project.exports.length}</p></div>
        </div>
      </section>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black ${filter === item ? "border-black bg-[#151515] text-white" : "border-black/10 bg-white/60 text-black/48 hover:bg-white hover:text-black"}`}
          >
            {item === "all" ? "All outputs" : STEP_LABELS[item]}
          </button>
        ))}
      </div>

      {outputEntries.length === 0 ? (
        <div className="command-card flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#cfc5f4]"><CommandIcon name="library" className="h-6 w-6" /></span>
          <h2 className="display-serif mt-4 text-4xl">Nothing here yet.</h2>
          <p className="mt-2 max-w-sm text-sm font-semibold text-black/42">Run the corresponding ORBIT engine and validate its output to add it to this library.</p>
          <Link href={`/projects/${project.id}`} className="command-button mt-5"><CommandIcon name="sparkles" className="h-4 w-4" /> Open engines</Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {outputEntries.map(([step, output]) => {
            const typedStep = step as Exclude<WorkflowStep, "review">;
            const meta = META[typedStep];
            return (
              <article key={step} className="command-card-flat flex min-h-[235px] flex-col p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 ${meta.accent}`}><CommandIcon name={meta.icon} className="h-5 w-5" /></span>
                  <ExportButton filename={`${project.id}_${step}`} content={output!.content} />
                </div>
                <div className="mt-5">
                  <p className="command-label">Saved output</p>
                  <h2 className="display-serif mt-2 text-4xl">{STEP_LABELS[typedStep]}</h2>
                  <p className="mt-3 text-xs font-semibold text-black/38">Saved {new Date(output!.created_at).toLocaleString("fr-FR")}</p>
                </div>
                <Link href={`/projects/${project.id}/run?step=${step}`} className="mt-auto flex items-center justify-between border-t border-black/10 pt-4 text-xs font-black uppercase tracking-[0.1em] text-black/45 hover:text-black">
                  Open & regenerate <CommandIcon name="arrow" className="h-4 w-4" />
                </Link>
              </article>
            );
          })}
        </div>
      )}

      {project.exports.length > 0 && (
        <section className="command-card p-5 sm:p-6">
          <span className="command-label">Export history</span>
          <h2 className="display-serif mt-2 text-4xl">What left the system</h2>
          <div className="mt-5 space-y-2">
            {[...project.exports].reverse().map((record, index) => (
              <div key={`${record.created_at}-${index}`} className="flex flex-col gap-2 rounded-[18px] border border-black/10 bg-white/55 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-[#f5df75]"><CommandIcon name="arrow" className="h-4 w-4 -rotate-45" /></span><div><p className="font-black capitalize">{record.target}</p><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/35">{record.format}</p></div></div>
                <p className="text-xs font-semibold text-black/38">{new Date(record.created_at).toLocaleString("fr-FR")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
