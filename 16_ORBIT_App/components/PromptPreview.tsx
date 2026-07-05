"use client";

import { useState } from "react";

export default function PromptPreview({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Prompt à copier dans ChatGPT / Claude
        </span>
        <button
          onClick={copy}
          className="rounded-md bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4 text-xs text-neutral-800 dark:text-neutral-200">
        {prompt}
      </pre>
    </div>
  );
}
