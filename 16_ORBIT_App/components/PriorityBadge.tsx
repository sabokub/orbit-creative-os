"use client";

import { useState } from "react";
import { PriorityResult } from "@/lib/types";

const LABEL_TINT: Record<PriorityResult["label"], string> = {
  Critique: "border-[#d87979]/35 bg-[#ffdada] text-[#7b2525]",
  Haute: "border-[#d7aa2f]/35 bg-[#f5df75]/65 text-[#69510a]",
  Moyenne: "border-black/10 bg-[#dcecff] text-[#1f3a5c]",
  Faible: "border-black/10 bg-black/[0.045] text-black/45",
};

/**
 * Every score ships with its explanation — shown via native title (hover on
 * desktop) and a tap-to-expand panel (works on touch devices too).
 *
 * The panel expands inline (normal document flow) rather than as a floating
 * overlay: cards in this app are compact, and an absolutely-positioned
 * tooltip reliably ends up covering another card's controls underneath it.
 * Growing the row instead means it can never block a click somewhere else.
 */
export default function PriorityBadge({ result, className = "" }: { result: PriorityResult; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className={`inline-flex shrink-0 flex-col items-end gap-1.5 ${className}`}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((v) => !v);
        }}
        title={result.explanation}
        aria-expanded={open}
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${LABEL_TINT[result.label]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
        {result.label} · {result.score}
      </button>
      {open && (
        <span className="w-56 max-w-[70vw] rounded-[14px] border border-black/10 bg-[#151515] p-3 text-left text-[11px] font-semibold leading-snug text-white shadow-[0_10px_24px_rgba(21,21,21,0.2)]">
          {result.explanation}
        </span>
      )}
    </span>
  );
}
