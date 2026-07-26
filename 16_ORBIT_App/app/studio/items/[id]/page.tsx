"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import CommandIcon from "@/components/CommandIcon";
import StudioItemCard from "@/components/StudioItemCard";
import { useStudioBrain } from "@/contexts/StudioBrainContext";
import { formatShortDate } from "@/lib/format";
import { scoreAll } from "@/lib/priority";
import { ItemStatus } from "@/lib/types";

export default function StudioItemDetailPage() {
  const params = useParams<{ id: string }>();
  const { items, loaded, error, updateItem, archiveItem } = useStudioBrain();
  const item = items.find((candidate) => candidate.id === params.id);
  const scores = useMemo(() => scoreAll(items), [items]);

  const dependencyTitles = item
    ? item.dependsOn
        .map((dependencyId) => items.find((candidate) => candidate.id === dependencyId)?.title)
        .filter((title): title is string => Boolean(title))
    : [];

  const dependentTitles = item
    ? items.filter((candidate) => candidate.dependsOn.includes(item.id)).map((candidate) => candidate.title)
    : [];

  async function handleStatusChange(id: string, status: ItemStatus) {
    await updateItem(id, { status }).catch(() => {});
  }

  async function handleArchive(id: string) {
    await archiveItem(id).catch(() => {});
  }

  if (!loaded) {
    return <div className="command-card p-5 text-sm font-bold text-black/45">Chargement de la tâche…</div>;
  }

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 pb-36 lg:pb-8">
        <Link href="/" className="command-pill bg-white">
          ← Retour
        </Link>
        <div className="command-card p-6">
          <p className="command-label">Studio Brain</p>
          <h1 className="mt-2 text-2xl font-black">Tâche introuvable</h1>
          <p className="mt-2 text-sm text-black/48">Elle a peut-être été supprimée ou son lien est ancien.</p>
        </div>
      </div>
    );
  }

  const priority = scores.get(item.id);

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-36 lg:pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="command-pill bg-white">
            ← Retour
          </Link>
          <p className="command-label mt-4">
            <CommandIcon name={item.kind === "task" ? "launch" : "content"} className="h-3.5 w-3.5" />
            {item.kind === "task" ? "Tâche" : "Contenu"}
          </p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">{item.title}</h1>
        </div>
        {item.projectId && (
          <Link href={`/projects/${item.projectId}`} className="command-button">
            Ouvrir le projet →
          </Link>
        )}
      </header>

      {error && <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {priority && (
            <StudioItemCard
              item={item}
              priority={priority}
              dependencyTitles={dependencyTitles}
              onStatusChange={handleStatusChange}
              onArchive={item.status === "archived" ? undefined : handleArchive}
              readOnly={item.status === "archived"}
            />
          )}
        </div>

        <aside className="command-card p-5">
          <p className="command-label">Contexte complet</p>
          <div className="mt-4 space-y-4 text-sm">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-black/35">Catégorie</p>
              <p className="mt-1 font-black">{item.channel || item.category}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-black/35">Échéance</p>
              <p className="mt-1 font-black">{formatShortDate(item.dueDate)}</p>
            </div>
            {item.notes && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-black/35">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-black/60">{item.notes}</p>
              </div>
            )}
            {dependentTitles.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.08em] text-black/35">Débloque ensuite</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {dependentTitles.map((title) => (
                    <span key={title} className="rounded-full border border-black/8 bg-white px-2 py-1 text-[10px] font-bold text-black/55">
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
