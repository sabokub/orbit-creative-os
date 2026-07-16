"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Project, WorkflowStep } from "@/lib/types";
import { deleteProject, getProject, saveProject } from "@/lib/storage";
import { STEP_LABELS, STEP_ORDER } from "@/lib/prompts";
import { DEFAULT_BRAND_PROFILE, WORKFLOW_TYPE_LABELS } from "@/lib/brandProfile";
import WorkflowSelector from "@/components/WorkflowSelector";
import OutputPanel from "@/components/OutputPanel";
import ReviewScoreCard from "@/components/ReviewScoreCard";
import ExportButton from "@/components/ExportButton";
import StatusBadge from "@/components/StatusBadge";
import CommandIcon from "@/components/CommandIcon";
import ConfirmDialog from "@/components/ConfirmDialog";
import { setPendingToast } from "@/components/Toast";

export default function ProjectWorkspace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    getProject(params.id)
      .then(setProject)
      .catch((err) => setError((err as Error).message));
  }, [params.id]);

  async function confirmDelete() {
    if (!project) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await deleteProject(project.id);
      // The project currently open is the one being deleted -- redirect back
      // to the list. The success toast is handed off via sessionStorage since
      // this page is about to unmount before it could render one itself.
      setPendingToast("success", `"${project.name}" a été supprimé, avec toutes ses données Studio Brain associées.`);
      router.push("/projects");
    } catch (err) {
      setDeleteBusy(false);
      setDeleteError((err as Error).message || "La suppression a échoué. Réessaie.");
    }
  }

  function cancelDelete() {
    if (deleteBusy) return;
    setDeleteOpen(false);
    setDeleteError("");
  }

  if (error) {
    return <div className="rounded-[22px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>;
  }

  if (project === undefined) {
    return (
      <div className="space-y-4">
        <div className="h-64 animate-pulse rounded-[34px] bg-white/45" />
        <div className="grid gap-4 sm:grid-cols-3"><div className="h-36 animate-pulse rounded-[26px] bg-white/45" /><div className="h-36 animate-pulse rounded-[26px] bg-white/45" /><div className="h-36 animate-pulse rounded-[26px] bg-white/45" /></div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="command-card flex min-h-[380px] flex-col items-center justify-center px-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#f2b8cf]"><CommandIcon name="projects" className="h-6 w-6" /></span>
        <h1 className="display-serif mt-4 text-4xl">Projet introuvable.</h1>
        <p className="mt-2 text-sm font-semibold text-black/45">Il a peut-être été supprimé ou le lien n’est plus valide.</p>
        <Link href="/" className="command-button mt-5"><CommandIcon name="arrow" className="h-4 w-4 rotate-180" /> Retour à l’accueil</Link>
      </div>
    );
  }

  const completed: Partial<Record<WorkflowStep, boolean>> = {};
  STEP_ORDER.forEach((step) => {
    completed[step] = Boolean(project.outputs[step]);
  });
  const completedCount = STEP_ORDER.filter((step) => completed[step]).length;
  const progress = Math.round((completedCount / STEP_ORDER.length) * 100);
  const lastReview = project.reviews[project.reviews.length - 1];

  async function update(patch: Partial<Project>) {
    if (!project) return;
    const next: Project = { ...project, ...patch };
    const saved = await saveProject(next);
    setProject(saved);
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <section className="relative overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8_0%,#eef2e2_55%,#e4ecf6_100%)] p-5 shadow-[0_18px_44px_rgba(70,68,57,0.07)] sm:p-7">
        <div className="dot-grid absolute inset-0 opacity-[0.06]" />
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-[#bdd8f8]/45" />
        <div className="absolute -bottom-24 right-40 h-52 w-52 rounded-full bg-[#f2b8cf]/40" />
        <div className="relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="rounded-full border border-black/10 bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-black/60">
                {WORKFLOW_TYPE_LABELS[project.brief.workflowType]} / Espace de travail
              </span>
              <h1 className="display-serif mt-5 max-w-4xl text-5xl leading-[0.95] sm:text-7xl">{project.name}</h1>
              <p className="mt-3 text-sm font-semibold text-black/48">Propulsé par le cerveau de marque {DEFAULT_BRAND_PROFILE.name}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={lastReview?.status || "Not reviewed"} />
              <Link href={`/projects/${project.id}/library`} className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/75 px-4 py-2.5 text-xs font-black text-black backdrop-blur hover:bg-black hover:text-white">
                <CommandIcon name="library" className="h-4 w-4" /> Bibliothèque des livrables
              </Link>
            </div>
          </div>

          <div className="mt-9 max-w-2xl">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.13em] text-black/42">
              <span>Avancement du workflow</span><span>{completedCount}/{STEP_ORDER.length} moteurs · {progress}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full border border-black/10 bg-black/5">
              <div className="h-full rounded-full bg-[#98b85f] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="command-card p-5 sm:p-6 xl:col-span-8">
          <div className="flex items-center justify-between gap-3">
            <div><span className="command-label">Brief du projet</span><h2 className="display-serif mt-2 text-4xl">Le contexte qui évolue</h2></div>
            <Link href="/brand-profile" className="command-pill hidden sm:inline-flex"><CommandIcon name="brain" className="h-3.5 w-3.5" /> Voir l’ADN hérité</Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] bg-[#bdd8f8]/42 p-4 sm:col-span-2"><p className="command-label">Objectif</p><p className="mt-2 text-base font-black leading-snug">{project.brief.projectGoal || "Pas encore défini"}</p></div>
            <div className="rounded-[22px] border border-black/10 bg-white/60 p-4"><p className="command-label">Livrable</p><p className="mt-2 text-sm font-bold leading-relaxed text-black/65">{project.brief.deliverableType || "—"}</p></div>
            <div className="rounded-[22px] border border-black/10 bg-white/60 p-4"><p className="command-label">Canaux</p><p className="mt-2 text-sm font-bold leading-relaxed text-black/65">{project.brief.channels || "—"}</p></div>
            <div className="rounded-[22px] border border-black/10 bg-white/60 p-4 sm:col-span-2"><p className="command-label">Contexte spécifique</p><p className="mt-2 text-sm font-medium leading-relaxed text-black/62">{project.brief.specificContext || "—"}</p></div>
            <div className="rounded-[22px] bg-[#c3d995]/45 p-4 sm:col-span-2"><p className="command-label">Définition de la réussite</p><p className="mt-2 text-sm font-black leading-relaxed">{project.brief.successCriteria || "—"}</p></div>
          </div>
        </div>

        <aside className="command-card relative overflow-hidden p-5 sm:p-6 xl:col-span-4">
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[26px] border-[#f5df75]/60" />
          <div className="relative">
            <span className="command-label">Prochaine meilleure action</span>
            <h2 className="display-serif mt-3 text-4xl leading-tight">Garde la chaîne en mouvement.</h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-black/48">
              {completedCount === 0 ? "Commence par la stratégie pour que chaque décision visuelle et éditoriale ait une raison." : completedCount < STEP_ORDER.length ? "Lance le prochain moteur incomplet, puis fais une relecture avant d’exporter." : "Le système est complet. Relis les derniers livrables et exporte la version validée."}
            </p>
            <Link
              href={`/projects/${project.id}/run?step=${STEP_ORDER.find((step) => !completed[step]) || "review"}`}
              className="command-button mt-6 w-full"
            >
              <CommandIcon name="sparkles" className="h-4 w-4" /> Lancer le prochain moteur
            </Link>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-[17px] bg-[#bdd8f8] p-3"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-black/45">Livrables</p><p className="display-serif mt-1 text-3xl">{Object.keys(project.outputs).length}</p></div>
              <div className="rounded-[17px] bg-[#f2b8cf] p-3"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-black/45">Relectures</p><p className="display-serif mt-1 text-3xl">{project.reviews.length}</p></div>
              <div className="rounded-[17px] bg-[#f5df75] p-3"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-black/45">Exports</p><p className="display-serif mt-1 text-3xl">{project.exports.length}</p></div>
            </div>
          </div>
        </aside>
      </section>

      <section>
        <div className="mb-4">
          <span className="command-label">Moteurs ORBIT</span>
          <h2 className="display-serif mt-2 text-4xl sm:text-5xl">Construis le projet, étape par étape.</h2>
        </div>
        <WorkflowSelector projectId={project.id} completed={completed} />
      </section>

      <section className="command-card p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><span className="command-label">Mémoire générée</span><h2 className="display-serif mt-2 text-4xl">Livrables</h2></div>
          <p className="max-w-sm text-xs font-semibold leading-relaxed text-black/42">Modifie, valide et exporte. Rien n’est considéré comme final uniquement parce qu’une IA l’a généré.</p>
        </div>

        <div className="mt-6 space-y-5">
          {STEP_ORDER.filter((step) => step !== "review").map((step, index) => (
            <div key={step} className="rounded-[26px] border border-black/10 bg-white/50 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-[13px] bg-black text-xs font-black text-white">0{index + 1}</span>
                  <div><p className="text-sm font-black">{STEP_LABELS[step]}</p><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/35">{project.outputs[step] ? "Enregistré dans la mémoire du projet" : "En attente d’un livrable"}</p></div>
                </div>
                {project.outputs[step] && (
                  <ExportButton
                    filename={`${project.id}_${step}`}
                    content={project.outputs[step]!.content}
                    disabled={project.reviews.find((review) => review.target === step)?.status === "Blocked"}
                    onExported={() => update({ exports: [...project.exports, { target: step, format: "markdown", created_at: new Date().toISOString() }] })}
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
        </div>
      </section>

      <section className="command-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div><span className="command-label">Contrôle qualité</span><h2 className="display-serif mt-2 text-4xl">Relectures Orbit Critic</h2></div>
          <Link href={`/projects/${project.id}/run?step=review`} className="command-button command-button-soft"><CommandIcon name="critic" className="h-4 w-4" /> Nouvelle relecture</Link>
        </div>
        {project.reviews.length > 0 ? (
          <div className="mt-5 space-y-3">
            {project.reviews.map((review, index) => <ReviewScoreCard key={`${review.created_at}-${index}`} review={review} />)}
          </div>
        ) : (
          <div className="mt-5 flex min-h-[190px] flex-col items-center justify-center rounded-[24px] border border-dashed border-black/18 bg-[#c3d995]/20 px-6 text-center">
            <CommandIcon name="critic" className="h-7 w-7" />
            <p className="display-serif mt-3 text-3xl">Aucune relecture pour le moment.</p>
            <p className="mt-1 text-xs font-semibold text-black/42">Lance Orbit Critic avant de considérer un livrable comme terminé.</p>
          </div>
        )}
      </section>

      <section className="command-card border-red-200/70 bg-red-50/40 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="command-label text-red-800/70">Zone de danger</span>
            <h2 className="mt-2 text-lg font-black text-red-900">Supprimer ce projet</h2>
            <p className="mt-1 max-w-xl text-xs font-semibold leading-relaxed text-red-900/60">
              Action irréversible : supprime le projet ainsi que toutes les tâches et contenus du Studio Brain qui lui sont liés.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 self-start rounded-full border border-red-300 bg-white px-4 py-2.5 text-xs font-black text-red-700 hover:bg-red-600 hover:text-white sm:self-auto"
          >
            <CommandIcon name="trash" className="h-4 w-4" /> Supprimer le projet
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title={project ? `Supprimer "${project.name}" ?` : "Supprimer le projet ?"}
        description="Cette action est irréversible. Le projet, ses livrables, relectures et exports, ainsi que toutes les tâches et contenus du Studio Brain liés exclusivement à ce projet seront définitivement supprimés."
        confirmLabel="Supprimer définitivement"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
