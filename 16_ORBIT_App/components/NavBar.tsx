"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CommandIcon, { CommandIconName } from "./CommandIcon";

const NAV_ITEMS: Array<{ href: string; label: string; mobileLabel: string; icon: CommandIconName }> = [
  { href: "/", label: "Centre de commande", mobileLabel: "Accueil", icon: "home" },
  { href: "/brand-profile", label: "Cerveau de marque", mobileLabel: "Marque", icon: "brain" },
  { href: "/projects", label: "Projets", mobileLabel: "Projets", icon: "projects" },
  { href: "/visual-lab", label: "Laboratoire visuel", mobileLabel: "Lab visuel", icon: "sparkles" },
  { href: "/launch", label: "Lancement", mobileLabel: "Lancement", icon: "launch" },
];

const PILOT_ITEMS: Array<{ href: string; label: string; icon: CommandIconName }> = [
  { href: "/studio", label: "Studio Pulse", icon: "home" },
  { href: "/dependencies", label: "Dépendances", icon: "projects" },
  { href: "/studio/timeline", label: "Timeline", icon: "launch" },
  { href: "/search", label: "Recherche globale", icon: "sparkles" },
  { href: "/studio/integrations", label: "Intégrations", icon: "library" },
  { href: "/studio/archive", label: "Archive", icon: "check" },
];

function BrandMark() {
  return <div className="flex h-9 w-9 items-center justify-center rounded-[13px] border border-black/10 bg-[#f5df75] text-[#151515] shadow-sm"><span className="display-serif -mt-0.5 text-[17px] italic">24</span></div>;
}

export default function NavBar() {
  const pathname = usePathname();
  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return <>
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[224px] flex-col border-r border-black/10 bg-[#fffdf8]/92 px-3.5 py-4 backdrop-blur-2xl lg:flex">
      <Link href="/" className="flex items-center gap-3 rounded-[18px] px-2 py-1.5"><BrandMark /><div><p className="text-[13px] font-black tracking-[-0.03em]">24MARCH</p><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-black/42">Studio OS</p></div></Link>
      <div className="mt-7 px-2"><p className="command-label">Navigation</p></div>
      <nav className="mt-3 space-y-1">{NAV_ITEMS.map((item) => { const active = isActive(item.href); return <Link key={item.label} href={item.href} className={`group flex items-center gap-2.5 rounded-[15px] px-2.5 py-2.5 text-[13px] font-bold ${active ? "bg-[#e6edcd] text-[#151515] shadow-[inset_0_0_0_1px_rgba(21,21,21,0.07)]" : "text-black/56 hover:bg-black/[0.04] hover:text-black"}`}><span className={`flex h-7 w-7 items-center justify-center rounded-[10px] ${active ? "bg-white/75" : "bg-black/[0.04] group-hover:bg-white/70"}`}><CommandIcon name={item.icon} className="h-4 w-4" /></span><span>{item.label}</span></Link>; })}</nav>
      <div className="mt-6 border-t border-black/8 px-2 pt-5"><p className="command-label">Pilotage ORBIT</p><div className="mt-3 space-y-1">{PILOT_ITEMS.map((item) => { const active = isActive(item.href); return <Link key={item.href} href={item.href} className={`flex items-center gap-2 rounded-[13px] px-2 py-2 text-xs font-bold ${active ? "bg-[#f5effd] text-black" : "text-black/55 hover:bg-black/[0.04] hover:text-black"}`}><CommandIcon name={item.icon} className="h-4 w-4" /> {item.label}</Link>; })}</div></div>
      <div className="mt-6 border-t border-black/8 px-2 pt-5"><p className="command-label">Raccourcis</p><div className="mt-3 space-y-1"><Link href="/projects/new" className="flex items-center gap-2 rounded-[13px] px-2 py-2 text-xs font-bold text-black/55 hover:bg-black/[0.04] hover:text-black"><CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet</Link><Link href="/projects" className="flex items-center gap-2 rounded-[13px] px-2 py-2 text-xs font-bold text-black/55 hover:bg-black/[0.04] hover:text-black"><CommandIcon name="library" className="h-4 w-4" /> Bibliothèque</Link></div></div>
      <div className="mt-auto space-y-3"><div className="relative overflow-hidden rounded-[20px] border border-black/10 bg-[#bdd8f8]/55 p-3.5"><div className="absolute -right-5 -top-6 h-20 w-20 rounded-full border-[12px] border-white/35" /><p className="command-label text-black/55">ORBIT</p><p className="mt-2 max-w-[160px] text-[13px] font-black leading-tight">Ton copilote pour créer, relire et lancer plus vite.</p><Link href="/projects/new" className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-black underline decoration-2 underline-offset-4">Créer avec ORBIT <CommandIcon name="arrow" className="h-3.5 w-3.5" /></Link></div><div className="flex items-center justify-between px-2 text-[9px] font-bold uppercase tracking-[0.12em] text-black/35"><span>ORBIT Alpha</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#72a044]" /> En ligne</span></div></div>
    </aside>

    <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-black/8 bg-[#fffdf8]/94 px-3.5 backdrop-blur-2xl lg:hidden"><Link href="/" className="flex items-center gap-2.5"><BrandMark /><div><p className="text-[11px] font-black tracking-[-0.02em]">24MARCH STUDIO</p><p className="text-[8px] font-bold uppercase tracking-[0.14em] text-black/40">Command Center</p></div></Link><Link href="/projects/new" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-black px-3 text-[10px] font-black text-white shadow-sm" aria-label="Créer un nouveau projet"><CommandIcon name="plus" className="h-4 w-4" /><span>Nouveau projet</span></Link></header>

    <nav className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-50 grid grid-cols-5 gap-0.5 rounded-[21px] border border-black/10 bg-[#fffdf8]/95 p-1 shadow-[0_14px_35px_rgba(33,31,26,0.16)] backdrop-blur-2xl lg:hidden">{NAV_ITEMS.map((item) => { const active = isActive(item.href); return <Link key={item.label} href={item.href} className={`flex min-h-[49px] flex-col items-center justify-center gap-0.5 rounded-[16px] text-[8px] font-black ${active ? "bg-[#e6edcd] text-black" : "text-black/44"}`}><CommandIcon name={item.icon} className="h-[17px] w-[17px]" /><span>{item.mobileLabel}</span></Link>; })}</nav>
  </>;
}
