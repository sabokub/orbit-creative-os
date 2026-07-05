import { DEFAULT_BRAND_PROFILE } from "@/lib/brandProfile";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h2>
      <div className="text-sm text-neutral-800 dark:text-neutral-200">{children}</div>
    </section>
  );
}

export default function BrandProfilePage() {
  const b = DEFAULT_BRAND_PROFILE;
  return (
    <div className="space-y-6">
      <div>
        <span className="rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
          Read-only — v1
        </span>
        <h1 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-100">{b.name}</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Identité de marque globale, appliquée par défaut à tous les projets.
        </p>
      </div>

      <Section title="Brand foundations">
        <p className="mb-2">{b.activity}</p>
        <p className="mb-2"><span className="text-neutral-500">Offer : </span>{b.offer}</p>
        <p className="mb-2"><span className="text-neutral-500">Brand promise : </span>{b.brandPromise}</p>
        <ul className="list-disc space-y-1 pl-5">
          {b.messagePillars.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </Section>

      <Section title="Audience">
        <p>{b.audience}</p>
      </Section>

      <Section title="Positioning">
        <p>{b.positioning}</p>
      </Section>

      <Section title="Visual DNA">
        <p>{b.visualDirection}</p>
      </Section>

      <Section title="Tone of voice">
        <p>{b.toneOfVoice}</p>
      </Section>

      <Section title="Colors">
        <p>{b.colors}</p>
      </Section>

      <Section title="Image direction">
        <p className="mb-2"><span className="text-neutral-500">Photography : </span>{b.photographyDirection}</p>
        <p><span className="text-neutral-500">Image prompt rules : </span>{b.imagePromptRules}</p>
      </Section>

      <Section title="Content direction">
        <p>{b.contentDirection}</p>
      </Section>

      <Section title="Website direction">
        <p>{b.websiteDirection}</p>
      </Section>

      <Section title="Avoid list">
        <ul className="list-disc space-y-1 pl-5">
          {b.avoid.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </Section>

      <Section title="Success criteria">
        <p>{b.successCriteria}</p>
      </Section>
    </div>
  );
}
