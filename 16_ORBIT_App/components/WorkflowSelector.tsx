import Link from "next/link";
import { STEP_LABELS, STEP_ORDER } from "@/lib/prompts";
import { WorkflowStep } from "@/lib/types";
import CommandIcon, { CommandIconName } from "./CommandIcon";

const META: Record<WorkflowStep, { icon: CommandIconName; accent: string; description: string }> = {
  strategy: { icon: "strategy", accent: "bg-[#f5df75]", description: "Positionnement, promesse et décisions" },
  creative: { icon: "sparkles", accent: "bg-[#f2b8cf]", description: "Territoire visuel et direction artistique" },
  website: { icon: "website", accent: "bg-[#bdd8f8]", description: "Structure, textes et expérience utilisateur" },
  content: { icon: "content", accent: "bg-[#f1a36f]", description: "Formats, accroches et calendrier" },
  images: { icon: "image", accent: "bg-[#cfc5f4]", description: "Prompts visuels prêts pour la production" },
  review: { icon: "critic", accent: "bg-[#c3d995]", description: "Note, problèmes et corrections prioritaires" },
};

export default function WorkflowSelector({
  projectId,
  completed,
}: {
  projectId: string;
  completed: Partial<Record<WorkflowStep, boolean>>;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {STEP_ORDER.map((step, index) => {
        const meta = META[step];
        return (
          <Link
            key={step}
            href={`/projects/${projectId}/run?step=${step}`}
            className="group relative min-h-[170px] overflow-hidden rounded-[24px] border border-black/10 bg-[#fffdf8]/72 p-4 hover:-translate-y-1 hover:bg-white hover:shadow-[0_16px_32px_rgba(32,30,25,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-[16px] border border-black/10 ${meta.accent}`}>
                <CommandIcon name={meta.icon} className="h-5 w-5" />
              </span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black ${completed[step] ? "border-[#89a95c] bg-[#c3d995]" : "border-black/10 bg-white/70 text-black/35"}`}>
                {completed[step] ? <CommandIcon name="check" className="h-4 w-4" /> : `0${index + 1}`}
              </span>
            </div>
            <h3 className="mt-5 text-base font-black tracking-[-0.02em]">{STEP_LABELS[step]}</h3>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-black/42">{meta.description}</p>
            <span className="absolute bottom-4 right-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.1em] text-black/38 group-hover:text-black">Lancer <CommandIcon name="arrow" className="h-3.5 w-3.5" /></span>
          </Link>
        );
      })}
    </div>
  );
}
