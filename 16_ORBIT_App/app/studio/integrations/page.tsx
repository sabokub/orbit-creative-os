"use client";

import { useEffect, useState } from "react";
import { IntegrationId, IntegrationSyncState } from "@/lib/types";
import { listIntegrations, runIntegrationSync } from "@/lib/studioClient";
import { relativeTime } from "@/lib/format";
import CommandIcon, { CommandIconName } from "@/components/CommandIcon";
import PanelTitle from "@/components/PanelTitle";

const ICONS: Record<IntegrationId, CommandIconName> = {
  github: "strategy",
  vercel: "launch",
  redis: "sparkles",
  drive: "library",
  calendar: "calendar",
};

const STATUS_TINT: Record<IntegrationSyncState["status"], string> = {
  connected: "border-[#8eb15a]/30 bg-[#c3d995]/55 text-[#365016]",
  not_connected: "border-black/10 bg-black/[0.045] text-black/45",
  error: "border-[#d87979]/35 bg-[#ffdada] text-[#7b2525]",
};

const STATUS_LABEL: Record<IntegrationSyncState["status"], string> = {
  connected: "Connecté",
  not_connected: "Non connecté",
  error: "Erreur",
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<IntegrationSyncState[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState<IntegrationId | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  async function refresh() {
    const all = await listIntegrations();
    setIntegrations(all);
  }

  useEffect(() => {
    setNow(new Date());
    refresh()
      .then(() => setLoaded(true))
      .catch((err) => {
        setError((err as Error).message);
        setLoaded(true);
      });
  }, []);

  async function handleSync(id: IntegrationId) {
    setSyncing(id);
    try {
      await runIntegrationSync(id);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 pb-8">
      <header>
        <h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">Intégrations</h1>
        <p className="mt-1 text-sm font-medium text-black/52">
          État de synchronisation réel des services connectés au studio.
        </p>
      </header>

      {error && <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2">
        {!loaded && [1, 2, 3, 4].map((i) => <div key={i} className="h-32 animate-pulse rounded-[22px] bg-black/5" />)}
        {loaded &&
          integrations.map((integration) => (
            <article key={integration.id} className="command-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-black/10 bg-white/70">
                    <CommandIcon name={ICONS[integration.id]} className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-black">{integration.label}</p>
                    <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.08em] ${STATUS_TINT[integration.status]}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                      {STATUS_LABEL[integration.status]}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] font-medium text-black/50">{integration.detail}</p>
              <div className="mt-4 flex items-center justify-between border-t border-black/6 pt-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-black/35">
                  {integration.lastSyncedAt && now ? `Sync ${relativeTime(integration.lastSyncedAt, now)}` : "Jamais synchronisé"}
                </span>
                <button
                  type="button"
                  onClick={() => handleSync(integration.id)}
                  disabled={syncing === integration.id}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.06em] hover:bg-black hover:text-white disabled:opacity-50"
                >
                  {syncing === integration.id ? "Vérification…" : "Vérifier"}
                </button>
              </div>
            </article>
          ))}
      </section>

      <section className="command-card p-5 sm:p-6">
        <PanelTitle title="Comment ça marche" />
        <p className="mt-3 text-[12px] font-medium leading-relaxed text-black/55">
          Chaque vérification appelle un check réel, pas une simulation : Redis confirme une lecture/écriture
          effective, GitHub et Vercel lisent les variables d&apos;environnement que la plateforme d&apos;hébergement
          injecte réellement pour ce déploiement. Drive et Calendar n&apos;ont pas encore d&apos;identifiants branchés
          et sont honnêtement signalés comme non connectés plutôt que simulés.
        </p>
      </section>
    </div>
  );
}
