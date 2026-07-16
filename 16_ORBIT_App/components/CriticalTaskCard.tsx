"use client";

import { useState } from "react";
import Link from "next/link";
import { PriorityResult, StudioItem } from "@/lib/types";
import { formatShortDate } from "@/lib/format";
import { tierStyleForPriority } from "@/lib/importanceColor";
import ImportanceMark from "./ImportanceMark";
import CommandIcon from "./CommandIcon";

const STATUS_LABELS: Record<StudioItem["status"], string> = {
  backlog: "À faire",
  today: "Aujourd'hui",
  in_progress: "En cours",
  blocked: "Bloqué",
  done: "Terminé",
  archived: "Archivé",
};

function nextAction(item: StudioItem, blockedByTitle: string | null): string {
  if (item.status === "blocked") return blockedByTitle ? `Débloquer : ${blockedByTitle}` : "Débloquer une dépendance";
  if (item.status === "in_progress") return "Continuer maintenant";
  if (item.dueDate) return `Terminer avant ${formatShortDate(item.dueDate)}`;
  return "Démarrer aujourd'hui";
}

/**
 * Compact, scannable critical-task card for the homepage. Collapsed by
 * default (title + why it's critical + CTA); expands in place for the rest
 * of the context (deadline, what it unblocks, effort, status, next action)
 * rather than dumping everything at once.
 */
export default function CriticalTaskCard({
  item,
  priority,
  dependentTitles,
  blockedByTitle,
}: {
  item: StudioItem;
  priority: PriorityResult;
  dependentTitles: string[];
  blockedByTitle: string | null;
}) {
  const [open, setOpen] = useState(false);
  const tier = tierStyleForPriority(priority);
  const href = item.kind === "task" ? "/launch#tasks" : "/launch#content";

  return (
    <article className={`rounded-[20px] border border-black/8 ${tier.cardBorder} ${tier.cardTint} bg-[#fffdf8] p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${tier.badge}`}>
              <ImportanceMark shape={tier.mark} color={tier.markColor} />
              {tier.tag}
            </span>
            <span className="rounded-full border border-black/8 bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] text-black/50">
              {STATUS_LABELS[item.status]}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] font-black leading-tight">{item.title}</p>
          <p className="mt-1 text-[11px] font-semibold leading-snug text-black/55">{priority.explanation}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Masquer les détails" : "Voir les détails"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-black/50"
        >
          <CommandIcon name={open ? "close" : "plus"} className="h-3.5 w-3.5" />
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-black/6 pt-3 text-[11px] font-semibold text-black/55">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <CommandIcon name="clock" className="h-3.5 w-3.5" />
              {formatShortDate(item.dueDate)} · {item.estimateMinutes} min
            </span>
            <span>Urgence {item.urgency}/5 · Impact {item.impact}/5</span>
          </div>
          {dependentTitles.length > 0 && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-black/40">Débloque</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {dependentTitles.map((title) => (
                  <span key={title} className="rounded-full border border-black/8 bg-white px-2 py-0.5 text-[10px] font-bold text-black/55">
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-[10px] font-black uppercase tracking-[0.06em] text-black/40">
            Prochaine action : <span className="text-black/65">{nextAction(item, blockedByTitle)}</span>
          </p>
        </div>
      )}

      <Link
        href={href}
        className="mt-3 flex items-center justify-between rounded-[14px] border border-black/10 bg-black px-3 py-2 text-[11px] font-black uppercase tracking-[0.06em] text-white"
      >
        Ouvrir la tâche <CommandIcon name="arrow" className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}
