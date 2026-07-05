import { ReviewStatus } from "@/lib/types";

const STYLES: Record<ReviewStatus, string> = {
  Approved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  "Needs revision": "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Blocked: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  "Not reviewed": "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

export default function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
