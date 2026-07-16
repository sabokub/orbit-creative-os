"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Project, Stage, WorkflowStep } from "@/lib/types";
import { listProjects } from "@/lib/storage";
import ProjectCard from "@/components/ProjectCard";
import CommandIcon, { CommandIconName } from "@/components/CommandIcon";

const LAUNCH_DATE = new Date("2026-09-01T09:00:00+02:00");

const STAGE_PROGRESS: Record<Stage, number> = {
  brief: 12,
  strategy: 25,
  creative: 40,
  website: 58,
  content: 72,
  images: 84,
  review: 94,
  exported: 100,
};

const WORKFLOWS: Array<{
  step: WorkflowStep;
  title: string;
  description: string;
  icon: CommandIconName;
  accent: string;
}> = [
  { step: "strategy", title: "Stratégie de marque", description: "Positionnement, promesse, cible et décisions.", icon: "strategy", accent: "bg-[#f5df75]" },
  { step: "creative", title: "Direction créative", description: "Territoire visuel, styling et direction artistique.", icon: "sparkles", accent: "bg-[#f2b8cf]" },
  { step: "website", title: "Studio site internet", description: "Structure, textes, UX et sections visuelles.", icon: "website", accent: "bg-[#bdd8f8]" },
  { step: "content", title: "Studio de contenu", description: "Accroches, formats, scripts et système de publication.", icon: "content", accent: "bg-[#f1a36f]" },
  { step: "images", title: "Laboratoire visuel", description: "Architecture de prompts et briefs de production image.", icon: "image", accent: "bg-[#cfc5f4]" },
  { step: "review", title: "Orbit Critic", description: "Noter, diagnostiquer et corriger avant publication.", icon: "critic", accent: "bg-[#c3d995]" },
];

const LAUNCH_TASKS = [
  { label: "Verrouiller la direction de la homepage", status: "en cours", done: false },
  { label: "Terminer le guide client", status: "priorité", done: false },
  { label: "Construire la séquence de contenu du lancement", status: "ensuite", done: false },
  { label: "Connecter le parcours de la liste d’attente", status: "prêt", done: true },
];

function MetricCard({
  label,
  value,
  note,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: CommandIconName;
  accent: string;
}) {
  return (
    <div className="command-card-flat flex min-h-[140px] flex-col justify-between p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="command-label">{label}</span>
        <span className={`flex h-10 w-10 items-center justify-center rounded-[15px] border border-black/10 ${accent}`}>
          <CommandIcon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="mt-5">
        <p className="display-serif text-4xl leading-none sm:text-[44px]">{value}</p>
        <p className="mt-2 text-xs font-semibold text-black/48">{note}</p>
      </div>
    </div>
  );
}

