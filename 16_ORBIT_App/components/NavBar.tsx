"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CommandIcon, { CommandIconName } from "./CommandIcon";

const NAV_ITEMS: Array<{ href: string; label: string; icon: CommandIconName }> = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/brand-profile", label: "Brand Brain", icon: "brain" },
  { href: "/#projects", label: "Projects", icon: "projects" },
  { href: "/#workflows", label: "Visual Lab", icon: "sparkles" },
  { href: "/#launch", label: "Launch", icon: "launch" },
];

function BrandMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-[17px] border border-black/15 bg-[#151515] text-white shadow-[0_8px_18px_rgba(21,21,21,0.18)]">
      <span className="display-serif -mt-0.5 text-[20px] italic">24</span>
    </div>
  );
}

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href.split("#")[0]) && href !== "/#projects" && href !== "/#workflows" && href !== "/#launch";
  };

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col border-r border-black/10 bg-[#fffdf8]/88 px-4 py-5 backdrop-blur-2xl lg:flex">
        <Link href="/" className="flex items-center gap-3 rounded-[22px] px-2 py-1.5">
          <BrandMark />
          <div>
            <p className="text-[13px] font-black tracking-[-0.03em]">24MARCH</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">Command Center</p>
          </div>
        </Link>

        <div className="mt-8 px-2">
          <p className="command-label">Workspace</p>
        </div>

        <nav className="mt-3 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-3 rounded-[18px] px-3 py-3 text-sm font-bold ${
                  active
                    ? "bg-[#bdd8f8] text-[#151515] shadow-[inset_0_0_0_1px_rgba(21,21,21,0.08)]"
                    : "text-black/58 hover:bg-black/[0.045] hover:text-black"
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-[12px] ${active ? "bg-white/65" : "bg-black/[0.045] group-hover:bg-white/70"}`}>
                  <CommandIcon name={item.icon} className="h-[17px] w-[17px]" />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="relative overflow-hidden rounded-[24px] border border-black/10 bg-[#c3d995] p-4">
            <div className="absolute -right-4 -top-5 h-20 w-20 rounded-full border-[12px] border-white/30" />
            <p className="command-label text-black/55">Current focus</p>
            <p className="mt-2 max-w-[150px] text-sm font-black leading-tight">Build the launch system, not random tasks.</p>
            <Link href="/#launch" className="mt-4 inline-flex items-center gap-1.5 text-xs font-black underline decoration-2 underline-offset-4">
              Open launch board <CommandIcon name="arrow" className="h-3.5 w-3.5" />
            </Link>
          </div>

          <Link href="/projects/new" className="command-button w-full">
            <CommandIcon name="plus" className="h-4 w-4" />
            New project
          </Link>

          <div className="flex items-center justify-between px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-black/38">
            <span>ORBIT Alpha</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#72a044]" /> Online</span>
          </div>
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-black/10 bg-[#fffdf8]/88 px-4 backdrop-blur-2xl lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark />
          <div>
            <p className="text-xs font-black">24MARCH</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/45">Command Center</p>
          </div>
        </Link>
        <Link href="/projects/new" className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-[#151515] text-white shadow-sm" aria-label="Créer un projet">
          <CommandIcon name="plus" className="h-5 w-5" />
        </Link>
      </header>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 gap-1 rounded-[24px] border border-black/10 bg-[#fffdf8]/92 p-1.5 shadow-[0_16px_45px_rgba(33,31,26,0.18)] backdrop-blur-2xl lg:hidden">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-[18px] text-[9px] font-black ${active ? "bg-[#bdd8f8] text-black" : "text-black/48"}`}
            >
              <CommandIcon name={item.icon} className="h-[19px] w-[19px]" />
              <span>{item.label.replace("Brand ", "")}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
