"use client";

import { useEffect, useState } from "react";
import { IntegrationId, IntegrationStatus, IntegrationSyncState } from "@/lib/types";

const INTEGRATION_IDS: IntegrationId[] = ["redis", "github", "vercel", "drive", "calendar"];

const STATE_LABEL: Record<IntegrationStatus, string> = { connected: "Connecté", not_connected: "À connecter", error: "Erreur" };
const STATE_STYLE: Record<IntegrationStatus, string> = {
  connected: "bg-[#e6edcd] text-[#486126]",
  not_connected: "bg-[#eef1f4] text-black/55",
  error: "bg-[#ffe2e2] text-[#9a2b2b]",
};

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<IntegrationSyncState[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/studio/integrations", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Impossible de vérifier les intégrations.");
      setStatuses(payload || []);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function syncAll() {
    setSyncing(true);
    try {
      const next: IntegrationSyncState[] = [];
      for (const id of INTEGRATION_IDS) {
        const response = await fetch("/api/studio/integrations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || `Synchronisation impossible pour ${id}.`);
        next.push(payload);
      }
      setStatuses(next);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const connected = statuses.filter((item) => item.status === "connected").length;

  return (
    <div className="space-y-4 pb-36 lg:pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="command-label">Sync Center</p>
          <h1 className="mt-2 text-3xl font-black sm:text-4xl">Intégrations ORBIT</h1>
          <p className="mt-1 text-sm text-black/48">Une vue honnête de ce qui est réellement connecté au studio.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void refresh()} disabled={loading || syncing} className="command-pill bg-white disabled:opacity-50">
            ↻ {loading ? "Vérification…" : "Vérifier"}
          </button>
          <button type="button" onClick={() => void syncAll()} disabled={loading || syncing} className="command-button disabled:opacity-50">
            {syncing ? "Synchronisation…" : "Synchroniser maintenant"}
          </button>
        </div>
      </header>

      {error && <div className="rounded-[18px] border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-[24px] border border-black/10 bg-[#eef7ff] p-5">
          <p className="command-label">Connectées</p>
          <p className="mt-2 text-5xl font-black">{connected}</p>
        </article>
        <article className="rounded-[24px] border border-black/10 bg-[#fff8e5] p-5">
          <p className="command-label">À finaliser</p>
          <p className="mt-2 text-5xl font-black">{Math.max(0, statuses.length - connected)}</p>
        </article>
        <article className="rounded-[24px] border border-black/10 bg-[#f5effd] p-5">
          <p className="command-label">Sources suivies</p>
          <p className="mt-2 text-5xl font-black">{statuses.length}</p>
        </article>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        {statuses.map((item) => (
          <article key={item.id} className="rounded-[24px] border border-black/10 bg-white/80 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black">{item.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-black/48">{item.detail}</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${STATE_STYLE[item.status]}`}>{STATE_LABEL[item.status]}</span>
            </div>
            {item.lastSyncedAt && (
              <p className="mt-4 border-t border-black/8 pt-3 text-[10px] font-bold uppercase text-black/35">
                Vérifié {new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" }).format(new Date(item.lastSyncedAt))}
              </p>
            )}
          </article>
        ))}
      </section>

      <section className="rounded-[24px] border border-black/10 bg-[linear-gradient(135deg,#fbf6e8,#edf2e5)] p-5">
        <p className="command-label">Prochaine étape</p>
        <h2 className="mt-1 text-xl font-black">Brancher Drive et Calendar</h2>
        <p className="mt-2 max-w-3xl text-sm text-black/50">
          GitHub est lu directement (dernier commit du dépôt) et Vercel est synchronisé dès qu&rsquo;un jeton serveur existe (déploiements réels,
          et une décision est ouverte automatiquement si le dernier déploiement n&rsquo;est pas prêt). Drive et Calendar nécessitent encore leur
          autorisation Google avant de pouvoir influencer automatiquement le Studio Brain.
        </p>
      </section>
    </div>
  );
}
