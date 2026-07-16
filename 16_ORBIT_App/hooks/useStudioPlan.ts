"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_STUDIO_PLAN, StudioPlan } from "@/lib/studioPlan";
import { fetchStudioPlan, updateStudioPlan } from "@/lib/studioPlanClient";

const REFRESH_INTERVAL_MS = 15_000;

export function useStudioPlan() {
  const [plan, setPlan] = useState<StudioPlan>(DEFAULT_STUDIO_PLAN);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const nextPlan = await fetchStudioPlan();
      setPlan(nextPlan);
      setError("");
      return nextPlan;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const save = useCallback(async (nextPlan: StudioPlan) => {
    const previous = plan;
    const optimistic = { ...nextPlan, updatedAt: new Date().toISOString() };
    setPlan(optimistic);
    setSaving(true);
    try {
      const saved = await updateStudioPlan(optimistic);
      setPlan(saved);
      setError("");
      return saved;
    } catch (err) {
      setPlan(previous);
      setError((err as Error).message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [plan]);

  const manualSync = useCallback(async () => {
    setSyncing(true);
    try {
      const fresh = await refresh();
      const synced = { ...fresh, lastManualSyncAt: new Date().toISOString() };
      const saved = await updateStudioPlan(synced);
      setPlan(saved);
      setError("");
      return saved;
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    const onFocus = () => void refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  return { plan, setPlan, loading, saving, syncing, error, refresh, manualSync, save };
}
