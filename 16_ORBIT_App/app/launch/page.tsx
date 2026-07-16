"use client";

import Link from "next/link";
import { useMemo } from "react";
import CommandIcon from "@/components/CommandIcon";
import StudioItemCard from "@/components/StudioItemCard";
import { useStudioBrain } from "@/contexts/StudioBrainContext";
import { scoreAll } from "@/lib/priority";
import { ItemStatus, StudioItem } from "@/lib/types";

function bySortOrder(items: StudioItem[]): StudioItem[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export default function LaunchPage() {
  const { items, decisions, loaded, error, updateItem, archiveItem, resolveDecision } = useStudioBrain();

  const launchItems = items.filter((it) => it.launchCritical && it.status !== "archived");
  const tasks = bySortOrder(launchItems.filter((it) => it.kind === "task" && it.status !== "done"));
  const contents = bySortOrder(launchItems.filter((it) => it.kind === "content" && it.status !== "done"));
  const doneCount = launchItems.filter((it) => it.status === "done").length;
  const progress = launchItems.length ? Math.round((doneCount / launchItems.length) * 100) : 0;
  const nextTask = tasks.find((it) => it.status !== "blocked") || tasks[0];
  const pendingDecisions = decisions.filter((d) => d.status === "pending");

  const scores = useMemo(() => scoreAll(items), [items]);

  function dependencyTitles(item: StudioItem): string[] {
    return item.dependsOn.map((depId) => items.find((it) => it.id === depId)?.title).filter((t): t is string => Boolean(t));
  }

  async function handleStatusChange(id: string, status: ItemStatus) {
    await updateItem(id, { status }).catch(() => {});
  }

  async function handleArchive(id: string) {
    await archiveItem(id).catch(() => {});
  }

  /** Manual up/down reordering within the active (non-done) subset of a kind, persisted via the `order` field on StudioItem. */
  async function move(kind: "task" | "content", id: string, direction: -1 | 1) {
    const ordered = kind === "task" ? tasks : contents;
    const index = ordered.findIndex((it) => it.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const a = ordered[index];
    const b = ordered[target];
    await Promise.all([updateItem(a.id, { order: b.order }), updateItem(b.id, { order: a.order })]);
  }

  return (
    <div className="space-y-4 pb-36 lg:pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="command-label">
            <CommandIcon name="launch" className="h-3.5 w-3.5" /> Opération lancement
          </span>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Lancement 24March Studio</h1>
          <p className="mt-1 text-sm text-black/48">Éléments critiques pour le lancement, synchronisés avec Studio Brain.</p>
        </div>
        <Link href="/projects/new" className="command-button">
          <CommandIcon name="plus" className="h-4 w-4" /> Ajouter un projet
        </Link>
      </header>
      {error && <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[24px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8,#edf2e5)] p-5">
          <p className="command-label">Progression du lancement</p>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-6xl font-black sm:text-8xl">{progress}</span>
            <span className="mb-2 text-sm font-black uppercase leading-tight">
              pour cent
              <br />
              terminé
            </span>
          </div>
          <p className="mt-2 text-sm font-black uppercase text-[#7d9f4c]">Tout doit être prêt avant le 1er septembre</p>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-black/7">
            <div className="h-full rounded-full bg-[#98b85f]" style={{ width: `${progress}%` }} />
          </div>
        </article>
        <article className="command-card p-5">
          <p className="command-label">Prochaine meilleure action</p>
          <h2 className="mt-2 text-2xl font-black">{nextTask?.title || "Tout est terminé"}</h2>
          <p className="mt-2 text-sm text-black/48">{nextTask?.description || "Aucune tâche critique ouverte."}</p>
          <a href="#tasks" className="mt-4 block rounded-[18px] bg-[#f5df75]/70 p-4 text-sm font-black">
            Voir la file active
          </a>
        </article>
      </section>

      <section id="tasks" className="command-card scroll-mt-24 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="command-label">File active</p>
            <h2 className="mt-1 text-xl font-black">Tâches critiques pour le lancement</h2>
          </div>
          <span className="command-pill bg-[#f9d9e6]">{tasks.length} ouvertes</span>
        </div>
        <p className="mt-2 text-xs text-black/45">Réordonne avec les flèches — l&apos;ordre est conservé (champ `order`).</p>
        <div className="mt-4 space-y-3">
          {loaded &&
            tasks.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className="flex shrink-0 flex-col gap-1 pt-4">
                  <button
                    type="button"
                    onClick={() => void move("task", item.id, -1)}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white text-xs font-black disabled:opacity-30"
                    aria-label="Monter"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => void move("task", item.id, 1)}
                    disabled={index === tasks.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white text-xs font-black disabled:opacity-30"
                    aria-label="Descendre"
                  >
                    ↓
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <StudioItemCard
                    item={item}
                    priority={scores.get(item.id)!}
                    dependencyTitles={dependencyTitles(item)}
                    onStatusChange={handleStatusChange}
                    onArchive={handleArchive}
                  />
                </div>
              </div>
            ))}
          {loaded && !tasks.length && (
            <div className="flex min-h-[70px] items-center justify-center rounded-[16px] border border-dashed border-black/15 text-xs font-semibold text-black/40">
              Aucune tâche critique ouverte.
            </div>
          )}
        </div>
      </section>

      <section id="content" className="command-card scroll-mt-24 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="command-label">File éditoriale critique</p>
            <h2 className="mt-1 text-xl font-black">Contenus de lancement</h2>
          </div>
          <span className="command-pill bg-[#dcecff]">{contents.length} ouverts</span>
        </div>
        <div className="mt-4 space-y-3">
          {loaded &&
            contents.map((item, index) => (
              <div key={item.id} className="flex items-start gap-2">
                <div className="flex shrink-0 flex-col gap-1 pt-4">
                  <button
                    type="button"
                    onClick={() => void move("content", item.id, -1)}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white text-xs font-black disabled:opacity-30"
                    aria-label="Monter"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => void move("content", item.id, 1)}
                    disabled={index === contents.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white text-xs font-black disabled:opacity-30"
                    aria-label="Descendre"
                  >
                    ↓
                  </button>
                </div>
                <div className="min-w-0 flex-1">
                  <StudioItemCard
                    item={item}
                    priority={scores.get(item.id)!}
                    dependencyTitles={dependencyTitles(item)}
                    onStatusChange={handleStatusChange}
                    onArchive={handleArchive}
                  />
                </div>
              </div>
            ))}
          {loaded && !contents.length && (
            <div className="flex min-h-[70px] items-center justify-center rounded-[16px] border border-dashed border-black/15 text-xs font-semibold text-black/40">
              Aucun contenu critique ouvert — retrouve le reste sur{" "}
              <Link href="/studio/content" className="underline">
                la banque de contenu
              </Link>
              .
            </div>
          )}
        </div>
      </section>

      <section id="decisions" className="command-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="command-label">Studio Brain</p>
            <h2 className="mt-1 text-xl font-black">Décisions détectées</h2>
          </div>
          <span className="command-pill bg-[#e9e1fb]">{pendingDecisions.length}</span>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {pendingDecisions.map((decision) => (
            <article key={decision.id} className="rounded-[18px] bg-[#fff8e5] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black">{decision.question}</p>
                {decision.source && <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase text-black/40">{decision.source}</span>}
              </div>
              {decision.context && <p className="mt-1 text-xs text-black/48">{decision.context}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {decision.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => void resolveDecision(decision.id, option).catch(() => {})}
                    className="rounded-full bg-black px-3 py-2 text-[10px] font-black text-white"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </article>
          ))}
          {!pendingDecisions.length && <p className="text-sm text-black/45">Aucune décision en attente.</p>}
        </div>
      </section>

      <section id="roadmap" className="command-card p-5">
        <p className="command-label">Roadmap</p>
        <h2 className="mt-1 text-xl font-black">Vue chronologique complète</h2>
        <p className="mt-2 text-sm text-black/48">
          La timeline détaillée, semaine par semaine, avec la règle stricte du 31 août, est sur{" "}
          <Link href="/timeline" className="font-black underline">
            /timeline
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
