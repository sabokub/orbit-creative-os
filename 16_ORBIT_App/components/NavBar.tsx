"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CommandIcon, { CommandIconName } from "./CommandIcon";
import WorkModeSelector from "./WorkModeSelector";
import { useWorkMode } from "@/contexts/WorkModeContext";

const PILOT_ITEMS: Array<{ href: string; label: string; icon: CommandIconName }> = [
  { href: "/execution", label: "Exécution SMART", icon: "target" },
  { href: "/studio", label: "Studio Pulse", icon: "home" },
  { href: "/dependencies", label: "Dépendances", icon: "link" },
  { href: "/timeline", label: "Timeline", icon: "calendar" },
  { href: "/search", label: "Recherche", icon: "search" },
  { href: "/integrations", label: "Intégrations", icon: "library" },
  { href: "/studio/archive", label: "Archive", icon: "check" },
];

function BrandLogo() {
  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap" aria-label="24March Studio Orbit">
      <span className="font-display text-[19px] font-semibold leading-none tracking-[-0.03em] text-[#15161a]">24March</span>
      <span className="folio">Studio</span>
    </span>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const { config, focusMode } = useWorkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const modeNav = config.navigationItems;
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  const navigation = (
    <>
      <div className="mt-3 px-3"><span className="folio">Mode de travail</span><div className="mt-2"><WorkModeSelector /></div></div>
      <p className="folio px-6 pb-2 pt-5">Navigation</p>
      <nav className="space-y-0.5 px-3" aria-label="Navigation du mode actif">
        {modeNav.map((item, index) => (
          <Link key={item.href + "-" + index} href={item.href} onClick={() => setMobileOpen(false)}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={"nav-link flex items-center gap-2.5 px-3 py-2 text-sm transition-colors " +
              (isActive(item.href) ? "font-medium text-[#15161a]" : "text-[#4c4e53]")}>
            <CommandIcon name={item.icon as CommandIconName} strokeWidth={1.5} className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {isActive(item.href) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#15161a]" />}
          </Link>
        ))}
      </nav>
      {!focusMode && <>
        <p className="folio px-6 pb-2 pt-6">Pilotage Orbit</p>
        <nav className="space-y-0.5 px-3" aria-label="Pilotage Orbit">
          {PILOT_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={"nav-link flex items-center gap-2.5 px-3 py-2 text-sm transition-colors " +
                (isActive(item.href) ? "font-medium text-[#15161a]" : "text-[#4c4e53]")}>
              <CommandIcon name={item.icon} strokeWidth={1.5} className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {isActive(item.href) && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#15161a]" />}
            </Link>
          ))}
        </nav>
      </>}
    </>
  );

  const footer = (
    <div className="border-t border-black/10 px-6 py-4">
      <p className="folio">Orbit · Creative OS</p>
      <p className="mt-1 text-xs leading-5 text-[#66686d]">Direction artistique, création et exécution 24March.</p>
      <Link href="/projects/new" onClick={() => setMobileOpen(false)}
        className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md bg-[#15161a] px-3 text-xs font-medium text-white hover:bg-[#33353a]">
        <CommandIcon name="plus" className="h-3.5 w-3.5" strokeWidth={1.5} />
        Nouveau projet
      </Link>
    </div>
  );

  return (
    <>
      <aside className="orbit-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 p-3 pr-0 md:block">
        <div className="sidebar-glass flex h-full flex-col rounded-xl">
          <Link href="/" className="flex h-16 items-center px-6"><BrandLogo /></Link>
          <div className="min-h-0 flex-1 overflow-y-auto">{navigation}</div>
          {footer}
        </div>
      </aside>
      <div className="orbit-sidebar sticky top-0 z-40 w-full md:hidden">
        <div className="sidebar-glass rounded-none border-x-0 border-t-0">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" onClick={() => setMobileOpen(false)}><BrandLogo /></Link>
            <button type="button" onClick={() => setMobileOpen(v => !v)} aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen} className="flex h-9 w-9 items-center justify-center rounded-md text-[#15161a] hover:bg-white/60">
              <CommandIcon name={mobileOpen ? "close" : "menu"} className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </div>
          {mobileOpen && <div className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-black/10 pb-3">{navigation}{footer}</div>}
        </div>
      </div>
    </>
  );
}
