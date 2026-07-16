"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateProjectInput, createProject } from "@/lib/storage";
import { WorkflowType } from "@/lib/types";
import { DEFAULT_BRAND_PROFILE, WORKFLOW_TYPE_LABELS } from "@/lib/brandProfile";
import CommandIcon, { CommandIconName } from "./CommandIcon";

const WORKFLOW_OPTIONS: WorkflowType[] = ["website", "content", "images", "review", "brand-kit"];

const WORKFLOW_META: Record<WorkflowType, { icon: CommandIconName; accent: string; description: string }> = {
  website: { icon: "website", accent: "bg-[#bdd8f8]", description: "Structure, textes et direction de page" },
  content: { icon: "content", accent: "bg-[#f1a36f]", description: "Accroches, formats et système de publication" },
  images: { icon: "image", accent: "bg-[#cfc5f4]", description: "Briefs visuels et prompts de production" },
  review: { icon: "critic", accent: "bg-[#c3d995]", description: "Contrôle qualité et corrections prioritaires" },
  "brand-kit": { icon: "brain", accent: "bg-[#f5df75]", description: "Fondations de marque et ADN visuel" },
};

const SAMPLE: CreateProjectInput = {
  name: "Homepage 24March Studio",
  workflowType: "website",
  projectGoal: "Créer la structure et les textes de la homepage du site.",
  specificContext:
    "Le site doit présenter le studio, sa méthode, ses offres, son univers visuel, et donner envie de réserver un audit ou une prestation.",
  deliverableType: "Homepage complète avec hero, sections, CTA, FAQ et prompts image.",
  references: "Luxe éditorial chic, collage scrapbook premium, intérieurs habités et désirables.",
  constraints: "Pas de rendu SaaS, pas de beige archi générique, pas de packs ni d'ambiances.",
  channels: "Site internet",
  format: "Markdown",
  successCriteria:
    "Le visiteur pense d'abord : ‘Je veux vivre là’, puis : ‘J'ai besoin de ce studio’.",
};

function emptyInput(): CreateProjectInput {
  return {
    name: "",
    workflowType: "website",
    projectGoal: "",
    specificContext: "",
    deliverableType: "",
    references: "",
    constraints: "",
    channels: "Instagram, TikTok, Pinterest, site internet",
    format: "Markdown",
    successCriteria: "",
  };
}

