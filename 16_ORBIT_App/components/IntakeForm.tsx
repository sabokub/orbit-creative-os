"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brief, emptyBrief } from "@/lib/types";
import { createProject } from "@/lib/storage";

const FIELDS: { key: keyof Brief; label: string; textarea?: boolean; placeholder?: string }[] = [
  { key: "project_name", label: "Nom du projet" },
  { key: "activity", label: "Activité", textarea: true },
  { key: "audience", label: "Audience", textarea: true },
  { key: "offer", label: "Offre / services", textarea: true },
  { key: "positioning_goal", label: "Positionnement souhaité", textarea: true },
  { key: "style_keywords", label: "Mots-clés de style" },
  { key: "avoid_keywords", label: "À éviter" },
  { key: "colors_accent", label: "Couleurs d'accent" },
  { key: "references", label: "Références" },
  { key: "competitors", label: "Concurrents" },
  { key: "channels", label: "Canaux (séparés par virgule)" },
  { key: "budget", label: "Budget" },
  { key: "timeline", label: "Deadline" },
  { key: "tools", label: "Outils déjà utilisés" },
  { key: "format", label: "Format de livraison" },
  { key: "success_criteria", label: "Critère de succès", textarea: true },
];

export default function IntakeForm() {
  const router = useRouter();
  const [brief, setBrief] = useState<Brief>(emptyBrief());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(key: keyof Brief, value: string) {
    setBrief((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!brief.project_name.trim()) {
      setError("Le nom du projet est obligatoire.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const project = await createProject(brief);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key} className={field.textarea ? "sm:col-span-2" : ""}>
            <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {field.label}
            </label>
            {field.textarea ? (
              <textarea
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                rows={3}
                value={brief[field.key]}
                onChange={(e) => update(field.key, e.target.value)}
              />
            ) : (
              <input
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                value={brief[field.key]}
                onChange={(e) => update(field.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </p>
      )}

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 sm:w-auto dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        {submitting ? "Création..." : "Créer le projet"}
      </button>
    </div>
  );
}
