"use client";

import { useState } from "react";
import { useWorkMode } from "@/contexts/WorkModeContext";
import { getWorkModeConfig } from "@/lib/workModes/config";
import CommandIcon, { CommandIconName } from "./CommandIcon";

/**
 * Compact, always-visible work-mode switcher. Changing mode is instantaneous
 * (no reload) — it flips the global WorkMode context, which the navigation and
 * mode-aware views react to. Same component on desktop and mobile.
 */
export default function WorkModeSelector() {
  const { mode, modes, setMode, config } = useWorkMode();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-[13px] border border-black/10 bg-white/70 px-2.5 py-2 text-left text-xs font-black hover:bg-white"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-[8px] bg-[#e6edcd]">
          <CommandIcon name={config.icon as CommandIconName} className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1">
          <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-black/40">Mode</span>
          {config.label}
        </span>
        <CommandIcon name="arrow" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 space-y-1 rounded-[15px] border border-black/10 bg-[#fffdf8] p-1.5 shadow-[0_14px_35px_rgba(33,31,26,0.16)]"
        >
          {modes.map((m) => {
            const c = getWorkModeConfig(m);
            const active = m === mode;
            return (
              <li key={m}>
                <button
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setMode(m);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-2 rounded-[11px] px-2 py-1.5 text-left ${active ? "bg-[#e6edcd]" : "hover:bg-black/[0.04]"}`}
                >
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-[8px] bg-white/70">
                    <CommandIcon name={c.icon as CommandIconName} className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="block text-xs font-black">{c.label}</span>
                    <span className="block text-[10px] font-medium leading-tight text-black/50">{c.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
