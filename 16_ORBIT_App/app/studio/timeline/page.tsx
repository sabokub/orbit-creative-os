"use client";

import { useMemo } from "react";
import { STUDIO_LAUNCH_CUTOFF, StudioItem } from "@/lib/types";
import { scoreAll } from "@/lib/priority";
import CommandIcon from "@/components/CommandIcon";
import PriorityBadge from "@/components/PriorityBadge";
import PanelTitle from "@/components/PanelTitle";
import { useStudioBrain } from "@/contexts/StudioBrainContext";

interface WeekBucket {
  start: Date;
  end: Date;
  label: string;
}

function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildWeeks(from: Date, cutoff: Date): WeekBucket[] {
  const weeks: WeekBucket[] = [];
  let cursor = startOfWeek(from);
  const lastWeekStart = startOfWeek(cutoff);
  while (cursor.getTime() <= lastWeekStart.getTime()) {
    const end = new Date(cursor);
    end.setDate(end.getDate() + 6);
    weeks.push({
      start: new Date(cursor),
      end,
      label: `${cursor.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`,
    });
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

/** Hard rule: nothing may be scheduled after the studio launch cutoff. */
function findInvalidItems(items: StudioItem[]): StudioItem[] {
  return items.filter((it) => it.dueDate && it.dueDate > STUDIO_LAUNCH_CUTOFF);
}

const KIND_TINT: Record<StudioItem["kind"], string> = {
  task: "border-black/10 bg-white",
  content: "border-[#cfc5f4]/50 bg-[#f5f2fd]",
};

const STATUS_LABELS: Record<StudioItem["status"], string> = {
  backlog: "À faire",
  today: "Aujourd'hui",
  in_progress: "En cours",
  blocked: "Bloqué",
  done: "Terminé",
  archived: "Archivé",
};

export default function TimelinePage() {
  const { items, loaded, error } = useStudioBrain();

  const scores = useMemo(() => scoreAll(items), [items]);
  const active = items.filter((it) => it.status !== "archived");
  const invalid = findInvalidItems(active);
  const cutoffDate = new Date(`${STUDIO_LAUNCH_CUTOFF}T23:59:59`);
  const weeks = useMemo(() => buildWeeks(new Date(), cutoffDate), []); // eslint-disable-line react-hooks/exhaustive-deps

  const undated = active.filter((it) => !it.dueDate);

  function itemsForWeek(week: WeekBucket): StudioItem[] {
    return active
      .filter((it) => {
        if (!it.dueDate) return false;
        const due = new Date(`${it.dueDate}T12:00:00`);
        return due >= week.start && due <= week.end;
      })
      .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-4 pb-8">
      <header>
        <h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">Timeline studio</h1>
        <p className="mt-1 text-sm font-medium text-black/52">
          Tâches et contenus, semaine par semaine, jusqu&apos;au 31 août 2026 — rien après cette date.
        </p>
      </header>

      {error && <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}
      {invalid.length > 0 && (
        <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
          {invalid.length} élément(s) ont une échéance après le {STUDIO_LAUNCH_CUTOFF} — à corriger : {invalid.map((it) => it.title).join(", ")}
        </div>
      )}

      <section className="command-card overflow-hidden p-5 sm:p-6">
        <PanelTitle title={`${weeks.length} semaines jusqu'au lancement`} />
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {!loaded && [1, 2, 3, 4].map((i) => <div key={i} className="h-64 min-w-[220px] animate-pulse rounded-[18px] bg-black/5" />)}
          {loaded &&
            weeks.map((week) => {
              const weekItems = itemsForWeek(week);
              return (
                <div key={week.label} className="min-w-[230px] max-w-[230px] rounded-[18px] border border-black/8 bg-[#f8faf4] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.08em] text-black/50">{week.label}</p>
                  <div className="mt-2.5 space-y-2">
                    {weekItems.map((item) => (
                      <div key={item.id} className={`rounded-[14px] border p-2.5 ${KIND_TINT[item.kind]}`}>
                        <div className="flex items-start justify-between gap-1.5">
                          <p className="text-[10.5px] font-black leading-tight">{item.title}</p>
                          <CommandIcon name={item.kind === "task" ? "strategy" : "content"} className="h-3.5 w-3.5 shrink-0 text-black/35" />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between gap-1.5">
                          <span className="text-[8.5px] font-bold uppercase tracking-[0.06em] text-black/35">{STATUS_LABELS[item.status]}</span>
                          <PriorityBadge result={scores.get(item.id)!} />
                        </div>
                      </div>
                    ))}
                    {!weekItems.length && <p className="text-[10px] font-semibold text-black/30">Rien de planifié</p>}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {loaded && undated.length > 0 && (
        <section className="rounded-[28px] border border-black/10 bg-[#fff8e5] p-5 shadow-[0_14px_34px_rgba(70,68,57,0.05)] sm:p-6">
          <PanelTitle title={`Sans échéance · ${undated.length}`} />
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {undated.map((item) => (
              <div key={item.id} className="flex items-center gap-2 rounded-[14px] border border-black/8 bg-white/70 p-2.5">
                <p className="min-w-0 flex-1 truncate text-[11px] font-black">{item.title}</p>
                <PriorityBadge result={scores.get(item.id)!} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
