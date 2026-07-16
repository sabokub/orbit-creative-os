"use client";

import { useEffect } from "react";
import CommandIcon from "./CommandIcon";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  busy = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-sm rounded-[26px] border border-black/10 bg-[#fffdf8] p-5 shadow-[0_24px_60px_rgba(32,30,25,0.2)] sm:p-6"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-red-100">
          <CommandIcon name="trash" className="h-5 w-5 text-red-700" />
        </span>
        <h2 id="confirm-dialog-title" className="mt-4 text-xl font-black leading-tight tracking-[-0.02em]">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm font-medium leading-relaxed text-black/55">
          {description}
        </p>
        {error && (
          <p role="alert" className="mt-3 rounded-[14px] border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-800">
            {error}
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="command-button command-button-soft justify-center disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-60"
          >
            {busy ? "Suppression…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
