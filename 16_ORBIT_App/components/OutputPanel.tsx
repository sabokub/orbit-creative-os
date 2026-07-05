"use client";

import { useState } from "react";

export default function OutputPanel({
  title,
  content,
  onSave,
  emptyLabel = "Pas encore généré.",
}: {
  title: string;
  content?: string;
  onSave?: (value: string) => void;
  emptyLabel?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(content || "");

  if (!content && !onSave) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-400 dark:border-neutral-700">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{title}</h4>
        {onSave && (
          <button
            onClick={() => {
              if (editing) onSave(draft);
              setEditing((v) => !v);
            }}
            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            {editing ? "Enregistrer" : "Éditer"}
          </button>
        )}
      </div>
      {editing ? (
        <textarea
          className="w-full resize-y bg-transparent p-4 text-sm text-neutral-800 focus:outline-none dark:text-neutral-200"
          rows={12}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : content ? (
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4 text-sm text-neutral-800 dark:text-neutral-200">
          {content}
        </pre>
      ) : (
        <p className="p-4 text-sm text-neutral-400">{emptyLabel}</p>
      )}
    </div>
  );
}
