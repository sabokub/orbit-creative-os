"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { WorkMode, WorkModeConfig, WORK_MODES, DEFAULT_WORK_MODE, WorkModeSchema } from "@/lib/workModes/contracts";
import { getWorkModeConfig } from "@/lib/workModes/config";

const STORAGE_KEY = "orbit:work-mode";

interface WorkModeContextValue {
  mode: WorkMode;
  config: WorkModeConfig;
  modes: WorkMode[];
  setMode: (mode: WorkMode) => void;
  /** Focus mode for the ACTIVE mode — persisted per mode. */
  focusMode: boolean;
  setFocusMode: (on: boolean) => void;
}

const FOCUS_KEY = "orbit:focus-mode";

const WorkModeContext = createContext<WorkModeContextValue | null>(null);

/**
 * Global work-mode state — the single source of truth for the active mode.
 * Persists to localStorage so the choice survives sessions, and falls back to
 * the default when nothing valid is stored. Never duplicated in components:
 * everything reads it through useWorkMode().
 */
export function WorkModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<WorkMode>(DEFAULT_WORK_MODE);
  const [focusByMode, setFocusByMode] = useState<Partial<Record<WorkMode, boolean>>>({});

  useEffect(() => {
    try {
      const stored = WorkModeSchema.safeParse(localStorage.getItem(STORAGE_KEY));
      if (stored.success) setModeState(stored.data);
      const focusRaw = localStorage.getItem(FOCUS_KEY);
      if (focusRaw) setFocusByMode(JSON.parse(focusRaw));
    } catch {
      /* localStorage unavailable — keep defaults */
    }
  }, []);

  function setMode(next: WorkMode) {
    setModeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore persistence failures */
    }
  }

  function setFocusMode(on: boolean) {
    setFocusByMode((prev) => {
      const next = { ...prev, [mode]: on };
      try {
        localStorage.setItem(FOCUS_KEY, JSON.stringify(next));
      } catch {
        /* ignore persistence failures */
      }
      return next;
    });
  }

  const value = useMemo<WorkModeContextValue>(
    () => ({ mode, config: getWorkModeConfig(mode), modes: [...WORK_MODES], setMode, focusMode: Boolean(focusByMode[mode]), setFocusMode }),
    [mode, focusByMode]
  );

  return <WorkModeContext.Provider value={value}>{children}</WorkModeContext.Provider>;
}

export function useWorkMode(): WorkModeContextValue {
  const ctx = useContext(WorkModeContext);
  if (!ctx) throw new Error("useWorkMode doit être utilisé dans un WorkModeProvider.");
  return ctx;
}
