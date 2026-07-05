"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateProjectInput, createProject } from "@/lib/storage";
import { WorkflowType } from "@/lib/types";
import { DEFAULT_BRAND_PROFILE, WORKFLOW_TYPE_LABELS } from "@/lib/brandProfile";

const WORKFLOW_OPTIONS: WorkflowType[] = ["website", "content", "images", "review", "brand-kit"];

const SAMPLE: CreateProjectInput = {
  name: "Homepage 24March Studio",
  workflowType: "website",
  projectGoal: "Créer la structure et les textes de la homepage du site.",
  specificContext:
    "Le site doit présenter le studio, sa méthode, ses offres, son univers visuel, et donner envie de réserver un audit ou une prestation.",
  deliverableType: "Homepage complète avec hero section, sections, CTA, FAQ, prompts image.",
  references: "",
  constraints: "",
  channels: "Website",
  format: "Markdown",
  successCriteria:
    "Le site doit immédiatement communiquer : intérieur comme identité, cool people live here, lifestyle éditorial à la maison, direction artistique d'intérieur.",
};

function emptyInput(): CreateProjectInput {
  return {
    name: "",
    workflowType: "website",
    projectGoal: "",
    specificContext: "",
    deliverableType: "",
    references: "",
    constraints: "",
    channels: "Instagram, TikTok, Pinterest, Website",
    format: "Markdown",
    successCriteria: "",
  };
}

export default function IntakeForm() {
  const router = useRouter();
  const [input, setInput] = useState<CreateProjectInput>(emptyInput());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  function update<K extends keyof CreateProjectInput>(key: K, value: CreateProjectInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!input.name.trim()) {
      setError("Le nom du projet est obligatoire.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const project = await createProject(input);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
              Brand Profile utilisé
            </p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {DEFAULT_BRAND_PROFILE.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              Default brand profile
            </span>
            <Link
              href="/brand-profile"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              View brand profile
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setBrandOpen((v) => !v)}
          className="mt-3 text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          {brandOpen ? "Masquer" : "Voir"} le Brand DNA hérité de 24March Studio
        </button>

        {brandOpen && (
          <dl className="mt-3 space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
            <div><dt className="font-medium text-neutral-500">Positioning</dt><dd>{DEFAULT_BRAND_PROFILE.positioning}</dd></div>
            <div><dt className="font-medium text-neutral-500">Audience</dt><dd>{DEFAULT_BRAND_PROFILE.audience}</dd></div>
            <div><dt className="font-medium text-neutral-500">Visual direction</dt><dd>{DEFAULT_BRAND_PROFILE.visualDirection}</dd></div>
            <div><dt className="font-medium text-neutral-500">Avoid</dt><dd>{DEFAULT_BRAND_PROFILE.avoid.join(", ")}</dd></div>
          </dl>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Remplis uniquement le contexte spécifique à ce livrable.
        </p>
        <button
          type="button"
          onClick={() => setInput(SAMPLE)}
          className="text-xs font-medium text-neutral-500 underline underline-offset-2 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          Charger l&apos;exemple (Homepage 24March Studio)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Nom du projet
          </label>
          <input
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Type de workflow
          </label>
          <select
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.workflowType}
            onChange={(e) => update("workflowType", e.target.value as WorkflowType)}
          >
            {WORKFLOW_OPTIONS.map((w) => (
              <option key={w} value={w}>
                {WORKFLOW_TYPE_LABELS[w]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Objectif du projet
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.projectGoal}
            onChange={(e) => update("projectGoal", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Contexte spécifique
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.specificContext}
            onChange={(e) => update("specificContext", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Livrable attendu
          </label>
          <input
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.deliverableType}
            onChange={(e) => update("deliverableType", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Références spécifiques
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.references}
            onChange={(e) => update("references", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Contraintes spécifiques
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.constraints}
            onChange={(e) => update("constraints", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Canaux concernés
          </label>
          <input
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.channels}
            onChange={(e) => update("channels", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Format de livraison
          </label>
          <input
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.format}
            onChange={(e) => update("format", e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Critère de succès
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            value={input.successCriteria}
            onChange={(e) => update("successCriteria", e.target.value)}
          />
        </div>
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
