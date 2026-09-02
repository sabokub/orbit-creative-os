"use client";

import { useEffect } from "react";

let requested = false;

const UPDATE_ENDPOINTS = [
  "/api/studio/conversation-updates",
  "/api/studio/conversation-updates/2026-07-24",
  "/api/studio/conversation-updates/2026-07-25",
  "/api/studio/conversation-updates/2026-07-26",
  "/api/studio/conversation-updates/2026-08-06",
  "/api/studio/conversation-updates/2026-08-07",
  "/api/studio/conversation-updates/2026-08-08",
  "/api/studio/conversation-updates/2026-08-09",
  "/api/studio/conversation-updates/2026-08-10",
  "/api/studio/conversation-updates/2026-08-12",
  "/api/studio/conversation-updates/2026-09-02",
] as const;

/**
 * Applies fixed, idempotent conversation update packs after deployment.
 * Endpoints accept no payload and Redis markers prevent repeated writes.
 */
export default function ConversationUpdateBootstrap() {
  useEffect(() => {
    if (requested) return;
    requested = true;

    void (async () => {
      let applied = false;
      for (const endpoint of UPDATE_ENDPOINTS) {
        const response = await fetch(endpoint, { method: "POST" });
        if (!response.ok) throw new Error(`Conversation sync failed: ${endpoint}`);
        const result = (await response.json()) as { applied?: boolean };
        applied = Boolean(result.applied) || applied;
      }
      if (applied) window.location.reload();
    })().catch(() => {
      // Orbit remains usable when Redis or an update endpoint is temporarily unavailable.
      requested = false;
    });
  }, []);

  return null;
}
