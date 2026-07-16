"use client";

import { useEffect, useRef, useState } from "react";
import { useStudioBrain } from "@/contexts/StudioBrainContext";
import { relativeTime } from "@/lib/format";
import CommandIcon from "./CommandIcon";

export default function NotificationBell({ className = "" }: { className?: string }) {
  const { notifications, markNotificationRead } = useStudioBrain();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setNow(new Date());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/75 text-black/55 hover:text-black"
      >
        <CommandIcon name="bell" className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#d87979] px-1 text-[8px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-[60] max-h-[70vh] w-[280px] max-w-[85vw] overflow-y-auto rounded-[18px] border border-black/10 bg-white shadow-[0_18px_44px_rgba(70,68,57,0.18)]">
          <div className="border-b border-black/6 px-3.5 py-2.5">
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-black/50">Notifications</p>
          </div>
          <div className="divide-y divide-black/6">
            {notifications.slice(0, 20).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => markNotificationRead(n.id)}
                className={`block w-full px-3.5 py-2.5 text-left ${n.read ? "opacity-55" : ""}`}
              >
                <p className="text-[11px] font-bold leading-snug text-black/80">{n.message}</p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-black/35">
                  {now ? relativeTime(n.createdAt, now) : ""}
                </p>
              </button>
            ))}
            {!notifications.length && (
              <p className="px-3.5 py-6 text-center text-[11px] font-semibold text-black/40">Aucune notification.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
