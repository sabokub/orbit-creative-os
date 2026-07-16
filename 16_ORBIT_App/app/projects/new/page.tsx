import IntakeForm from "@/components/IntakeForm";
import CommandIcon from "@/components/CommandIcon";

export default function NewProjectPage() {
  return (
    <div className="space-y-5 sm:space-y-7">
      <header>
        <span className="command-label"><CommandIcon name="plus" className="h-3.5 w-3.5" /> Nouveau projet ORBIT</span>
        <h1 className="display-serif mt-3 max-w-4xl text-5xl leading-[0.95] sm:text-7xl">Donne à ton idée un <span className="italic">vrai système.</span></h1>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-black/52 sm:text-base">
          Renseigne uniquement ce qui change pour ce livrable. Le cerveau de marque 24March reste la base commune de toutes les générations.
        </p>
      </header>
      <IntakeForm />
    </div>
  );
}
