import { ImportanceMarkShape } from "@/lib/importanceColor";

const CLIP_PATH: Record<ImportanceMarkShape, string | undefined> = {
  triangle: "polygon(50% 0%, 0% 100%, 100% 100%)",
  diamond: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
  square: undefined,
  circle: undefined,
};

/**
 * Renders a small shape distinct per importance tier — triangle (critical),
 * diamond (high), square (medium), circle (low) — so priority reads without
 * depending on color perception at all. Always pair with the text tag.
 */
export default function ImportanceMark({
  shape,
  color,
  className = "",
}: {
  shape: ImportanceMarkShape;
  color: string;
  className?: string;
}) {
  const clipPath = CLIP_PATH[shape];
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2 w-2 shrink-0 ${shape === "circle" ? "rounded-full" : shape === "square" ? "rounded-[2px]" : ""} ${className}`}
      style={{ backgroundColor: color, clipPath }}
    />
  );
}
