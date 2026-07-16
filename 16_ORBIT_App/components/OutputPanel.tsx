"use client";

import { useState } from "react";
import { AnalysisResult } from "@/lib/responseAnalysis/types";

export default function OutputPanel({
  title,
  content,
  onSave,
  emptyLabel = "Pas encore généré.",
  analysis,
}: {
  title: string;
  content?: string;
  onSave?: (value: string) => void;
  emptyLabel?: string;
  /** Canonical analysis result attached at save time. Absent on outputs saved before the response-analysis engine existed. */
  analysis?: AnalysisResult;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content || "");

  if (!content && !onSave) {
    return (
      <div className="rounded-[18px] border border-dashed border-black/15 bg-white/40 p-4 text-sm font-semibold text-black/35">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-black/10 bg-white/55">
      <div className="flex items-center justify-between gap-3 border-b border-black/8 bg-white/50 px-4 py-2.5">
        <h4 className="text-xs font-black tracking-[-0.01em] text-black/70">{title}</h4>
        {content && (
          <span
            className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.06em] ${
              analysis ? "bg-[#c3d995] text-black" : "bg-black/[0.06] text-black/45"
            }`}
          >
            {analysis ? `${analysis.completenessScore}% complet` : "Non analysé"}
          </span>
        )}
        {onSave && (
          <button
            onClick={() => {
              if (editing) onSave(draft);
              setEditing((v) => !v);
            }}
            className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-black/60 hover:bg-white hover:text-black"
          >
            {editing ? "Enregistrer" : "Éditer"}
          </button>
        )}
      </div>
      {editing ? (
        <textarea
          className="w-full resize-y bg-transparent p-4 font-mono text-[13px] leading-relaxed text-black focus:outline-none"
          rows={12}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : content ? (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4 text-[13px] leading-relaxed text-black/72">
          {content}
        </pre>
      ) : (
        <p className="p-4 text-sm font-semibold text-black/35">{emptyLabel}</p>
      )}
    </div>
  );
}
