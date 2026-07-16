"use client";

import { useState } from "react";
import { PriorityResult } from "@/lib/types";
import { tierStyleForPriority } from "@/lib/importanceColor";
import ImportanceMark from "./ImportanceMark";

/**
 * Every score ships with its explanation — shown via native title (hover on
 * desktop) and a tap-to-expand panel (works on touch devices too).
 *
 * The panel expands inline (normal document flow) rather than as a floating
 * overlay: cards in this app are compact, and an absolutely-positioned
 * tooltip reliably ends up covering another card's controls underneath it.
 * Growing the row instead means it can never block a click somewhere else.
 *
 * Color is never the only signal: the tag text (Critique/Haute/Moyenne/
 * Faible) and a shape mark (triangle/diamond/square/circle) both ship
 * alongside the tint, sourced from the single canonical map in
 * lib/importanceColor.ts.
 */
export default function PriorityBadge({ result, className = "" }: { result: PriorityResult; className?: string }) {
  const [open, setOpen] = useState(false);
  const style = tierStyleForPriority(result);

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
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${style.badge}`}
      >
        <ImportanceMark shape={style.mark} color={style.markColor} />
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
