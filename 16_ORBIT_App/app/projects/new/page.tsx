import IntakeForm from "@/components/IntakeForm";
import CommandIcon from "@/components/CommandIcon";

export default function NewProjectPage() {
  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="command-label"><CommandIcon name="plus" className="h-3.5 w-3.5" /> Nouveau projet ORBIT</span>
          <h1 className="display-serif mt-2 max-w-4xl text-5xl leading-[0.95]">Créer un espace de travail</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-black/50">
            Ajoute seulement le contexte propre à ce projet. Le cerveau de marque 24March reste la base commune.
          </p>
        </div>
        <span className="command-pill bg-[#bdd8f8]/55"><CommandIcon name="brain" className="h-3.5 w-3.5" /> ADN 24March inclus</span>
      </header>
      <IntakeForm />
    </div>
  );
}
