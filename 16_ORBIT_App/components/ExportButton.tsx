"use client";

export default function ExportButton({
  disabled,
  filename,
  content,
  onExported,
}: {
  disabled?: boolean;
  filename: string;
  content: string;
  onExported?: () => void;
}) {
  function download() {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".md") ? filename : `${filename}.md`;
    a.click();
    URL.revokeObjectURL(url);
    onExported?.();
  }

  return (
    <button
      onClick={download}
      disabled={disabled}
      title={disabled ? "Bloqué : à corriger avant export" : "Télécharger en Markdown"}
      className="rounded-full border border-black/12 bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-black/62 hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/80 disabled:hover:text-black/62"
    >
      Exporter (.md)
    </button>
  );
}
