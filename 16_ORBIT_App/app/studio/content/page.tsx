"use client";

import { useMemo, useState } from "react";
import { CONTENT_CHANNELS, ItemStatus, StudioItem } from "@/lib/types";
import { scoreAll, sortByPriority } from "@/lib/priority";
import PanelTitle from "@/components/PanelTitle";
import StudioItemCard from "@/components/StudioItemCard";
import { useStudioBrain } from "@/contexts/StudioBrainContext";

export default function ContentBankPage() {
  const { items, loaded, error, updateItem, archiveItem } = useStudioBrain();
  const [channelFilter, setChannelFilter] = useState<string>("all");

  const content = items.filter((it) => it.kind === "content" && it.status !== "archived" && it.status !== "done");
  const scores = useMemo(() => scoreAll(items), [items]);
  const filtered = channelFilter === "all" ? content : content.filter((it) => it.channel === channelFilter);
  const sorted = sortByPriority(filtered, scores);

  const channelCounts = CONTENT_CHANNELS.map((channel) => ({
    channel,
    count: content.filter((it) => it.channel === channel).length,
  })).filter((c) => c.count > 0);

  async function handleStatusChange(id: string, status: ItemStatus) {
    await updateItem(id, { status }).catch(() => {});
  }

  async function handleArchive(id: string) {
    await archiveItem(id).catch(() => {});
  }

  function dependencyTitles(item: StudioItem): string[] {
    return item.dependsOn
      .map((depId) => items.find((it) => it.id === depId)?.title)
      .filter((title): title is string => Boolean(title));
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-4 pb-8">
      <header>
        <h1 className="text-2xl font-black tracking-[-0.03em] sm:text-3xl">Banque de contenu</h1>
        <p className="mt-1 text-sm font-medium text-black/52">
          {content.length} contenu(s) actif(s), même modèle de priorité et de cycle de vie que les tâches.
        </p>
      </header>

      {error && <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}

      <section className="command-card p-5 sm:p-6">
        <PanelTitle title="Filtrer par canal" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setChannelFilter("all")}
            className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${
              channelFilter === "all" ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/55"
            }`}
          >
            Tous · {content.length}
          </button>
          {channelCounts.map(({ channel, count }) => (
            <button
              key={channel}
              type="button"
              onClick={() => setChannelFilter(channel)}
              className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] ${
                channelFilter === channel ? "border-black bg-black text-white" : "border-black/10 bg-white text-black/55"
              }`}
            >
              {channel} · {count}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {!loaded && [1, 2, 3, 4].map((i) => <div key={i} className="h-40 animate-pulse rounded-[20px] bg-black/5" />)}
        {loaded &&
          sorted.map((item) => (
            <StudioItemCard
              key={item.id}
              item={item}
              priority={scores.get(item.id)!}
              dependencyTitles={dependencyTitles(item)}
              onStatusChange={handleStatusChange}
              onArchive={handleArchive}
            />
          ))}
        {loaded && !sorted.length && (
          <div className="col-span-full flex min-h-[120px] items-center justify-center rounded-[20px] border border-dashed border-black/15 text-xs font-semibold text-black/40">
            Aucun contenu pour ce filtre.
          </div>
        )}
      </section>
    </div>
  );
}
