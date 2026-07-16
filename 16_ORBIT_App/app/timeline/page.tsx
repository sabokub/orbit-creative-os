"use client";

import { useMemo } from "react";
import { useStudioBrain } from "@/contexts/StudioBrainContext";
import { STUDIO_LAUNCH_CUTOFF } from "@/lib/types";

const STATUS_LABEL: Record<string, string> = {
  backlog: "À faire",
  today: "Aujourd'hui",
  in_progress: "En cours",
  blocked: "Bloqué",
  done: "Terminé",
  archived: "Archivé",
};

export default function TimelinePage() {
  const { items, loaded, error } = useStudioBrain();
  const active = items.filter((it) => it.status !== "archived");

  // Surface any dueDate that violates the studio's one hard rule instead of
  // silently clamping it — Studio Brain's own validateDueDate() already
  // rejects this on write, so any violation seen here can only come from
  // data written before that guard existed (e.g. a migrated legacy record).
  const invalid = active.filter((it) => it.dueDate && it.dueDate > STUDIO_LAUNCH_CUTOFF);

  const events = useMemo(() => {
    const safeDate = (date?: string) => (date && date <= STUDIO_LAUNCH_CUTOFF ? date : STUDIO_LAUNCH_CUTOFF);
    return active
      .map((item) => ({
        id: item.id,
        date: safeDate(item.dueDate),
        title: item.title,
        meta: `${item.kind === "task" ? "Tâche" : "Contenu"} · ${STATUS_LABEL[item.status]}`,
        hasDate: Boolean(item.dueDate),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [active]);

  const dated = events.filter((e) => e.hasDate);
  const undated = events.filter((e) => !e.hasDate);

  const groups = useMemo(
    () =>
      dated.reduce<Record<string, typeof dated>>((acc, event) => {
        const month = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(`${event.date}T12:00:00`));
        (acc[month] ||= []).push(event);
        return acc;
      }, {}),
    [dated]
  );

  return (
    <div className="space-y-4 pb-36 lg:pb-8">
      <header>
        <p className="command-label">Roadmap avant lancement</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Timeline du studio</h1>
        <p className="mt-1 text-sm text-black/48">
          Tout le travail opérationnel se termine au plus tard le 31 août. Le 1er septembre reste réservé au lancement.
        </p>
      </header>

      {error && <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}

      {invalid.length > 0 && (
        <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">
          {invalid.length} élément(s) ont une échéance après le {STUDIO_LAUNCH_CUTOFF} — à corriger : {invalid.map((it) => it.title).join(", ")}.
        </div>
      )}

      <section className="command-card p-5">
        <div className="relative ml-3 border-l-2 border-black/10 pl-6">
          {loaded &&
            Object.entries(groups).map(([month, monthItems]) => (
              <div key={month} className="mb-8 last:mb-0">
                <div className="-ml-[35px] flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full border-4 border-[#f6f3ec] bg-[#9dbd61]" />
                  <h2 className="text-lg font-black capitalize">{month}</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {monthItems.map((event) => (
                    <div key={event.id} className="rounded-[18px] border border-black/8 bg-white/75 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black">{event.title}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-black/40">{event.meta}</p>
                        </div>
                        <span className="rounded-full bg-[#eef7ff] px-2.5 py-1 text-[9px] font-black">
                          {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(`${event.date}T12:00:00`))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
        {loaded && undated.length > 0 && (
          <div className="mt-6 border-t border-black/8 pt-4">
            <p className="command-label">Sans échéance · {undated.length}</p>
            <div className="mt-3 space-y-2">
              {undated.map((event) => (
                <div key={event.id} className="rounded-[14px] border border-black/8 bg-white/60 p-3">
                  <p className="text-sm font-black">{event.title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-black/40">{event.meta}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
