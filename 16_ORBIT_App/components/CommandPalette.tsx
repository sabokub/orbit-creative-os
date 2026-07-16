"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStudioPlan } from "@/hooks/useStudioPlan";

const actions = [
  { label: "Créer un projet", href: "/projects/new", keywords: "nouveau projet client" },
  { label: "Gérer les tâches", href: "/launch#tasks", keywords: "tâches aujourd'hui priorités" },
  { label: "Gérer les contenus", href: "/launch#content", keywords: "contenu calendrier reel instagram" },
  { label: "Voir les dépendances", href: "/dependencies", keywords: "graphe blocages liens" },
  { label: "Ouvrir la timeline", href: "/timeline", keywords: "roadmap dates historique" },
  { label: "Ouvrir Studio Pulse", href: "/studio", keywords: "santé progression risques" },
  { label: "Recherche universelle", href: "/search", keywords: "chercher trouver" },
];

export default function CommandPalette() {
  const router = useRouter();
  const { manualSync } = useStudioPlan();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return actions;
    return actions.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(needle));
  }, [query]);

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-[5.7rem] right-4 z-40 flex h-12 items-center gap-2 rounded-full border border-black/10 bg-white px-4 text-xs font-black shadow-[0_12px_30px_rgba(0,0,0,0.14)] lg:bottom-5" aria-label="Ouvrir les commandes">
        <span>⌘K</span><span className="hidden sm:inline">Commandes</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/25 px-3 pt-[12vh] backdrop-blur-sm" onMouseDown={() => setOpen(false)}>
          <div className="w-full max-w-xl overflow-hidden rounded-[26px] border border-black/10 bg-[#fbfaf6] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="border-b border-black/8 p-4">
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Chercher une commande…" className="w-full !min-h-[46px] !rounded-[15px] border border-black/10 bg-white px-4 text-sm font-bold outline-none" />
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              {filtered.map((item) => <button key={item.href} type="button" onClick={() => navigate(item.href)} className="flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left hover:bg-[#edf2e5]"><span className="text-sm font-black">{item.label}</span><span className="text-black/30">→</span></button>)}
              <button type="button" onClick={() => { void manualSync(); setOpen(false); }} className="flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left hover:bg-[#e8f3ff]"><span className="text-sm font-black">Synchroniser ORBIT</span><span>↻</span></button>
              {!filtered.length && <p className="p-4 text-sm font-semibold text-black/45">Aucune commande trouvée.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
