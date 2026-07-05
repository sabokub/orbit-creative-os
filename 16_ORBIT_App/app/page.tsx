"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { listProjects } from "@/lib/storage";
import ProjectCard from "@/components/ProjectCard";
import { STEP_LABELS, STEP_ORDER } from "@/lib/prompts";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setProjects(listProjects());
    setLoaded(true);
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Projets</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Brief → stratégie → créa → site → contenu → images → review → export.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-lg bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          New Project
        </Link>
      </div>

      {loaded && projects.length === 0 && (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Aucun projet pour l&apos;instant. Crée ton premier projet pour lancer le flow ORBIT.
          </p>
          <Link
            href="/projects/new"
            className="mt-4 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            Créer un projet
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Workflows disponibles
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {STEP_ORDER.map((step) => (
            <div
              key={step}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:text-neutral-300"
            >
              {STEP_LABELS[step]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
