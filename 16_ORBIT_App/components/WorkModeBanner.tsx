"use client";

import { useWorkMode } from "@/contexts/WorkModeContext";
import CommandIcon, { CommandIconName } from "./CommandIcon";

/**
 * Mode-aware dashboard banner. The home page shows the priority widgets and
 * quick actions of the ACTIVE work mode — the same data underneath, a different
 * emphasis per mode. Switching mode (via the selector) updates this instantly.
 */
export default function WorkModeBanner() {
  const { config } = useWorkMode();
  return (
    <section className="command-card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#e6edcd]">
          <CommandIcon name={config.icon as CommandIconName} className="h-5 w-5" />
        </span>
        <div>
          <span className="command-label">Mode actif</span>
          <h2 className="display-serif text-3xl leading-none">{config.label}</h2>
        </div>
        <p className="ml-auto hidden max-w-xs text-xs font-medium text-black/50 sm:block">{config.description}</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {config.priorityWidgets.map((w) => (
          <div key={w.id} className="rounded-[14px] border border-black/8 bg-white/60 px-3 py-2.5 text-xs font-black text-black/70">
            {w.label}
          </div>
        ))}
      </div>

      {config.quickActions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {config.quickActions.map((a) =>
            a.href ? (
              <a key={a.id} href={a.href} className="command-button command-button-soft px-3 py-1.5 text-xs">
                {a.label}
              </a>
            ) : (
              <span key={a.id} className="rounded-full bg-black/[0.05] px-3 py-1.5 text-xs font-bold text-black/55">
                {a.label}
              </span>
            )
          )}
        </div>
      )}
    </section>
  );
}
