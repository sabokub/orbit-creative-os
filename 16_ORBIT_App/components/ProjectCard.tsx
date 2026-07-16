import Link from "next/link";
import { Project, Stage } from "@/lib/types";
import StatusBadge from "./StatusBadge";
import CommandIcon, { CommandIconName } from "./CommandIcon";

const STAGE_META: Record<Stage, { label: string; progress: number }> = {
  brief: { label: "Brief", progress: 12 },
  strategy: { label: "Stratégie", progress: 25 },
  creative: { label: "Direction créative", progress: 40 },
  website: { label: "Site internet", progress: 58 },
  content: { label: "Contenu", progress: 72 },
  images: { label: "Production visuelle", progress: 84 },
  review: { label: "Relecture", progress: 94 },
  exported: { label: "Livré", progress: 100 },
};

const TYPE_META: Record<string, { accent: string; icon: CommandIconName }> = {
  website: { accent: "bg-[#bdd8f8]", icon: "website" },
  content: { accent: "bg-[#f1a36f]", icon: "content" },
  images: { accent: "bg-[#cfc5f4]", icon: "image" },
  review: { accent: "bg-[#c3d995]", icon: "critic" },
  "brand-kit": { accent: "bg-[#f5df75]", icon: "brain" },
};

export default function ProjectCard({
  project,
  onRequestDelete,
}: {
  project: Project;
  onRequestDelete?: (project: Project) => void;
}) {
  const lastReview = project.reviews[project.reviews.length - 1];
  const stage = STAGE_META[project.stage];
  const workflow = TYPE_META[project.brief?.workflowType] || { accent: "bg-[#f2b8cf]", icon: "projects" as CommandIconName };

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative flex min-h-[205px] flex-col overflow-hidden rounded-[26px] border border-black/10 bg-[#fffdf8]/72 p-4 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_35px_rgba(32,30,25,0.09)] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 ${workflow.accent}`}>
          <CommandIcon name={workflow.icon} className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-2">
          <StatusBadge status={lastReview?.status || "Not reviewed"} />
          {onRequestDelete && (
            <button
              type="button"
              aria-label={`Supprimer le projet "${project.name}"`}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onRequestDelete(project);
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/90 text-black/45 opacity-0 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <CommandIcon name="trash" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-black uppercase tracking-[0.13em] text-black/38">{project.type || "Projet ORBIT"}</p>
        <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight tracking-[-0.025em]">{project.name}</h3>
      </div>

      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.11em] text-black/42">
          <span>{stage.label}</span>
          <span>{stage.progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/[0.07]">
          <div className={`h-full rounded-full ${workflow.accent}`} style={{ width: `${stage.progress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-black/42">
          <span>{Object.keys(project.outputs).length} livrable{Object.keys(project.outputs).length > 1 ? "s" : ""}</span>
          <span className="flex items-center gap-1.5 group-hover:text-black">Ouvrir <CommandIcon name="arrow" className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </Link>
  );
}
