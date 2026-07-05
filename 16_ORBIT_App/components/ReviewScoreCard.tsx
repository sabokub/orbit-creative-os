import { Review } from "@/lib/types";
import StatusBadge from "./StatusBadge";

export default function ReviewScoreCard({ review }: { review: Review }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold capitalize text-neutral-800 dark:text-neutral-100">
          Review — {review.target}
        </span>
        <StatusBadge status={review.status} />
      </div>
      <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs text-neutral-700 dark:text-neutral-300">
        {review.content}
      </pre>
      <p className="mt-2 text-xs text-neutral-400">
        {new Date(review.created_at).toLocaleString("fr-FR")}
      </p>
    </div>
  );
}
