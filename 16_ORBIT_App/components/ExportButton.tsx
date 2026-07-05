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
      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      Exporter (.md)
    </button>
  );
}
