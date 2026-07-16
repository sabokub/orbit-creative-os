import CommandIcon, { CommandIconName } from "./CommandIcon";

export default function MetricCard({
  label,
  value,
  note,
  icon,
  tint,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: CommandIconName;
  tint: string;
}) {
  return (
    <article className={`rounded-[24px] border border-black/10 p-4 shadow-[0_10px_28px_rgba(38,37,32,0.05)] ${tint}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-black/55">{label}</p>
          <p className="mt-2 text-[36px] font-black leading-none tracking-[-0.04em]">{value}</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-[15px] border border-black/10 bg-white/70">
          <CommandIcon name={icon} className="h-[18px] w-[18px]" />
        </span>
      </div>
      <p className="mt-3 text-[11px] font-semibold text-black/52">{note}</p>
    </article>
  );
}
