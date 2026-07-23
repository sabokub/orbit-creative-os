"use client";

import { useEffect } from "react";

let requested = false;

const UPDATE_ENDPOINTS = [
  "/api/studio/conversation-updates",
  "/api/studio/conversation-updates/2026-07-24",
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
