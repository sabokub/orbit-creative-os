"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useStudioBrain } from "@/contexts/StudioBrainContext";
import { getFocus, setFocus } from "@/lib/workModesClient";
import { ActiveFocus } from "@/lib/workModes/focus/contracts";
import { daysUntil, scoreAll, sortByPriority } from "@/lib/priority";
import { StudioItem, StudioItemInput } from "@/lib/types";

const PROPOSALS: Array<Pick<StudioItemInput, "title" | "description" | "category" | "estimateMinutes" | "urgency" | "impact">> = [
  {
    title: "Tester le parcours client de bout en bout",
    description: "Parcourir le choix de pièce, le brief, la sauvegarde, les étapes de commande et le suivi. Noter chaque friction et ne cocher la tâche qu'après un test réel.",
    category: "Expérience client",
    estimateMinutes: 30,
    urgency: 5,
    impact: 5,
  },
  {
    title: "Vérifier que l'offre est prête à être vendue",
    description: "Contrôler prix, périmètre par pièce, exemples de livrables, délais, mentions et CTA. Consigner ce qui manque, sans présumer que le paiement est opérationnel.",
    category: "Offre",
    estimateMinutes: 30,
    urgency: 5,
    impact: 5,
  },
  {
    title: "Sélectionner un cas démonstrateur de 24March",
    description: "Choisir une pièce et rassembler les éléments qui prouvent la valeur de la direction artistique : avant, concept, sélection et visualisation.",
    category: "Portfolio",
    estimateMinutes: 30,
    urgency: 4,
    impact: 5,
  },
  {
    title: "Définir le prochain message pour la waitlist",
    description: "Clarifier ce qui est réellement prêt, la promesse de l'offre et l'action attendue des inscrits, sans annoncer de date de lancement non validée.",
    category: "Acquisition",
    estimateMinutes: 25,
    urgency: 3,
    impact: 4,
  },
];

const INITIAL_GOAL = "Valider un parcours client 24March complet, du brief à la livraison pilote";
const INITIAL_CRITERIA = "1 parcours de commande testé de bout en bout ; offre, tarifs et livrables vérifiés ; 1 cas pilote documenté ; blocages critiques identifiés ou résolus.";
const normalize = (value: string) => value.trim().toLocaleLowerCase("fr-FR");

function isOldDeadline(item: StudioItem): boolean {
  const remaining = daysUntil(item.dueDate);
  return remaining !== null && remaining < -14;
}

function minutesLabel(min: number) {
  return min < 60 ? min + " min" : Math.floor(min / 60) + " h " + String(min % 60).padStart(2, "0");
}

