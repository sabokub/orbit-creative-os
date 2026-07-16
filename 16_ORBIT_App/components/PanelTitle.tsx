import Link from "next/link";

export default function PanelTitle({
  title,
  action,
  onAction,
  actionHref,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  actionHref?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-[11px] font-black uppercase tracking-[0.12em]">{title}</h2>
      {action && actionHref && (
        <Link href={actionHref} className="rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[10px] font-bold text-black/55">
          {action}
        </Link>
      )}
      {action && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[10px] font-bold text-black/55"
        >
          {action}
        </button>
      )}
    </div>
  );
}
