"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ActivityEntry, Decision, StudioItem, StudioItemInput, StudioNotification, UpdateItemPatch } from "@/lib/types";
import {
  archiveStudioItem,
  createStudioItem,
  listActivity,
  listDecisions,
  listNotifications,
  listStudioItems,
  markNotificationRead as markNotificationReadApi,
  resolveDecision as resolveDecisionApi,
  updateStudioItem,
} from "@/lib/studioClient";

/**
 * Single client-side source of truth for Studio Brain data. Every page that
 * reads or writes tasks/content/decisions/activity/notifications goes
 * through this context instead of independently calling the API -- so a
 * mutation made from one page (e.g. marking a task done in "Aujourd'hui")
 * is immediately reflected everywhere else (the content bank, the
 * timeline, the archive) without each of them re-implementing its own
 * fetch-and-poll loop.
 */
interface StudioBrainState {
  items: StudioItem[];
  decisions: Decision[];
  activity: ActivityEntry[];
  notifications: StudioNotification[];
  loaded: boolean;
  error: string;
  refresh: () => Promise<void>;
  updateItem: (id: string, patch: UpdateItemPatch) => Promise<void>;
  archiveItem: (id: string) => Promise<void>;
  createItem: (input: StudioItemInput) => Promise<void>;
  resolveDecision: (id: string, resolution: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

const StudioBrainContext = createContext<StudioBrainState | null>(null);

const REFRESH_INTERVAL_MS = 20_000;

export function StudioBrainProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StudioItem[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [notifications, setNotifications] = useState<StudioNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [i, d, a, n] = await Promise.all([
        listStudioItems(),
        listDecisions(),
        listActivity(30),
        listNotifications(),
      ]);
      setItems(i);
      setDecisions(d);
      setActivity(a);
      setNotifications(n);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoaded(true);
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

  // Every mutation always ends with a refresh(): the source of truth is the
  // server, not a locally-patched guess, and this is exactly the point at
  // which a rejected (409) write due to a concurrent edit elsewhere gets
  // corrected back to the real state.
  const updateItemFn = useCallback(
    async (id: string, patch: UpdateItemPatch) => {
      const current = items.find((it) => it.id === id);
      try {
        await updateStudioItem(id, patch, current?.updatedAt);
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        await refresh();
      }
    },
    [items, refresh]
  );

  const archiveItemFn = useCallback(
    async (id: string) => {
      try {
        await archiveStudioItem(id);
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  const createItemFn = useCallback(
    async (input: StudioItemInput) => {
      try {
        await createStudioItem(input);
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  const resolveDecisionFn = useCallback(
    async (id: string, resolution: string) => {
      try {
        await resolveDecisionApi(id, resolution);
      } catch (err) {
        setError((err as Error).message);
        throw err;
      } finally {
        await refresh();
      }
    },
    [refresh]
  );

  const markNotificationReadFn = useCallback(async (id: string) => {
    await markNotificationReadApi(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const value = useMemo<StudioBrainState>(
    () => ({
      items,
      decisions,
      activity,
      notifications,
      loaded,
      error,
      refresh,
      updateItem: updateItemFn,
      archiveItem: archiveItemFn,
      createItem: createItemFn,
      resolveDecision: resolveDecisionFn,
      markNotificationRead: markNotificationReadFn,
    }),
    [items, decisions, activity, notifications, loaded, error, refresh, updateItemFn, archiveItemFn, createItemFn, resolveDecisionFn, markNotificationReadFn]
  );

  return <StudioBrainContext.Provider value={value}>{children}</StudioBrainContext.Provider>;
}

export function useStudioBrain(): StudioBrainState {
  const ctx = useContext(StudioBrainContext);
  if (!ctx) {
    throw new Error("useStudioBrain() must be used within a <StudioBrainProvider>.");
  }
  return ctx;
}
