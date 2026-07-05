import Link from "next/link";
import { Project } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function ProjectCard({ project }: { project: Project }) {
  const lastReview = project.reviews[project.reviews.length - 1];
  return (
    <Link
      href={`/projects/${project.id}`}
      className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{project.name}</h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{project.type || "Projet ORBIT"}</p>
        </div>
        <StatusBadge status={lastReview?.status || "Not reviewed"} />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
        <span className="capitalize">Étape : {project.stage}</span>
        <span>{new Date(project.updated_at).toLocaleDateString("fr-FR")}</span>
      </div>
    </Link>
  );
}