export default function ExecutionPage() {
  const { items, decisions, loaded, error, createItem, updateItem } = useStudioBrain();
  const [focus, setActiveFocus] = useState<ActiveFocus | null>(null);
  const [focusError, setFocusError] = useState("");
  const [goalTitle, setGoalTitle] = useState(INITIAL_GOAL);
  const [criteria, setCriteria] = useState(INITIAL_CRITERIA);
  const [goalDate, setGoalDate] = useState("");
  const [budget, setBudget] = useState(60);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getFocus("build").then((response) => setActiveFocus(response.active)).catch((err: Error) => setFocusError(err.message));
  }, []);

  const view = useMemo(() => {
    const tasks = items.filter((item) => item.kind === "task" && item.status !== "done" && item.status !== "archived");
    const historic = tasks.filter(isOldDeadline);
    const eligible = tasks.filter((item) => item.status !== "blocked" && !isOldDeadline(item));
    const scores = scoreAll(items);
    const ordered = sortByPriority(eligible, scores).sort((a, b) => {
      const activeA = a.status === "in_progress" || a.status === "today" ? 1 : 0;
      const activeB = b.status === "in_progress" || b.status === "today" ? 1 : 0;
      return activeB - activeA || (scores.get(b.id)?.score ?? 0) - (scores.get(a.id)?.score ?? 0);
    });
    const quick = ordered.filter((item) => item.estimateMinutes <= 5);
    const candidates = ordered.filter((item) => item.estimateMinutes > 5 && item.estimateMinutes <= 30);
    let used = 0;
    const topThree: StudioItem[] = [];
    for (const task of candidates) {
      if (topThree.length >= 3 || used + task.estimateMinutes > budget) continue;
      topThree.push(task);
      used += task.estimateMinutes;
    }
    return {
      topThree,
      used,
      quick: quick.slice(0, 8),
      historic,
      long: ordered.filter((item) => item.estimateMinutes > 30),
      blocked: tasks.filter((item) => item.status === "blocked"),
      pending: decisions.filter((decision) => decision.status === "pending").length,
      titles: new Set(items.filter((item) => item.status !== "archived").map((item) => normalize(item.title))),
      taskCount: tasks.length,
    };
  }, [items, decisions, budget]);

  async function addProposal(proposal: (typeof PROPOSALS)[number]) {
    setSaving(true);
    setMessage("");
    try {
      if (view.titles.has(normalize(proposal.title))) {
        setMessage("Cette tâche existe déjà dans Studio Brain.");
        return;
      }
      await createItem({
        ...proposal,
        kind: "task",
        status: "today",
        launchCritical: true,
        dependsOn: [],
      });
      setMessage("Tâche ajoutée dans Studio Brain. Elle apparaît dans les vues d'ORBIT.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: StudioItem) {
    setSaving(true);
    setMessage("");
    try {
      await updateItem(item.id, { status: item.status === "in_progress" ? "done" : "in_progress" });
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function saveGoal() {
    if (!goalTitle.trim() || !criteria.trim() || !goalDate) return;
    setSaving(true);
    setMessage("");
    try {
      const updated = await setFocus("build", {
        title: goalTitle.trim(),
        description: "Sprint de validation du parcours commercial, pas une promesse de date de lancement.",
        targetDate: goalDate,
        successCriteria: criteria.trim(),
        currentAction: "Choisir la prochaine tâche réalisable dans Studio Brain.",
        nextAction: "Tester, mesurer et ajuster après un premier parcours réel.",
        priority: 5,
      });
      setActiveFocus(updated);
      setMessage("Objectif SMART enregistré dans le focus Build d'ORBIT.");
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1320px] space-y-5 pb-36 lg:pb-10">
      <header className="rounded-[28px] border border-black/10 bg-[#171c28] p-6 text-white sm:p-8">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c3e8a0]">ORBIT / Exécution</span>
        <h1 className="mt-3 max-w-[820px] text-3xl font-black leading-tight sm:text-5xl">Moins de listes. Plus de choses terminées.</h1>
        <p className="mt-3 max-w-[720px] text-sm text-white/65">24March Studio est en phase d'activation commerciale : la waitlist existe, mais le parcours client, l'offre et la preuve doivent être vérifiés avant de considérer le lancement comme prêt.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="rounded-full bg-white/10 px-3 py-2">✓ Waitlist en ligne</span>
          <span className="rounded-full bg-white/10 px-3 py-2">? Parcours complet à tester</span>
          <span className="rounded-full bg-white/10 px-3 py-2">? Vente réelle à confirmer</span>
        </div>
        <p className="mt-3 text-[10px] text-white/40">État de référence au 9 novembre 2026 · aucun indicateur de vente n'est déduit d'un déploiement technique.</p>
      </header>

      {(error || focusError || message) && <div role="status" className="rounded-[16px] border border-black/10 bg-white p-4 text-sm font-semibold">{error || focusError || message}</div>}

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <article className="command-card p-5 sm:p-6">
          <span className="command-label">1 / Objectif SMART</span>
          <h2 className="mt-2 text-xl font-black">Un résultat, une preuve et une date.</h2>
          {focus && (
            <div className="mt-3 rounded-[16px] bg-[#e6edcd] p-4">
              <p className="text-[10px] font-black uppercase text-black/50">Focus Build actuellement enregistré</p>
              <p className="mt-1 text-sm font-black">{focus.title}</p>
              {focus.targetDate && <p className="mt-1 text-xs font-semibold">Échéance : {focus.targetDate}</p>}
              {focus.successCriteria && <p className="mt-1 text-xs text-black/60">Preuve : {focus.successCriteria}</p>}
            </div>
          )}
          <div className="mt-4 grid gap-3">
            <label className="text-xs font-black">Résultat à atteindre
              <input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} maxLength={300} className="mt-1 block w-full rounded-[12px] border border-black/15 bg-white px-3 py-2.5 text-sm font-medium" />
            </label>
            <label className="text-xs font-black">Comment prouver qu'il est atteint ?
              <textarea value={criteria} onChange={(event) => setCriteria(event.target.value)} maxLength={2000} rows={3} className="mt-1 block w-full rounded-[12px] border border-black/15 bg-white px-3 py-2.5 text-sm font-medium" />
            </label>
            <label className="text-xs font-black">Date cible à choisir, sans la confondre avec une date publique de lancement
              <input type="date" value={goalDate} onChange={(event) => setGoalDate(event.target.value)} className="mt-1 block w-full rounded-[12px] border border-black/15 bg-white px-3 py-2.5 text-sm font-medium" />
            </label>
            {focus && <p className="text-xs text-black/55">Enregistrer un nouveau focus remplacera le focus Build actif et conservera l'ancien dans l'historique.</p>}
            <button type="button" onClick={() => void saveGoal()} disabled={saving || !goalTitle.trim() || !criteria.trim() || !goalDate} className="command-button disabled:opacity-40">Enregistrer le focus SMART</button>
          </div>
        </article>
        <article className="command-card p-5 sm:p-6">
          <span className="command-label">2 / Réalité du moment</span>
          <h2 className="mt-2 text-xl font-black">Ne pas confondre activité et résultat.</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-[14px] bg-[#edf2e5] p-3"><p className="font-black">Acquisition</p><p className="text-black/55">Waitlist publique existante. Prochaine preuve : capacité à convertir une inscription en échange utile.</p></div>
            <div className="rounded-[14px] bg-[#fff8e5] p-3"><p className="font-black">Offre</p><p className="text-black/55">Vérifier prix, périmètre et livrables avant d'annoncer une vente prête.</p></div>
            <div className="rounded-[14px] bg-[#eef7ff] p-3"><p className="font-black">Expérience client</p><p className="text-black/55">Un build technique READY ne valide pas le brief, le paiement ou la livraison.</p></div>
          </div>
          <Link href="/launch" className="mt-4 inline-block text-xs font-black underline underline-offset-4">Ouvrir la vue Lancement</Link>
        </article>
      </section>

      <section className="command-card p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><span className="command-label">3 / TAPP : tâches, actions, projets, priorités</span><h2 className="mt-1 text-2xl font-black">Ton vrai plan d'aujourd'hui</h2></div>
          <label className="text-xs font-bold">Temps disponible
            <select value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="ml-2 rounded-full border border-black/15 bg-white px-3 py-2 text-xs font-black">
              <option value={30}>30 min</option><option value={60}>1 h</option><option value={90}>1 h 30</option><option value={120}>2 h</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-black/50"><span>{view.topThree.length}/3 tâches</span><span>· {minutesLabel(view.used)} planifiées</span><span>· {view.blocked.length} blocages</span><span>· {view.pending} décisions ouvertes</span></div>
        <div className="mt-4 space-y-2.5">
          {view.topThree.map((item, index) => (
            <div key={item.id} className="flex flex-wrap items-center gap-3 rounded-[18px] border border-black/10 bg-[#fffdf8] p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#f5df75] text-sm font-black">{index + 1}</span>
              <div className="min-w-[160px] flex-1"><Link href={"/studio/items/" + encodeURIComponent(item.id)} className="text-sm font-black underline-offset-2 hover:underline">{item.title}</Link><p className="mt-1 text-[11px] text-black/45">{item.estimateMinutes} min · {item.category} · {item.status === "in_progress" ? "en cours" : "à faire"}</p></div>
              <button disabled={saving} type="button" onClick={() => void changeStatus(item)} className="rounded-full bg-[#171c28] px-4 py-2 text-xs font-black text-white disabled:opacity-40">{item.status === "in_progress" ? "Terminer ✓" : "Commencer"}</button>
            </div>
          ))}
          {loaded && !view.topThree.length && <div className="rounded-[18px] border border-dashed border-black/15 p-5 text-sm text-black/55">Pas de tâche actionnable de 5 à 30 minutes dans ce créneau. Ajoute une étape précise ci-dessous ou découpe un bloc long. Les anciennes échéances restent dans une file distincte, pas dans tes priorités du jour.</div>}
          {!loaded && <p className="text-sm text-black/45">Chargement des tâches de Studio Brain…</p>}
        </div>
        <p className="mt-3 text-xs text-black/45">Sélection issue des tâches Studio Brain. Maximum trois actions concrètes, sans tâches bloquées ni échéances anciennes de plus de 14 jours.</p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="command-card p-5">
          <span className="command-label">Actions de moins de 5 minutes</span>
          <h2 className="mt-1 text-xl font-black">À regrouper, pas à disperser.</h2>
          <div className="mt-4 space-y-2">
            {view.quick.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-[14px] bg-[#eef7ff] p-3"><Link href={"/studio/items/" + encodeURIComponent(item.id)} className="text-xs font-black">{item.title}</Link><button disabled={saving} onClick={() => void changeStatus(item)} className="rounded-full bg-white px-2.5 py-1.5 text-[10px] font-black">{item.status === "in_progress" ? "Terminer" : item.estimateMinutes + " min"}</button></div>)}
            {!view.quick.length && <p className="text-sm text-black/45">Aucune micro-action actuellement enregistrée.</p>}
          </div>
        </article>
        <article className="command-card p-5">
          <span className="command-label">À clarifier</span>
          <h2 className="mt-1 text-xl font-black">Les projets ne sont pas des tâches.</h2>
          <p className="mt-2 text-xs text-black/50">Tout bloc de plus de 30 minutes mérite d'être découpé en étapes avec un verbe, un livrable et une fin.</p>
          <div className="mt-4 space-y-2">{view.long.slice(0, 5).map((item) => <Link key={item.id} href={"/studio/items/" + encodeURIComponent(item.id)} className="flex justify-between gap-3 rounded-[14px] bg-[#fff8e5] p-3 text-xs font-black"><span>{item.title}</span><span>{minutesLabel(item.estimateMinutes)}</span></Link>)}</div>
          {!view.long.length && <p className="mt-3 text-sm text-black/45">Aucun bloc long actuellement enregistré.</p>}
        </article>
      </section>

      <section className="command-card p-5 sm:p-6">
        <span className="command-label">4 / Sprint de validation proposé</span>
        <h2 className="mt-1 text-xl font-black">La suite logique pour 24March, sans créer de doublons.</h2>
        <p className="mt-2 text-xs text-black/50">Ces quatre tâches sont des recommandations à confirmer : elles ne sont pas déclarées terminées ou en retard. Ajoute uniquement celles qui manquent dans Studio Brain.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {PROPOSALS.map((proposal) => {
            const exists = view.titles.has(normalize(proposal.title));
            return <div key={proposal.title} className="rounded-[18px] border border-black/10 bg-[#fffdf8] p-4"><div className="flex justify-between gap-2"><h3 className="text-sm font-black">{proposal.title}</h3><span className="shrink-0 text-[11px] font-black text-black/40">{proposal.estimateMinutes} min</span></div><p className="mt-2 text-xs text-black/55">{proposal.description}</p><button type="button" disabled={exists || saving || !loaded} onClick={() => void addProposal(proposal)} className="mt-3 rounded-full bg-[#e6edcd] px-3 py-2 text-xs font-black disabled:opacity-50">{exists ? "Déjà dans Studio Brain" : "Ajouter au plan"}</button></div>;
          })}
        </div>
      </section>

      {(view.historic.length > 0 || view.blocked.length > 0) && <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[22px] border border-[#e5c88f] bg-[#fff8e5] p-5"><p className="command-label">Historique à requalifier</p><h2 className="mt-2 text-xl font-black">{view.historic.length} échéance(s) dépassée(s) de plus de 14 jours</h2><p className="mt-2 text-xs text-black/55">Elles ne sont pas effacées et ne polluent plus le plan du jour. Mets-les à jour ou archive-les après vérification.</p><div className="mt-3 space-y-2">{view.historic.slice(0, 4).map((item) => <Link className="block text-xs font-black underline" key={item.id} href={"/studio/items/" + encodeURIComponent(item.id)}>{item.title} · {item.dueDate}</Link>)}</div></article>
        <article className="rounded-[22px] border border-[#f2b8cf] bg-[#fff0f5] p-5"><p className="command-label">Dépendances</p><h2 className="mt-2 text-xl font-black">{view.blocked.length} tâche(s) bloquée(s)</h2><p className="mt-2 text-xs text-black/55">Résous la dépendance plutôt que de faire semblant d'avancer sur une tâche impossible.</p><Link href="/dependencies" className="mt-4 inline-block text-xs font-black underline">Voir les blocages</Link></article>
      </section>}
    </div>
  );
}
