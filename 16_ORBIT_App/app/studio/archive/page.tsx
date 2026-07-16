"use client";

import { useMemo, useState } from "react";
import { scoreAll } from "@/lib/priority";
import { formatShortDate } from "@/lib/format";
import PanelTitle from "@/components/PanelTitle";
import CommandIcon from "@/components/CommandIcon";
import PriorityBadge from "@/components/PriorityBadge";
import { useStudioBrain } from "@/contexts/StudioBrainContext";

type Tab = "done" | "archived";

export default function ArchivePage() {
  const { items, loaded, error } = useStudioBrain();
  const [tab, setTab] = useState<Tab>("done");

  const scores = useMemo(() => scoreAll(items), [items]);
  const done = [...items.filter((it) => it.status === "done")].sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || ""));
  const archived = [...items.filter((it) => it.status === "archived")].sort((a, b) => (b.archivedAt || "").localeCompare(a.archivedAt || ""));
  const list = tab === "done" ? done : archived;

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 pb-8">
      <header>
        <h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">Archive &amp; historique</h1>
        <p className="mt-1 text-sm font-medium text-black/52">
          Rien n&apos;est jamais supprimé — tâches et contenus terminés ou archivés restent consultables ici.
        </p>
      </header>

      {error && <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}

      <section className="command-card p-5 sm:p-6">
        <PanelTitle title="Historique" />
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setTab("done")}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${
              tab === "done" ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/55"
            }`}
          >
            Terminé · {done.length}
          </button>
          <button
            type="button"
            onClick={() => setTab("archived")}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${
              tab === "archived" ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/55"
            }`}
          >
            Archivé · {archived.length}
          </button>
        </div>

        <div className="mt-4 divide-y divide-black/6">
          {!loaded && [1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse rounded-[16px] bg-black/5" />)}
          {loaded &&
            list.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#edf2e5]">
                  <CommandIcon name={item.kind === "task" ? "strategy" : "content"} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-black">{item.title}</p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-black/40">
                    {item.kind === "task" ? item.category : item.channel} ·{" "}
                    {tab === "done" ? `terminé le ${formatShortDate(item.doneAt?.slice(0, 10))}` : `archivé le ${formatShortDate(item.archivedAt?.slice(0, 10))}`}
                  </p>
                </div>
                <PriorityBadge result={scores.get(item.id)!} />
              </div>
            ))}
          {loaded && !list.length && (
            <div className="flex min-h-[100px] items-center justify-center text-xs font-semibold text-black/40">
              Rien ici pour le moment.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
