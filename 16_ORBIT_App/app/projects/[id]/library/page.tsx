"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Project } from "@/lib/types";
import { getProject } from "@/lib/storage";
import { STEP_LABELS } from "@/lib/prompts";
import ExportButton from "@/components/ExportButton";

export default function OutputLibraryPage() {
  const params = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    setProject(getProject(params.id));
  }, [params.id]);

  if (project === undefined) return null;
  if (project === null) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
        <p className="text-sm text-neutral-500">Projet introuvable.</p>
        <Link href="/" className="mt-3 inline-block text-sm underline">Retour au dashboard</Link>
      </div>
    );
  }

  const outputEntries = Object.entries(project.outputs).filter(
    ([step]) => filter === "all" || filter === step
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Output Library — {project.name}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Historique des livrables générés et des exports pour ce projet.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["all", "strategy", "creative", "website", "content", "images"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === f
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
            }`}
          >
            {f === "all" ? "Tout" : STEP_LABELS[f as keyof typeof STEP_LABELS]}
          </button>
        ))}
      </div>

      {outputEntries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">Aucune génération encore pour ce filtre.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {outputEntries.map(([step, output]) => (
            <div key={step} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                  {STEP_LABELS[step as keyof typeof STEP_LABELS]}
                </span>
                <ExportButton filename={`${project.id}_${step}`} content={output!.content} />
              </div>
              <p className="text-xs text-neutral-400">
                Généré le {new Date(output!.created_at).toLocaleString("fr-FR")}
              </p>
            </div>
          ))}
        </div>
      )}

      {project.exports.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Historique d&apos;export
          </h2>
          <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
            {project.exports.map((e, i) => (
              <li key={i}>
                {new Date(e.created_at).toLocaleString("fr-FR")} — {e.target} ({e.format})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
