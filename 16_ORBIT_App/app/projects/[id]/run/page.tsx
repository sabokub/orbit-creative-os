"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Project, WorkflowStep } from "@/lib/types";
import { getProject, saveProject } from "@/lib/storage";
import { buildPrompt, detectReviewStatus, STEP_LABELS, STEP_ORDER } from "@/lib/prompts";
import PromptPreview from "@/components/PromptPreview";

function RunnerContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const step = (searchParams.get("step") as WorkflowStep) || "strategy";

  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [reviewTarget, setReviewTarget] = useState<WorkflowStep>("website");
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProject(params.id)
      .then(setProject)
      .catch((err) => setError((err as Error).message));
    setPasted("");
  }, [params.id, step]);

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
        <Link href="/" className="mt-3 inline-block text-sm underline">Retour au dashboard</Link>
      </div>
    );
  }

  const priorOutputs = Object.fromEntries(
    Object.entries(project.outputs).map(([k, v]) => [k, v?.content || ""])
  ) as Partial<Record<WorkflowStep, string>>;

  const prompt =
    step === "review"
      ? buildPrompt("review", project.brief, priorOutputs, reviewTarget)
      : buildPrompt(step, project.brief, priorOutputs);

  async function saveResult() {
    if (!project || !pasted.trim()) return;
    setSaving(true);
    try {
      let next: Project;
      if (step === "review") {
        const status = detectReviewStatus(pasted);
        next = {
          ...project,
          reviews: [
            ...project.reviews,
            { target: reviewTarget, content: pasted, status, created_at: new Date().toISOString() },
          ],
          stage: "review",
        };
      } else {
        next = {
          ...project,
          outputs: {
            ...project.outputs,
            [step]: { step, content: pasted, created_at: new Date().toISOString() },
          },
          stage: step,
        };
      }
      const saved = await saveProject(next);
      setProject(saved);
      setPasted("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          {STEP_LABELS[step]} — {project.name}
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Copie le prompt, génère la réponse dans ChatGPT/Claude, colle le résultat ci-dessous.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STEP_ORDER.map((s) => (
          <Link
            key={s}
            href={`/projects/${project.id}/run?step=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              s === step
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : "border border-neutral-300 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300"
            }`}
          >
            {STEP_LABELS[s]}
          </Link>
        ))}
      </div>

      {step === "review" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Livrable à reviewer
          </label>
          <select
            value={reviewTarget}
            onChange={(e) => setReviewTarget(e.target.value as WorkflowStep)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {(["website", "content", "images", "strategy", "creative"] as WorkflowStep[]).map((t) => (
              <option key={t} value={t}>
                {STEP_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      )}

      <PromptPreview prompt={prompt} />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Coller la réponse générée
        </label>
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={10}
          className="w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          placeholder="Colle ici la sortie de ChatGPT / Claude..."
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={saveResult}
            disabled={!pasted.trim() || saving}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-40 dark:bg-white dark:text-neutral-900"
          >
            {saving ? "Enregistrement..." : "Enregistrer dans le projet"}
          </button>
          <Link
            href={`/projects/${project.id}`}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
          >
            Retour au projet
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowRunnerPage() {
  return (
    <Suspense fallback={null}>
      <RunnerContent />
    </Suspense>
  );
}
