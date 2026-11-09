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
        className="flex w-full items-center gap-2 rounded-md border border-black/10 bg-white/50 px-3 py-2 text-left text-xs font-medium text-[#15161a] hover:bg-white/85"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/55">
          <CommandIcon name={config.icon as CommandIconName} className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1">
          <span className="folio block text-[10px]">Mode</span>
          {config.label}
        </span>
        <CommandIcon name="arrow" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="sidebar-glass absolute left-0 right-0 top-full z-50 mt-1 space-y-1 rounded-lg p-1.5 shadow-lg"
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
                  className={`flex w-full items-start gap-2 rounded-md px-2 py-2 text-left ${active ? "bg-white/75" : "hover:bg-white/50"}`}
                >
                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-white/55">
                    <CommandIcon name={c.icon as CommandIconName} className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="block text-xs font-medium">{c.label}</span>
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
