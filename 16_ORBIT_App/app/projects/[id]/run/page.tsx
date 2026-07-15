"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Project, WorkflowStep } from "@/lib/types";
import { getProject, saveProject } from "@/lib/storage";
import { buildPrompt, detectReviewStatus, STEP_LABELS, STEP_ORDER } from "@/lib/prompts";
import { getBrandProfile } from "@/lib/brandProfile";
import PromptPreview from "@/components/PromptPreview";
import CommandIcon, { CommandIconName } from "@/components/CommandIcon";

const STEP_META: Record<WorkflowStep, { icon: CommandIconName; accent: string; caption: string }> = {
  strategy: { icon: "strategy", accent: "bg-[#f5df75]", caption: "Turn the brief into a strategic backbone." },
  creative: { icon: "sparkles", accent: "bg-[#f2b8cf]", caption: "Translate strategy into a visual territory." },
  website: { icon: "website", accent: "bg-[#bdd8f8]", caption: "Build structure, copy, UX and image direction." },
  content: { icon: "content", accent: "bg-[#f1a36f]", caption: "Create a repeatable publishing system." },
  images: { icon: "image", accent: "bg-[#cfc5f4]", caption: "Engineer coherent, production-ready visual prompts." },
  review: { icon: "critic", accent: "bg-[#c3d995]", caption: "Find what weakens the output before it ships." },
};

function RunnerContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const step = (searchParams.get("step") as WorkflowStep) || "strategy";

  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [reviewTarget, setReviewTarget] = useState<WorkflowStep>("website");
  const [pasted, setPasted] = useState("");
  const [error, setError] = useState("");
  const [genError, setGenError] = useState("");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    getProject(params.id)
      .then(setProject)
      .catch((err) => setError((err as Error).message));
    setPasted("");
    setGenError("");
  }, [params.id, step]);

  if (error) return <div className="rounded-[22px] border border-red-300 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>;
  if (project === undefined) return <div className="h-[520px] animate-pulse rounded-[34px] bg-white/45" />;
  if (project === null) return <div className="command-card p-8 text-center"><p className="display-serif text-4xl">Project not found.</p><Link href="/" className="command-button mt-5">Back home</Link></div>;

  const priorOutputs = Object.fromEntries(
    Object.entries(project.outputs).map(([key, value]) => [key, value?.content || ""])
  ) as Partial<Record<WorkflowStep, string>>;

  const brand = getBrandProfile(project.brief.brandProfileId);
  const prompt = step === "review"
    ? buildPrompt("review", brand, project.name, project.brief, priorOutputs, reviewTarget)
    : buildPrompt(step, brand, project.name, project.brief, priorOutputs);
  const meta = STEP_META[step];

  async function generateAuto() {
    setGenerating(true);
    setGenError("");
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          step,
          reviewTarget: step === "review" ? reviewTarget : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Requête échouée (${response.status})`);
      setPasted(data.output);
    } catch (err) {
      setGenError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function saveResult() {
    if (!pasted.trim()) return;
    setSaving(true);
    try {
      let next: Project;
      if (step === "review") {
        const status = detectReviewStatus(pasted);
        next = {
          ...project,
          reviews: [...project.reviews, { target: reviewTarget, content: pasted, status, created_at: new Date().toISOString() }],
          stage: "review",
        };
      } else {
        next = {
          ...project,
          outputs: { ...project.outputs, [step]: { step, content: pasted, created_at: new Date().toISOString() } },
          stage: step,
        };
      }
      const saved = await saveProject(next);
      setProject(saved);
      setPasted("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-7">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="command-label"><CommandIcon name={meta.icon} className="h-3.5 w-3.5" /> ORBIT engine</span>
          <h1 className="display-serif mt-3 text-5xl leading-[0.95] sm:text-7xl">{STEP_LABELS[step]}</h1>
          <p className="mt-3 text-sm font-medium text-black/52">{meta.caption} <span className="font-black text-black/75">{project.name}</span></p>
        </div>
        <Link href={`/projects/${project.id}`} className="command-button command-button-soft self-start"><CommandIcon name="arrow" className="h-4 w-4 rotate-180" /> Back to project</Link>
      </header>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {STEP_ORDER.map((item) => {
          const itemMeta = STEP_META[item];
          const active = item === step;
          return (
            <Link
              key={item}
              href={`/projects/${project.id}/run?step=${item}`}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${active ? "border-black bg-[#151515] text-white" : "border-black/10 bg-white/60 text-black/48 hover:bg-white hover:text-black"}`}
            >
              <span className={`flex h-7 w-7 items-center justify-center rounded-full ${active ? itemMeta.accent + " text-black" : "bg-black/[0.05]"}`}><CommandIcon name={itemMeta.icon} className="h-3.5 w-3.5" /></span>
              {STEP_LABELS[item]}
              {project.outputs[item] && <span className="h-2 w-2 rounded-full bg-[#7ca34d]" />}
            </Link>
          );
        })}
      </div>

      <section className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          {step === "review" && (
            <div className="command-card-flat p-4 sm:p-5">
              <label className="command-label">Output to review</label>
              <select value={reviewTarget} onChange={(event) => setReviewTarget(event.target.value as WorkflowStep)} className="mt-3 px-4 py-3 text-sm font-bold">
                {(["website", "content", "images", "strategy", "creative"] as WorkflowStep[]).map((target) => <option key={target} value={target}>{STEP_LABELS[target]}</option>)}
              </select>
            </div>
          )}

          <div className="command-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><span className="command-label">Instruction blueprint</span><h2 className="display-serif mt-2 text-4xl">The prompt</h2></div>
              <span className={`flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 ${meta.accent}`}><CommandIcon name={meta.icon} className="h-5 w-5" /></span>
            </div>
            <div className="mt-5"><PromptPreview prompt={prompt} /></div>
          </div>
        </div>

        <aside className="space-y-4 xl:col-span-5">
          <div className="relative overflow-hidden rounded-[30px] border border-black/12 bg-[#151515] p-5 text-white sm:p-6">
            <div className={`absolute -right-10 -top-12 h-44 w-44 rounded-full ${meta.accent}`} />
            <div className="relative">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/42">Automatic generation</span>
              <h2 className="display-serif mt-3 text-4xl">Let ORBIT do the heavy lifting.</h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-white/52">The response is never saved automatically. Review it below, edit it, then validate it yourself.</p>
              <button onClick={generateAuto} disabled={generating} className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-black text-black disabled:cursor-not-allowed disabled:opacity-50">
                <CommandIcon name={generating ? "clock" : "sparkles"} className="h-4 w-4" />
                {generating ? "Generating…" : "Generate with OpenAI"}
              </button>
              <p className="mt-3 text-[10px] font-semibold leading-relaxed text-white/32">Requires OPENAI_API_KEY on Vercel. Manual copy-paste remains available without it.</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-black/12 bg-[#f5df75] p-5">
            <span className="command-label">Manual mode</span>
            <p className="mt-2 text-sm font-black leading-snug">Copy the prompt into ChatGPT or Claude, then paste the answer in the validation zone.</p>
          </div>
        </aside>
      </section>

      {genError && <p className="rounded-[20px] border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{genError}</p>}

      <section className="command-card p-5 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><span className="command-label">Human validation zone</span><h2 className="display-serif mt-2 text-4xl sm:text-5xl">Review before memory.</h2></div>
          <span className="command-pill bg-[#c3d995]">Nothing auto-saves</span>
        </div>
        <textarea
          value={pasted}
          onChange={(event) => setPasted(event.target.value)}
          rows={16}
          className="mt-6 min-h-[360px] px-4 py-4 font-mono text-[13px] leading-relaxed placeholder:font-sans placeholder:text-black/25"
          placeholder="Paste or generate the output here. Edit anything that feels generic, wrong or off-brand before saving."
        />
        <div className="mt-5 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-xs font-semibold leading-relaxed text-black/42">Saving makes this output part of the project memory and available to the next ORBIT engines.</p>
          <div className="flex gap-2">
            <button onClick={() => setPasted("")} disabled={!pasted} className="command-button command-button-soft disabled:opacity-35">Clear</button>
            <button onClick={saveResult} disabled={!pasted.trim() || saving} className="command-button min-w-[185px] disabled:cursor-not-allowed disabled:opacity-40">
              <CommandIcon name={saving ? "clock" : "check"} className="h-4 w-4" /> {saving ? "Saving…" : "Validate & save"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function WorkflowRunnerPage() {
  return <Suspense fallback={<div className="h-[520px] animate-pulse rounded-[34px] bg-white/45" />}><RunnerContent /></Suspense>;
}
