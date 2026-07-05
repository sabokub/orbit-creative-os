"use client";

import Link from "next/link";
import { useState } from "react";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          ORBIT Automation Hub
        </Link>

        <nav className="hidden items-center gap-4 sm:flex">
          <Link href="/" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
            Dashboard
          </Link>
          <Link href="/brand-profile" className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white">
            Brand Profile
          </Link>
          <Link
            href="/projects/new"
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            New Project
          </Link>
        </nav>

        <button
          className="rounded-lg border border-neutral-200 p-2 sm:hidden dark:border-neutral-800"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          <span className="block h-0.5 w-5 bg-neutral-700 dark:bg-neutral-200" />
          <span className="mt-1 block h-0.5 w-5 bg-neutral-700 dark:bg-neutral-200" />
          <span className="mt-1 block h-0.5 w-5 bg-neutral-700 dark:bg-neutral-200" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2 border-t border-neutral-200 px-4 py-3 sm:hidden dark:border-neutral-800">
          <Link href="/" onClick={() => setOpen(false)} className="text-sm text-neutral-700 dark:text-neutral-200">
            Dashboard
          </Link>
          <Link href="/brand-profile" onClick={() => setOpen(false)} className="text-sm text-neutral-700 dark:text-neutral-200">
            Brand Profile
          </Link>
          <Link
            href="/projects/new"
            onClick={() => setOpen(false)}
            className="rounded-lg bg-neutral-900 px-3 py-2 text-center text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
          >
            New Project
          </Link>
        </div>
      )}
    </header>
  );
}
