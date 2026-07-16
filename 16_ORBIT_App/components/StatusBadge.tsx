import { ReviewStatus } from "@/lib/types";

const STYLES: Record<ReviewStatus, string> = {
  Approved: "border-[#8eb15a]/30 bg-[#c3d995]/65 text-[#365016]",
  "Needs revision": "border-[#d7aa2f]/35 bg-[#f5df75]/65 text-[#69510a]",
  Blocked: "border-[#d87979]/35 bg-[#ffdada] text-[#7b2525]",
  "Not reviewed": "border-black/10 bg-black/[0.045] text-black/45",
};

const LABELS: Record<ReviewStatus, string> = {
  Approved: "Validé",
  "Needs revision": "À affiner",
  Blocked: "Bloqué",
  "Not reviewed": "Non relu",
};

export default function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${STYLES[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {LABELS[status]}
    </span>
  );
}
