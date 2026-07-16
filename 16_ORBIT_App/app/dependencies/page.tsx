"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStudioBrain } from "@/contexts/StudioBrainContext";
import { countBlockedBy, scoreAll, sortByPriority } from "@/lib/priority";
import { tierStyleForPriority } from "@/lib/importanceColor";
import ImportanceMark from "@/components/ImportanceMark";

const STATUS_LABEL: Record<string, string> = {
  backlog: "À faire",
  today: "Aujourd'hui",
  in_progress: "En cours",
  blocked: "Bloqué",
  done: "Terminé",
  archived: "Archivé",
};

export default function DependenciesPage() {
  const { items, loaded, error } = useStudioBrain();
  const active = useMemo(() => items.filter((it) => it.status !== "archived"), [items]);
  const scores = useMemo(() => scoreAll(active), [active]);
  const withEdges = useMemo(() => active.filter((it) => it.dependsOn.length > 0), [active]);
  const ranked = useMemo(
    () => sortByPriority(active.filter((it) => it.status !== "done"), scores),
    [active, scores]
  );
  const byId = useMemo(() => new Map(active.map((it) => [it.id, it])), [active]);

  return (
    <div className="space-y-4 pb-36 lg:pb-8">
      <header>
        <p className="command-label">Graphe & priorité</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Dépendances & priorités</h1>
        <p className="mt-1 text-sm text-black/48">
          Comprendre ce qui bloque, ce qui débloque le reste et pourquoi ORBIT recommande cet ordre.
        </p>
      </header>

      {error && <div className="rounded-[20px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="command-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="command-label">Graphe opérationnel</p>
              <h2 className="mt-1 text-xl font-black">Chaîne de dépendances</h2>
            </div>
            <span className="command-pill bg-[#f9d9e6]">{withEdges.length} lié(e)s</span>
          </div>
          <div className="mt-5 space-y-3">
            {loaded &&
              withEdges.map((item) => {
                const blockers = item.dependsOn.map((id) => byId.get(id)).filter((b): b is NonNullable<typeof b> => Boolean(b));
                const stillBlocked = blockers.some((b) => b.status !== "done");
                return (
                  <div
                    key={item.id}
                    className={`rounded-[20px] border p-4 ${
                      item.status === "done"
                        ? "border-[#9dbd61]/25 bg-[#edf2e5]"
                        : stillBlocked
                        ? "border-[#e9a9bd]/35 bg-[#fff0f5]"
                        : "border-black/8 bg-white/75"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.08em] text-black/42">
                      {blockers.map((b) => (
                        <span key={b.id} className="rounded-full bg-white px-2 py-1">
                          {b.title}
                        </span>
                      ))}
                      <span>→ débloque →</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{item.title}</p>
                        <p className="mt-1 text-[11px] text-black/45">{item.description}</p>
                      </div>
                      <span className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[9px] font-black">
                        {STATUS_LABEL[item.status]}
                      </span>
                    </div>
                    {stillBlocked && (
                      <p className="mt-3 text-[10px] font-black uppercase text-[#b45d7a]">
                        Bloqué tant que « {blockers.filter((b) => b.status !== "done").map((b) => b.title).join(", ")} » n&apos;est pas
                        terminé.
                      </p>
                    )}
                  </div>
                );
              })}
            {loaded && !withEdges.length && <p className="text-sm text-black/45">Aucune dépendance déclarée pour l&apos;instant.</p>}
          </div>
        </article>

        <article className="command-card p-5">
          <div>
            <p className="command-label">Moteur explicable</p>
            <h2 className="mt-1 text-xl font-black">Ordre recommandé</h2>
          </div>
          <div className="mt-4 space-y-3">
            {loaded &&
              ranked.map((item, index) => {
                const result = scores.get(item.id)!;
                const dependents = countBlockedBy(item.id, active);
                const tier = tierStyleForPriority(result);
                return (
                  <Link
                    href={item.kind === "task" ? "/studio/content" : "/studio/content"}
                    key={item.id}
                    className={`block rounded-[20px] border border-black/8 ${tier.cardBorder} ${tier.cardTint} bg-white/75 p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-[15px] bg-[#f5df75] text-lg font-black">
                        {result.score}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black">
                          {index + 1}. {item.title}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-[10px] text-black/42">
                          <ImportanceMark shape={tier.mark} color={tier.markColor} />
                          <span className="font-black uppercase tracking-[0.06em]">{tier.tag}</span> ·{" "}
                          {result.explanation} · débloque {dependents} élément(s)
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/7">
                      <div className="h-full rounded-full bg-[#9dbd61]" style={{ width: `${result.score}%` }} />
                    </div>
                  </Link>
                );
              })}
            {loaded && !ranked.length && <p className="text-sm text-black/45">Rien à prioriser — tout est fait.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}
