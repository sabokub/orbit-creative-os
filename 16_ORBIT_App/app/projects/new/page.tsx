import IntakeForm from "@/components/IntakeForm";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Nouveau projet</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Remplis le brief. Il servira de base à tous les générateurs (site, contenu, images, review).
        </p>
      </div>
      <IntakeForm />
    </div>
  );
}