function LoadingCard() {
  return <div className="h-48 animate-pulse rounded-[26px] border border-black/5 bg-white/45" />;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [daysUntilLaunch, setDaysUntilLaunch] = useState<number | null>(null);

  useEffect(() => {
    setDaysUntilLaunch(Math.max(0, Math.ceil((LAUNCH_DATE.getTime() - Date.now()) / 86_400_000)));
    listProjects()
      .then((items) => {
        setProjects(items);
        setLoaded(true);
      })
      .catch((err) => {
        setError((err as Error).message);
        setLoaded(true);
      });
  }, []);

  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);
  const totalOutputs = projects.reduce((total, project) => total + Object.keys(project.outputs).length, 0);
  const totalReviews = projects.reduce((total, project) => total + project.reviews.length, 0);
  const needsAttention = projects.reduce(
    (total, project) => total + project.reviews.filter((review) => review.status === "Needs revision" || review.status === "Blocked").length,
    0
  );
  const totalExports = projects.reduce((total, project) => total + project.exports.length, 0);
  const averageProgress = projects.length
    ? Math.round(projects.reduce((total, project) => total + STAGE_PROGRESS[project.stage], 0) / projects.length)
    : 0;
  const nextProject = recentProjects[0];

  return (
    <div className="space-y-5 sm:space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="command-label"><span className="h-2 w-2 rounded-full bg-[#78a34d]" /> ORBIT est en ligne</div>
          <h1 className="display-serif mt-3 max-w-3xl text-[42px] leading-[0.98] sm:text-6xl lg:text-[68px]">
            Salut Sab, <span className="italic">on construit la suite.</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-black/52 sm:text-base">
            Tout 24March Studio au même endroit : marque, site, contenu, visuels, relectures et lancement.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/brand-profile" className="command-button command-button-soft">
            <CommandIcon name="brain" className="h-4 w-4" /> Cerveau de marque
          </Link>
          <Link href="/projects/new" className="command-button">
            <CommandIcon name="plus" className="h-4 w-4" /> Créer
          </Link>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="relative min-h-[340px] overflow-hidden rounded-[34px] border border-black/12 bg-[linear-gradient(135deg,#f7f0df_0%,#e8edcf_58%,#dce8cd_100%)] p-5 text-[#20231b] shadow-[0_24px_65px_rgba(89,96,66,0.14)] sm:p-7 xl:col-span-8">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-[42%] border border-[#8fa16d]/25" />
          <div className="absolute -right-12 -top-16 h-64 w-64 rounded-[42%] border border-[#8fa16d]/20" />
          <div className="absolute bottom-0 left-[46%] h-28 w-52 rounded-t-[50px] border border-[#8fa16d]/18" />
          <div className="absolute bottom-7 right-7 hidden rotate-6 rounded-[20px] border border-black/12 bg-[#f5df75] px-5 py-4 text-black shadow-[0_14px_30px_rgba(109,91,25,0.18)] sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.15em]">note pour moi</p>
            <p className="mt-1 max-w-[160px] text-sm font-black leading-tight">Le goût d’abord. Le système ensuite. Jamais de panique.</p>
          </div>

          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between gap-4">
              <span className="rounded-full border border-black/12 bg-white/42 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] backdrop-blur">24March Studio / Construction</span>
              <span className="flex h-11 w-11 rotate-6 items-center justify-center rounded-[16px] border border-black/10 bg-[#fffdf8]/85 text-black shadow-sm">
                <CommandIcon name="launch" className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-12 max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/48">Compte à rebours du lancement</p>
              <div className="mt-2 flex items-end gap-3">
                <span className="display-serif text-[88px] leading-[0.82] sm:text-[116px]">{daysUntilLaunch ?? "—"}</span>
                <span className="mb-2 text-sm font-black uppercase tracking-[0.14em] text-black/62">jours<br />restants</span>
              </div>
              <div className="mt-7 max-w-md">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.13em] text-black/48">
                  <span>Avancement global</span><span>{averageProgress}%</span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full border border-black/12 bg-white/48">
                  <div className="h-full rounded-full bg-[#88a45f] transition-all duration-500" style={{ width: `${averageProgress}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="command-card relative overflow-hidden p-5 sm:p-6 xl:col-span-4">
          <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full border-[26px] border-[#f2b8cf]/55" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="command-label">Priorités du jour</span>
              <span className="command-pill bg-[#f5df75]">03 priorités</span>
            </div>
            <h2 className="display-serif mt-5 text-4xl leading-[0.98]">Ne fais pas tout. Fais <span className="italic squiggle">ce qui compte.</span></h2>
            <div className="mt-7 space-y-2.5">
              {[
                "Finaliser le système visuel de la homepage",
                "Transformer le guide en ressource de lancement",
                "Préparer la prochaine vidéo fondatrice",
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-[18px] border border-black/10 bg-white/60 p-3">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] text-xs font-black ${index === 0 ? "bg-[#bdd8f8]" : index === 1 ? "bg-[#c3d995]" : "bg-[#f2b8cf]"}`}>0{index + 1}</span>
                  <p className="text-sm font-bold leading-tight">{item}</p>
                </div>
              ))}
            </div>
            <Link href="#launch" className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] underline decoration-2 underline-offset-4">
              Ouvrir le tableau de lancement <CommandIcon name="arrow" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Projets actifs" value={projects.length} note={projects.length ? "Dans le pipeline ORBIT" : "Crée ton premier projet actif"} icon="projects" accent="bg-[#bdd8f8]" />
        <MetricCard label="Livrables enregistrés" value={totalOutputs} note="Stratégies et ressources créatives réutilisables" icon="library" accent="bg-[#cfc5f4]" />
        <MetricCard label="Relectures" value={totalReviews} note={`${needsAttention} élément${needsAttention > 1 ? "s" : ""} à corriger`} icon="critic" accent="bg-[#c3d995]" />
        <MetricCard label="Date de lancement" value="01.09" note="Septembre 2026" icon="launch" accent="bg-[#f5df75]" />
      </section>

      {error && (
        <div className="rounded-[22px] border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </div>
      )}

      <section id="projects" className="grid scroll-mt-24 gap-4 xl:grid-cols-12">
        <div className="command-card p-5 sm:p-6 xl:col-span-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="command-label">Espace de travail actif</span>
              <h2 className="display-serif mt-2 text-4xl">Projets en mouvement</h2>
            </div>
            <Link href="/projects/new" className="command-button command-button-soft self-start">
              <CommandIcon name="plus" className="h-4 w-4" /> Nouveau projet
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {!loaded && <><LoadingCard /><LoadingCard /></>}
            {loaded && !error && recentProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>

          {loaded && !error && projects.length === 0 && (
            <div className="mt-5 flex min-h-[250px] flex-col items-center justify-center rounded-[26px] border border-dashed border-black/20 bg-[#bdd8f8]/20 px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#bdd8f8]"><CommandIcon name="projects" className="h-6 w-6" /></span>
              <h3 className="display-serif mt-4 text-3xl">Ton premier projet commence ici.</h3>
              <p className="mt-2 max-w-sm text-sm font-medium text-black/50">Crée un projet et ORBIT gardera ensemble le brief, les livrables, les relectures et les exports.</p>
              <Link href="/projects/new" className="command-button mt-5"><CommandIcon name="plus" className="h-4 w-4" /> Démarrer un projet</Link>
            </div>
          )}
        </div>

        <div id="library" className="command-card overflow-hidden p-5 sm:p-6 xl:col-span-4">
          <div className="flex items-center justify-between">
            <span className="command-label">Mémoire du système</span>
            <CommandIcon name="library" className="h-5 w-5 text-black/45" />
          </div>
          <h2 className="display-serif mt-2 text-4xl">Bibliothèque ORBIT</h2>
          <p className="mt-2 text-sm font-medium leading-relaxed text-black/50">Chaque livrable utile devient une connaissance réutilisable au lieu de disparaître dans une conversation.</p>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            <div className="rounded-[20px] bg-[#cfc5f4] p-4"><p className="text-[10px] font-black uppercase tracking-[0.13em] text-black/50">Livrables</p><p className="display-serif mt-1 text-4xl">{totalOutputs}</p></div>
            <div className="rounded-[20px] bg-[#f5df75] p-4"><p className="text-[10px] font-black uppercase tracking-[0.13em] text-black/50">Exports</p><p className="display-serif mt-1 text-4xl">{totalExports}</p></div>
          </div>

          {nextProject ? (
            <Link href={`/projects/${nextProject.id}/library`} className="mt-3 flex items-center justify-between rounded-[20px] border border-black/10 bg-white/60 p-4 hover:-translate-y-0.5 hover:bg-white">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/40">Dernière bibliothèque</p>
                <p className="mt-1 text-sm font-black">{nextProject.name}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white"><CommandIcon name="arrow" className="h-4 w-4" /></span>
            </Link>
          ) : (
            <div className="mt-3 rounded-[20px] border border-dashed border-black/15 p-4 text-xs font-semibold text-black/42">La bibliothèque se remplira au fur et à mesure de la construction.</div>
          )}
        </div>
      </section>

      <section id="workflows" className="command-card scroll-mt-24 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="command-label">Moteurs ORBIT</span>
            <h2 className="display-serif mt-2 text-4xl sm:text-5xl">Une idée. Un système complet.</h2>
          </div>
          <p className="max-w-sm text-sm font-medium leading-relaxed text-black/48">Chaque moteur hérite du même cerveau de marque, pour que le site, le contenu et les visuels ne se contredisent plus.</p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {WORKFLOWS.map((workflow, index) => {
            const href = nextProject ? `/projects/${nextProject.id}/run?step=${workflow.step}` : "/projects/new";
            return (
              <Link key={workflow.step} href={href} className="group relative min-h-[205px] overflow-hidden rounded-[26px] border border-black/10 bg-white/55 p-5 hover:-translate-y-1 hover:bg-white hover:shadow-[0_18px_35px_rgba(32,30,25,0.09)]">
                <span className={`flex h-12 w-12 items-center justify-center rounded-[18px] border border-black/10 ${workflow.accent}`}><CommandIcon name={workflow.icon} className="h-5 w-5" /></span>
                <span className="absolute right-4 top-4 display-serif text-3xl italic text-black/16">0{index + 1}</span>
                <h3 className="mt-6 text-lg font-black tracking-[-0.025em]">{workflow.title}</h3>
                <p className="mt-2 max-w-[260px] text-sm font-medium leading-relaxed text-black/48">{workflow.description}</p>
                <span className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white group-hover:bg-black group-hover:text-white"><CommandIcon name="arrow" className="h-4 w-4" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section id="launch" className="grid scroll-mt-24 gap-4 xl:grid-cols-12">
        <div className="relative overflow-hidden rounded-[34px] border border-black/12 bg-[#bdd8f8] p-5 sm:p-7 xl:col-span-7">
          <div className="absolute -right-14 -top-16 h-52 w-52 rounded-full bg-[#f5df75]" />
          <div className="relative">
            <span className="command-label">Tableau de lancement / 01.09.2026</span>
            <h2 className="display-serif mt-3 max-w-lg text-5xl leading-[0.95] sm:text-6xl">Rends le lancement <span className="italic">inévitable.</span></h2>
            <div className="mt-8 space-y-2.5">
              {LAUNCH_TASKS.map((task, index) => (
                <div key={task.label} className="flex items-center gap-3 rounded-[20px] border border-black/10 bg-[#fffdf8]/72 p-3.5 backdrop-blur">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] border border-black/10 ${task.done ? "bg-[#c3d995]" : "bg-white/70"}`}>
                    {task.done ? <CommandIcon name="check" className="h-4 w-4" /> : <span className="text-xs font-black">0{index + 1}</span>}
                  </span>
                  <p className={`flex-1 text-sm font-black ${task.done ? "text-black/45 line-through" : ""}`}>{task.label}</p>
                  <span className="hidden rounded-full border border-black/10 bg-white/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-black/48 sm:inline-flex">{task.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[34px] border border-black/12 bg-[#cfc5f4] p-5 text-black shadow-[0_20px_50px_rgba(92,79,130,0.12)] sm:p-7 xl:col-span-5">
          <div className="flex items-center justify-between">
            <span className="command-label text-black/48">État du contrôle qualité</span>
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 bg-[#fffdf8] text-black"><CommandIcon name="critic" className="h-5 w-5" /></span>
          </div>
          <div className="mt-8 flex items-end gap-3">
            <p className="display-serif text-7xl">{needsAttention ? Math.max(5, 10 - needsAttention) : totalReviews ? 9 : "—"}</p>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-black/42">note de qualité<br />actuelle</p>
          </div>
          <p className="mt-5 max-w-md text-sm font-medium leading-relaxed text-black/58">
            {needsAttention
              ? `${needsAttention} élément${needsAttention > 1 ? "s affaiblissent" : " affaiblit"} encore le système. Corrige d’abord le problème ayant le plus d’impact.`
              : totalReviews
                ? "Aucune relecture bloquée. Garde l’ADN visuel cohérent avant d’augmenter la production."
                : "Lance la première relecture Orbit Critic pour établir une vraie base de qualité."}
          </p>
          <div className="mt-7 grid grid-cols-3 gap-2">
            {[{ label: "Clarté", value: needsAttention ? "À surveiller" : "Solide" }, { label: "ADN visuel", value: "Verrouillé" }, { label: "Conversion", value: totalReviews ? "Prête" : "À tester" }].map((item) => (
              <div key={item.label} className="rounded-[18px] border border-black/10 bg-white/48 p-3">
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-black/38">{item.label}</p>
                <p className="mt-1 text-xs font-black">{item.value}</p>
              </div>
            ))}
          </div>
          <Link href={nextProject ? `/projects/${nextProject.id}/run?step=review` : "/projects/new"} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#151515] px-4 py-2.5 text-xs font-black text-white">
            Lancer une relecture <CommandIcon name="arrow" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
