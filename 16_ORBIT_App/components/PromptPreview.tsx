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
    <div className="overflow-hidden rounded-[18px] border border-black/10 bg-[#fbf6e8]/70">
      <div className="flex items-center justify-between gap-3 border-b border-black/8 px-4 py-2.5">
        <span className="text-[10px] font-black uppercase tracking-[0.12em] text-black/45">
          Prompt à copier dans ChatGPT / Claude
        </span>
        <button
          onClick={copy}
          className="rounded-full bg-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white hover:bg-black/80"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto whitespace-pre-wrap p-4 text-xs leading-relaxed text-black/68">
        {prompt}
      </pre>
    </div>
  );
}
