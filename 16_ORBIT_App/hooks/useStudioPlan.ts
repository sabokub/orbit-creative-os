"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_STUDIO_PLAN, StudioPlan } from "@/lib/studioPlan";
import { fetchStudioPlan } from "@/lib/studioPlanClient";

const REFRESH_INTERVAL_MS = 15_000;

export function useStudioPlan() {
  const [plan, setPlan] = useState<StudioPlan>(DEFAULT_STUDIO_PLAN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const nextPlan = await fetchStudioPlan();
      setPlan(nextPlan);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

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

  return { plan, loading, error, refresh };
}
