"use client";

import { ItemStatus, PriorityResult, StudioItem } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import PriorityBadge from "./PriorityBadge";
import CommandIcon from "./CommandIcon";

const STATUS_LABELS: Record<ItemStatus, string> = {
  backlog: "À faire",
  today: "Aujourd'hui",
  in_progress: "En cours",
  blocked: "Bloqué",
  done: "Terminé",
  archived: "Archivé",
};

const STATUS_ORDER: ItemStatus[] = ["backlog", "today", "in_progress", "blocked", "done", "archived"];

export default function StudioItemCard({
  item,
  priority,
  dependencyTitles,
  onStatusChange,
  onArchive,
  readOnly,
}: {
  item: StudioItem;
  priority: PriorityResult;
  dependencyTitles: string[];
  onStatusChange?: (id: string, status: ItemStatus) => void;
  onArchive?: (id: string) => void;
  readOnly?: boolean;
}) {
  return (
    <article className="rounded-[20px] border border-black/8 bg-[#fffdf8] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full border border-black/8 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-black/50">
              {item.channel || item.category}
            </span>
            {item.launchCritical && (
              <span className="rounded-full border border-[#d87979]/30 bg-[#ffdada]/70 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-[#7b2525]">
                Lancement
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] font-black leading-tight">{item.title}</p>
          {item.description && <p className="mt-1 text-[11px] font-medium leading-snug text-black/50">{item.description}</p>}
        </div>
        <PriorityBadge result={priority} />
      </div>

      {dependencyTitles.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[9px] font-bold text-black/40">
          <CommandIcon name="link" className="h-3 w-3" />
          {dependencyTitles.map((title) => (
            <span key={title} className="rounded-full border border-black/8 bg-white px-2 py-0.5">
              {title}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/6 pt-3">
        <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.08em] text-black/40">
          <CommandIcon name="clock" className="h-3.5 w-3.5" />
          {formatShortDate(item.dueDate)} · {item.estimateMinutes} min
        </div>
        {readOnly ? (
          <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-black/50">
            {STATUS_LABELS[item.status]}
          </span>
        ) : (
          <div className="flex items-center gap-1.5">
            <select
              value={item.status}
              onChange={(event) => onStatusChange?.(item.id, event.target.value as ItemStatus)}
              className="!min-h-0 !w-auto rounded-full !border-black/10 !bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em]"
            >
              {STATUS_ORDER.filter((s) => s !== "archived").map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            {item.status !== "archived" && onArchive && (
              <button
                type="button"
                onClick={() => onArchive(item.id)}
                title="Archiver (conservé dans l'historique)"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white text-black/40 hover:text-black"
              >
                <CommandIcon name="library" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
