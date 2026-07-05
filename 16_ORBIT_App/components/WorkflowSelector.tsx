import Link from "next/link";
import { STEP_LABELS, STEP_ORDER } from "@/lib/prompts";
import { WorkflowStep } from "@/lib/types";

export default function WorkflowSelector({
  projectId,
  completed,
}: {
  projectId: string;
  completed: Partial<Record<WorkflowStep, boolean>>;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {STEP_ORDER.map((step) => (
        <Link
          key={step}
          href={`/projects/${projectId}/run?step=${step}`}
          className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
        >
          <span>{STEP_LABELS[step]}</span>
          <span
            className={`h-2 w-2 rounded-full ${
              completed[step] ? "bg-green-500" : "bg-neutral-300 dark:bg-neutral-700"
            }`}
          />
        </Link>
      ))}
    </div>
  );
}
