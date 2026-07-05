"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Project, WorkflowStep } from "@/lib/types";
import { getProject, saveProject } from "@/lib/storage";
import { STEP_LABELS, STEP_ORDER } from "@/lib/prompts";
import { DEFAULT_BRAND_PROFILE, WORKFLOW_TYPE_LABELS } from "@/lib/brandProfile";
import WorkflowSelector from "@/components/WorkflowSelector";
import OutputPanel from "@/components/OutputPanel";
import ReviewScoreCard from "@/components/ReviewScoreCard";
import ExportButton from "@/components/ExportButton";
import StatusBadge from "@/components/StatusBadge";

export default function ProjectWorkspace() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    getProject(params.id)
      .then(setProject)
      .catch((err) => setError((err as Error).message));
  }, [params.id]);

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (project === undefined) return null;
  if (project === null) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">Projet introuvable.</p>
        <Link href="/" className="mt-3 inline-block text-sm underline">
          Retour au dashboard
        </Link>
      </div>
    );
  }

  const completed: Partial<Record<WorkflowStep, boolean>> = {};
  STEP_ORDER.forEach((s) => {
    completed[s] = Boolean(project.outputs[s]);
  });

  async function update(patch: Partial<Project>) {
    if (!project) return;
    const next = { ...project, ...patch };
    const saved = await saveProject(next);
    setProject(saved);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">{project.name}</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {WORKFLOW_TYPE_LABELS[project.brief.workflowType]} · Brand Profile : {DEFAULT_BRAND_PROFILE.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={project.reviews[project.reviews.length - 1]?.status || "Not reviewed"} />
          <Link
            href={`/projects/${project.id}/library`}
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            Output Library
          </Link>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Project Brief</h2>
          <Link href="/brand-profile" className="text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-800 dark:hover:text-neutral-200">
            Brand DNA héritée de {DEFAULT_BRAND_PROFILE.name}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 p-4 text-sm sm:grid-cols-2 dark:border-neutral-800">
          <p><span className="text-neutral-500">Objectif :</span> {project.brief.projectGoal || "—"}</p>
          <p><span className="text-neutral-500">Livrable attendu :</span> {project.brief.deliverableType || "—"}</p>
          <p className="sm:col-span-2"><span className="text-neutral-500">Contexte spécifique :</span> {project.brief.specificContext || "—"}</p>
          <p><span className="text-neutral-500">Canaux :</span> {project.brief.channels || "—"}</p>
          <p><span className="text-neutral-500">Format :</span> {project.brief.format || "—"}</p>
          <p className="sm:col-span-2"><span className="text-neutral-500">Critère de succès :</span> {project.brief.successCriteria || "—"}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Lancer une étape
        </h2>
        <WorkflowSelector projectId={project.id} completed={completed} />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Sorties générées</h2>
        {STEP_ORDER.filter((s) => s !== "review").map((step) => (
          <div key={step} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {STEP_LABELS[step]}
              </h3>
              {project.outputs[step] && (
                <ExportButton
                  filename={`${project.id}_${step}`}
                  content={project.outputs[step]!.content}
                  disabled={
                    project.reviews.find((r) => r.target === step)?.status === "Blocked"
                  }
                  onExported={() =>
                    update({ exports: [...project.exports, { target: step, format: "markdown", created_at: new Date().toISOString() }] })
                  }
                />
              )}
            </div>
            <OutputPanel
              title={STEP_LABELS[step]}
              content={project.outputs[step]?.content}
              onSave={(value) =>
                update({
                  outputs: {
                    ...project.outputs,
                    [step]: { step, content: value, created_at: new Date().toISOString() },
                  },
                })
              }
            />
          </div>
        ))}
      </section>

      {project.reviews.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Reviews</h2>
          {project.reviews.map((r, i) => (
            <ReviewScoreCard key={i} review={r} />
          ))}
        </section>
      )}
    </div>
  );
}
