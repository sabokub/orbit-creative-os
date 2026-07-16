import Link from "next/link";
import { BRAND_DNA_PALETTE, DEFAULT_BRAND_PROFILE } from "@/lib/brandProfile";
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
    <section className={`command-card-flat relative overflow-hidden p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="command-label">{title}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-[13px] border border-black/10 ${accent}`}>
          <CommandIcon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 text-[13px] font-medium leading-relaxed text-black/64">{children}</div>
    </section>
  );
}

export default function BrandProfilePage() {
  const b = DEFAULT_BRAND_PROFILE;

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="command-label"><CommandIcon name="brain" className="h-3.5 w-3.5" /> Source unique de vérité</span>
          <h1 className="display-serif mt-2 text-5xl leading-[0.95]">Cerveau de marque</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-black/50">L’ADN fixe de {b.name}, injecté automatiquement dans tous les projets ORBIT.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="command-pill bg-[#c3d995]"><span className="h-2 w-2 rounded-full bg-[#628a31]" /> ADN verrouillé</span>
          <Link href="/projects/new" className="command-button"><CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet</Link>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-[24px] border border-black/12 bg-[linear-gradient(135deg,#f7f0df_0%,#e8edcf_58%,#dce8cd_100%)] p-5 shadow-[0_16px_38px_rgba(89,96,66,0.1)]">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border-[30px] border-white/35" />
        <div className="relative grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
          <div>
            <p className="command-label">Positionnement central</p>
            <h2 className="display-serif mt-3 max-w-5xl text-3xl leading-[1.02] sm:text-5xl">{b.positioning}</h2>
          </div>
          <div className="flex max-w-md flex-wrap gap-2">
            {b.messagePillars.map((pillar) => (
              <span key={pillar} className="rounded-full border border-black/10 bg-white/58 px-3 py-2 text-[11px] font-bold text-black/68 backdrop-blur">{pillar}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-12">
        <Section title="Fondations" icon="strategy" accent="bg-[#f5df75]" className="xl:col-span-7">
          <p className="text-sm font-black leading-snug text-black">{b.activity}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="rounded-[16px] bg-white/65 p-3"><p className="command-label">Offre</p><p className="mt-2">{b.offer}</p></div>
            <div className="rounded-[16px] bg-[#bdd8f8]/45 p-3"><p className="command-label">Promesse</p><p className="mt-2">{b.brandPromise}</p></div>
          </div>
        </Section>

        <Section title="Cible" icon="focus" accent="bg-[#f2b8cf]" className="xl:col-span-5">
          <p className="text-sm font-black leading-snug text-black">{b.audience}</p>
          <p className="mt-4 rounded-[16px] border border-black/10 bg-white/65 p-3 text-[11px] font-bold text-black/48">Il faut sembler immédiatement juste à la bonne personne, pas plaire à tout le monde.</p>
        </Section>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Section title="ADN visuel" icon="sparkles" accent="bg-[#cfc5f4]"><p>{b.visualDirection}</p></Section>
        <Section title="Ton de voix" icon="content" accent="bg-[#f1a36f]"><p>{b.toneOfVoice}</p></Section>
        <Section title="Couleurs" icon="image" accent="bg-[#bdd8f8]">
          <p>{b.colors}</p>
          <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {BRAND_DNA_PALETTE.map((color) => (
              <div key={color.hex} className="flex flex-col items-center gap-1.5">
                <span
                  className="h-12 w-full rounded-[10px] border border-black/10"
                  style={{ backgroundColor: color.hex }}
                  title={`${color.label} — ${color.hex}`}
                />
                <p className="text-center text-[9px] font-black leading-tight text-black/55">{color.label}</p>
                <p className="text-center text-[8px] font-bold uppercase leading-tight text-black/35">{color.hex}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Section title="Direction image" icon="image" accent="bg-[#f2b8cf]">
          <div className="space-y-3">
            <div><p className="command-label">Photographie</p><p className="mt-2">{b.photographyDirection}</p></div>
            <div className="rounded-[16px] bg-white/70 p-3"><p className="command-label">Règles de prompt</p><p className="mt-2">{b.imagePromptRules}</p></div>
          </div>
        </Section>
        <Section title="Direction du site" icon="website" accent="bg-[#bdd8f8]">
          <p className="text-sm font-black leading-snug text-black">{b.websiteDirection}</p>
          <div className="mt-4 rounded-[16px] border border-black/10 bg-[#f5df75]/55 p-3">
            <p className="command-label">Test du site</p>
            <p className="display-serif mt-2 text-xl italic">« Je veux vivre là. » Puis : « J’ai besoin de ce studio. »</p>
          </div>
        </Section>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <Section title="Direction du contenu" icon="content" accent="bg-[#c3d995]" className="xl:col-span-7"><p className="text-sm font-black leading-snug text-black">{b.contentDirection}</p></Section>
        <Section title="À éviter" icon="critic" accent="bg-[#ffdada]" className="xl:col-span-5">
          <div className="flex flex-wrap gap-1.5">
            {b.avoid.map((item) => <span key={item} className="rounded-full border border-black/10 bg-white/70 px-2.5 py-1.5 text-[11px] font-bold text-black/58">× {item}</span>)}
          </div>
        </Section>
      </div>

      <section className="rounded-[22px] border border-black/12 bg-[#c3d995]/75 p-5">
        <span className="command-label">Définition de la réussite</span>
        <p className="display-serif mt-2 max-w-5xl text-2xl leading-tight sm:text-4xl">{b.successCriteria}</p>
      </section>
    </div>
  );
}