function FormField({
  label,
  hint,
  wide = false,
  children,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="mb-2 flex items-end justify-between gap-3">
        <label className="text-sm font-black tracking-[-0.015em]">{label}</label>
        {hint && <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-black/34">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function IntakeForm() {
  const router = useRouter();
  const [input, setInput] = useState<CreateProjectInput>(emptyInput());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);

  function update<K extends keyof CreateProjectInput>(key: K, value: CreateProjectInput[K]) {
    setInput((previous) => ({ ...previous, [key]: value }));
  }

  async function submit() {
    if (!input.name.trim()) {
      setError("Le nom du projet est obligatoire.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const project = await createProject(input);
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <aside className="space-y-4 xl:col-span-4">
        <section className="command-card relative overflow-hidden p-5 sm:p-6">
          <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full border-[22px] border-[#bdd8f8]/60" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="command-label">ADN hérité</span>
              <span className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 bg-[#bdd8f8]"><CommandIcon name="brain" className="h-5 w-5" /></span>
            </div>
            <h2 className="display-serif mt-5 text-4xl">{DEFAULT_BRAND_PROFILE.name}</h2>
            <p className="mt-2 text-sm font-medium leading-relaxed text-black/50">Le contexte fixe derrière chaque livrable. Tu ajoutes seulement ce qui est spécifique à ce projet.</p>

            <button
              type="button"
              onClick={() => setBrandOpen((value) => !value)}
              className="mt-5 flex w-full items-center justify-between rounded-[18px] border border-black/10 bg-white/65 px-4 py-3 text-left text-xs font-black"
            >
              <span>{brandOpen ? "Masquer l’ADN hérité" : "Prévisualiser l’ADN hérité"}</span>
              <CommandIcon name={brandOpen ? "close" : "plus"} className="h-4 w-4" />
            </button>

            {brandOpen && (
              <div className="mt-3 space-y-3 rounded-[20px] border border-black/10 bg-[#f4efdc] p-4">
                <div><p className="text-[9px] font-black uppercase tracking-[0.13em] text-black/40">Positionnement</p><p className="mt-1 text-xs font-semibold leading-relaxed text-black/68">{DEFAULT_BRAND_PROFILE.positioning}</p></div>
                <div><p className="text-[9px] font-black uppercase tracking-[0.13em] text-black/40">Cible</p><p className="mt-1 text-xs font-semibold leading-relaxed text-black/68">{DEFAULT_BRAND_PROFILE.audience}</p></div>
                <div><p className="text-[9px] font-black uppercase tracking-[0.13em] text-black/40">À éviter</p><p className="mt-1 text-xs font-semibold leading-relaxed text-black/68">{DEFAULT_BRAND_PROFILE.avoid.join(" · ")}</p></div>
              </div>
            )}

            <Link href="/brand-profile" className="mt-4 inline-flex items-center gap-2 text-xs font-black underline decoration-2 underline-offset-4">
              Ouvrir le cerveau de marque complet <CommandIcon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="rounded-[28px] border border-black/12 bg-[#f5df75] p-5 sm:p-6">
          <span className="command-label">Démarrage rapide</span>
          <h3 className="display-serif mt-3 text-3xl">Évite la page blanche.</h3>
          <p className="mt-2 text-sm font-medium leading-relaxed text-black/55">Charge l’exemple réel de la homepage 24March, puis modifie uniquement ce qui a changé.</p>
          <button type="button" onClick={() => setInput(SAMPLE)} className="command-button command-button-soft mt-5 w-full bg-white/70">
            <CommandIcon name="sparkles" className="h-4 w-4" /> Charger l’exemple de homepage
          </button>
        </section>
      </aside>

      <section className="command-card p-5 sm:p-7 xl:col-span-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="command-label">Contexte du projet</span>
            <h2 className="display-serif mt-2 text-4xl sm:text-5xl">Qu’est-ce qu’on construit ?</h2>
          </div>
          <span className="command-pill">Étape 01 / Brief</span>
        </div>

        <div className="mt-7">
          <p className="mb-3 text-sm font-black tracking-[-0.015em]">Choisis le premier moteur</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {WORKFLOW_OPTIONS.map((workflow) => {
              const meta = WORKFLOW_META[workflow];
              const selected = input.workflowType === workflow;
              return (
                <button
                  key={workflow}
                  type="button"
                  onClick={() => update("workflowType", workflow)}
                  className={`min-h-[104px] rounded-[20px] border p-3 text-left ${selected ? `border-black ${meta.accent} shadow-md` : "border-black/10 bg-white/55 hover:bg-white"}`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-[13px] border border-black/10 text-black ${selected ? "bg-white/70" : meta.accent}`}><CommandIcon name={meta.icon} className="h-4 w-4" /></span>
                  <p className="mt-3 text-xs font-black leading-tight text-black">{WORKFLOW_TYPE_LABELS[workflow]}</p>
                  <p className="mt-1 text-[9px] font-semibold leading-snug text-black/45">{meta.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField label="Nom du projet" hint="Obligatoire" wide>
            <input className="px-4 py-3 text-sm font-semibold placeholder:text-black/25" placeholder="Ex. Campagne de lancement 24March Studio" value={input.name} onChange={(event) => update("name", event.target.value)} />
          </FormField>

          <FormField label="Objectif du projet" hint="Pourquoi" wide>
            <textarea rows={3} className="px-4 py-3 text-sm font-semibold placeholder:text-black/25" placeholder="Qu’est-ce que ce projet doit accomplir ?" value={input.projectGoal} onChange={(event) => update("projectGoal", event.target.value)} />
          </FormField>

          <FormField label="Contexte spécifique" hint="Situation" wide>
            <textarea rows={4} className="px-4 py-3 text-sm font-semibold placeholder:text-black/25" placeholder="Que se passe-t-il, pour qui et à quelle étape ?" value={input.specificContext} onChange={(event) => update("specificContext", event.target.value)} />
          </FormField>

          <FormField label="Livrable attendu" hint="Quoi">
            <input className="px-4 py-3 text-sm font-semibold placeholder:text-black/25" placeholder="Homepage, guide, campagne…" value={input.deliverableType} onChange={(event) => update("deliverableType", event.target.value)} />
          </FormField>

          <FormField label="Format de livraison" hint="Sortie">
            <input className="px-4 py-3 text-sm font-semibold placeholder:text-black/25" value={input.format} onChange={(event) => update("format", event.target.value)} />
          </FormField>

          <FormField label="Références" hint="À viser">
            <textarea rows={3} className="px-4 py-3 text-sm font-semibold placeholder:text-black/25" placeholder="Liens, campagnes, références visuelles…" value={input.references} onChange={(event) => update("references", event.target.value)} />
          </FormField>

          <FormField label="Contraintes" hint="À éviter">
            <textarea rows={3} className="px-4 py-3 text-sm font-semibold placeholder:text-black/25" placeholder="Qu’est-ce qui ne doit surtout pas arriver ?" value={input.constraints} onChange={(event) => update("constraints", event.target.value)} />
          </FormField>

          <FormField label="Canaux" hint="Où">
            <input className="px-4 py-3 text-sm font-semibold placeholder:text-black/25" value={input.channels} onChange={(event) => update("channels", event.target.value)} />
          </FormField>

          <FormField label="Critères de réussite" hint="Définition du résultat" wide>
            <textarea rows={3} className="px-4 py-3 text-sm font-semibold placeholder:text-black/25" placeholder="Qu’est-ce qui doit être vrai pour que ce livrable soit validé ?" value={input.successCriteria} onChange={(event) => update("successCriteria", event.target.value)} />
          </FormField>
        </div>

        {error && <p className="mt-5 rounded-[18px] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{error}</p>}

        <div className="mt-7 flex flex-col gap-3 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md text-xs font-semibold leading-relaxed text-black/42">Rien n’est généré ni sauvegardé sans ta validation. Cette étape crée l’espace de travail et son brief réutilisable.</p>
          <button onClick={submit} disabled={submitting} className="command-button min-w-[190px] disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? <><CommandIcon name="clock" className="h-4 w-4" /> Création…</> : <><CommandIcon name="arrow" className="h-4 w-4" /> Créer l’espace de travail</>}
          </button>
        </div>
      </section>
    </div>
  );
}
