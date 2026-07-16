"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/types";
import { deleteProject, listProjects } from "@/lib/storage";
import ProjectCard from "@/components/ProjectCard";
import CommandIcon from "@/components/CommandIcon";
import ConfirmDialog from "@/components/ConfirmDialog";
import { ToastMessage, ToastStack, takePendingToast } from "@/components/Toast";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((kind: ToastMessage["kind"], text: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, kind, text }]);
  }, []);
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    listProjects().then(setProjects).catch((err) => setError((err as Error).message)).finally(() => setLoading(false));
    // Pick up a toast requested by another page just before it redirected here
    // (e.g. deleting a project from its own workspace page).
    const pending = takePendingToast();
    if (pending) pushToast(pending.kind, pending.text);
  }, [pushToast]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await deleteProject(deleteTarget.id);
      // Pessimistic UI: only remove the project from the list once the API
      // has confirmed the deletion succeeded.
      setProjects((prev) => prev.filter((project) => project.id !== deleteTarget.id));
      pushToast("success", `"${deleteTarget.name}" a été supprimé, avec toutes ses données Studio Brain associées.`);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError((err as Error).message || "La suppression a échoué. Réessaie.");
    } finally {
      setDeleteBusy(false);
    }
  }

  function cancelDelete() {
    if (deleteBusy) return;
    setDeleteTarget(null);
    setDeleteError("");
  }

  const filtered = useMemo(() => projects.filter((project) => project.name.toLowerCase().includes(query.toLowerCase())), [projects, query]);
  const outputs = projects.reduce((sum, project) => sum + Object.keys(project.outputs).length, 0);
  const reviews = projects.reduce((sum, project) => sum + project.reviews.length, 0);

  return (
    <div className="space-y-4 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><span className="command-label"><CommandIcon name="projects" className="h-3.5 w-3.5" /> Vue d’ensemble</span><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Tous les projets</h1><p className="mt-1 text-sm font-medium text-black/48">Retrouve chaque brief, livrable et prochaine action.</p></div>
        <Link href="/projects/new" className="command-button self-start"><CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet</Link>
      </header>

      <section className="grid grid-cols-3 gap-2 sm:gap-3">
        {[['Projets', projects.length, 'bg-[#eef7ff]'], ['Livrables', outputs, 'bg-[#f2f7e8]'], ['Relectures', reviews, 'bg-[#f5effd]']].map(([label, value, color]) => <article key={String(label)} className={`min-w-0 rounded-[20px] border border-black/10 p-3 sm:p-4 ${color}`}><p className="truncate text-[9px] font-black uppercase tracking-[0.1em] text-black/48">{label}</p><p className="mt-2 text-3xl font-black tracking-[-0.05em]">{value}</p></article>)}
      </section>

      <section className="command-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="command-label">Bibliothèque de projets</p><h2 className="mt-1 text-xl font-black">{filtered.length} projet{filtered.length > 1 ? 's' : ''}</h2></div>
          <label className="flex min-w-0 items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-2 sm:w-72"><CommandIcon name="focus" className="h-4 w-4 shrink-0 text-black/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un projet" className="!min-h-0 !border-0 !bg-transparent !p-0 !shadow-none !outline-none" /></label>
        </div>
        {error && <p className="mt-4 rounded-[16px] border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>}
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {loading && [0,1,2].map((item) => <div key={item} className="h-44 animate-pulse rounded-[22px] bg-black/5" />)}
          {!loading && filtered.map((project) => <ProjectCard key={project.id} project={project} onRequestDelete={setDeleteTarget} />)}
        </div>
        {!loading && !error && filtered.length === 0 && <div className="mt-4 rounded-[20px] border border-dashed border-black/15 p-8 text-center"><p className="text-lg font-black">Aucun projet trouvé.</p><p className="mt-1 text-sm text-black/45">Crée un projet ou modifie ta recherche.</p></div>}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget ? `Supprimer "${deleteTarget.name}" ?` : "Supprimer le projet ?"}
        description="Cette action est irréversible. Le projet, ses livrables, relectures et exports, ainsi que toutes les tâches et contenus du Studio Brain liés exclusivement à ce projet seront définitivement supprimés."
        confirmLabel="Supprimer définitivement"
        busy={deleteBusy}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
