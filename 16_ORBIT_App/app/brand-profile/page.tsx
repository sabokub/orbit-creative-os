import Link from "next/link";
import { DEFAULT_BRAND_PROFILE } from "@/lib/brandProfile";
import CommandIcon, { CommandIconName } from "@/components/CommandIcon";

function Section({
  title,
  icon,
  accent,
  children,
  className = "",
}: {
  title: string;
  icon: CommandIconName;
  accent: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`command-card-flat relative overflow-hidden p-5 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="command-label">{title}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-[15px] border border-black/10 ${accent}`}>
          <CommandIcon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="mt-5 text-sm font-medium leading-relaxed text-black/66">{children}</div>
    </section>
  );
}

export default function BrandProfilePage() {
  const b = DEFAULT_BRAND_PROFILE;

  return (
    <div className="space-y-5 sm:space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="command-label"><CommandIcon name="brain" className="h-3.5 w-3.5" /> Source unique de vérité</span>
          <h1 className="display-serif mt-3 text-5xl leading-[0.95] sm:text-7xl">Le <span className="italic">cerveau de marque.</span></h1>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-black/52 sm:text-base">
            L’identité fixe de {b.name}. Tous les projets ORBIT héritent de ce noyau avant d’ajouter leur contexte spécifique.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="command-pill bg-[#c3d995]"><span className="h-2 w-2 rounded-full bg-[#628a31]" /> ADN verrouillé</span>
          <Link href="/projects/new" className="command-button"><CommandIcon name="plus" className="h-4 w-4" /> Utiliser ce cerveau</Link>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-[34px] border border-black/12 bg-[#151515] p-6 text-white shadow-[0_24px_60px_rgba(21,21,21,0.16)] sm:p-8">
        <div className="dot-grid absolute inset-0 opacity-[0.1]" />
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#bdd8f8]" />
        <div className="absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-[#f2b8cf]" />
        <div className="relative max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/48">Positionnement central</p>
          <h2 className="display-serif mt-4 text-4xl leading-[1.02] sm:text-6xl">{b.positioning}</h2>
          <div className="mt-7 flex flex-wrap gap-2">
            {b.messagePillars.map((pillar) => (
              <span key={pillar} className="rounded-full border border-white/16 bg-white/10 px-3 py-2 text-xs font-bold text-white/78 backdrop-blur">{pillar}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Fondations de marque" icon="strategy" accent="bg-[#f5df75]" className="xl:col-span-7">
          <p className="text-base font-black leading-snug text-black">{b.activity}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] bg-white/65 p-4"><p className="command-label">Offre</p><p className="mt-2">{b.offer}</p></div>
            <div className="rounded-[20px] bg-[#bdd8f8]/45 p-4"><p className="command-label">Promesse</p><p className="mt-2">{b.brandPromise}</p></div>
          </div>
        </Section>

        <Section title="Cible" icon="focus" accent="bg-[#f2b8cf]" className="xl:col-span-5">
          <p className="text-base font-black leading-snug text-black">{b.audience}</p>
          <p className="mt-5 rounded-[20px] border border-black/10 bg-white/65 p-4 text-xs font-bold text-black/48">Le but n’est pas de plaire à tout le monde. Il faut sembler immédiatement juste à la bonne personne.</p>
        </Section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Section title="ADN visuel" icon="sparkles" accent="bg-[#cfc5f4]">
          <p>{b.visualDirection}</p>
        </Section>
        <Section title="Ton de voix" icon="content" accent="bg-[#f1a36f]">
          <p>{b.toneOfVoice}</p>
        </Section>
        <Section title="Comportement des couleurs" icon="image" accent="bg-[#bdd8f8]">
          <p>{b.colors}</p>
          <div className="mt-5 flex gap-2">
            {["#BDD8F8", "#C3D995", "#F2B8CF", "#F5DF75", "#151515"].map((color) => (
              <span key={color} className="h-10 flex-1 rounded-[13px] border border-black/10" style={{ backgroundColor: color }} title={color} />
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="Direction image" icon="image" accent="bg-[#f2b8cf]">
          <div className="space-y-4">
            <div><p className="command-label">Photographie</p><p className="mt-2">{b.photographyDirection}</p></div>
            <div className="rounded-[20px] bg-white/70 p-4"><p className="command-label">Règles de prompt</p><p className="mt-2">{b.imagePromptRules}</p></div>
          </div>
        </Section>
        <Section title="Direction du site" icon="website" accent="bg-[#bdd8f8]">
          <p className="text-base font-black leading-snug text-black">{b.websiteDirection}</p>
          <div className="mt-5 rounded-[20px] border border-black/10 bg-[#151515] p-4 text-white">
            <p className="text-[10px] font-black uppercase tracking-[0.13em] text-white/42">Test du site</p>
            <p className="display-serif mt-2 text-2xl italic">« Je veux vivre là. » Puis : « J’ai besoin de ce studio. »</p>
          </div>
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-12">
        <Section title="Direction du contenu" icon="content" accent="bg-[#c3d995]" className="xl:col-span-7">
          <p className="text-base font-black leading-snug text-black">{b.contentDirection}</p>
        </Section>
        <Section title="Liste à éviter" icon="critic" accent="bg-[#ffdada]" className="xl:col-span-5">
          <div className="flex flex-wrap gap-2">
            {b.avoid.map((item) => (
              <span key={item} className="rounded-full border border-black/10 bg-white/70 px-3 py-2 text-xs font-bold text-black/58">× {item}</span>
            ))}
          </div>
        </Section>
      </div>

      <section className="rounded-[32px] border border-black/12 bg-[#c3d995] p-6 sm:p-8">
        <span className="command-label">Définition de la réussite</span>
        <p className="display-serif mt-3 max-w-5xl text-3xl leading-tight sm:text-5xl">{b.successCriteria}</p>
      </section>
    </div>
  );
}
