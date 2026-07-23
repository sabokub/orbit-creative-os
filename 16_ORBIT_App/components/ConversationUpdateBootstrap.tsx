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

    void Promise.all(
      UPDATE_ENDPOINTS.map(async (endpoint) => {
        const response = await fetch(endpoint, { method: "POST" });
        if (!response.ok) throw new Error(`Conversation sync failed: ${endpoint}`);
        return (await response.json()) as { applied?: boolean };
      })
    )
      .then((results) => {
        if (results.some((result) => result.applied)) window.location.reload();
      })
      .catch(() => {
        // Orbit remains usable when Redis or an update endpoint is temporarily unavailable.
        requested = false;
      });
  }, []);

  return null;
}
