import { Review, WorkflowStep } from "@/lib/types";
import { STEP_LABELS } from "@/lib/prompts";
import StatusBadge from "./StatusBadge";

export default function ReviewScoreCard({ review }: { review: Review }) {
  const targetLabel = STEP_LABELS[review.target as WorkflowStep] || review.target;

  return (
    <div className="rounded-[22px] border border-black/10 bg-white/55 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-black text-black/78">Relecture — {targetLabel}</span>
        <StatusBadge status={review.status} />
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-black/64">
        {review.content}
      </pre>
      <p className="mt-3 text-xs font-semibold text-black/35">
        {new Date(review.created_at).toLocaleString("fr-FR")}
      </p>
    </div>
  );
}
