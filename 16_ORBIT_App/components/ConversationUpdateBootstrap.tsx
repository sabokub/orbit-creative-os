"use client";

import { useEffect } from "react";

let requested = false;

/**
 * Applies the fixed, idempotent conversation update pack after deployment.
 * The endpoint accepts no payload and a Redis marker prevents repeated writes.
 */
export default function ConversationUpdateBootstrap() {
  useEffect(() => {
    if (requested) return;
    requested = true;
    void fetch("/api/studio/conversation-updates", { method: "POST" })
      .then((response) => {
        if (!response.ok) requested = false;
      })
      .catch(() => {
        // Orbit remains usable when Redis or the update endpoint is temporarily unavailable.
        requested = false;
      });
  }, []);

  return null;
}
