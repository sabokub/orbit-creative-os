"use client";

import { useEffect } from "react";
import CommandIcon from "./CommandIcon";

export type ToastKind = "success" | "error";

export interface ToastMessage {
  id: string;
  kind: ToastKind;
  text: string;
}

const PENDING_TOAST_KEY = "orbit:pending-toast";

/**
 * A toast can be requested right before a client-side redirect (e.g.
 * deleting a project from its own workspace page navigates to /projects
 * before the toast would have time to render). Stashing it in sessionStorage
 * lets the destination page pick it up on mount via `takePendingToast`.
 */
export function setPendingToast(kind: ToastKind, text: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ kind, text }));
  } catch {
    // Storage can be unavailable (private mode, quota) -- losing the toast
    // is a cosmetic issue, never worth crashing the delete flow over.
  }
}

export function takePendingToast(): { kind: ToastKind; text: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_TOAST_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_TOAST_KEY);
    const parsed = JSON.parse(raw) as { kind: ToastKind; text: string };
    if (parsed.kind !== "success" && parsed.kind !== "error") return null;
    if (typeof parsed.text !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function ToastRow({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.kind === "success";

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex w-full items-center gap-2.5 rounded-[18px] border px-4 py-3 text-sm font-bold shadow-[0_16px_36px_rgba(32,30,25,0.16)] backdrop-blur ${
        isSuccess ? "border-black/10 bg-[#c3d995] text-black" : "border-red-300 bg-red-50 text-red-800"
      }`}
    >
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isSuccess ? "bg-white/60" : "bg-red-100"}`}>
        <CommandIcon name={isSuccess ? "check" : "close"} className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 leading-snug">{toast.text}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fermer la notification"
        className="shrink-0 text-black/40 hover:text-black"
      >
        <CommandIcon name="close" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
      {toasts.map((toast) => (
        <div key={toast.id} className="w-full max-w-sm">
          <ToastRow toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
