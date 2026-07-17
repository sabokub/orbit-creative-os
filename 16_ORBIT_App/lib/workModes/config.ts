import { WorkMode, WorkModeConfig, WorkModeConfigSchema } from "./contracts";

/**
 * Central mode configuration. Navigation hrefs reference EXISTING pages — modes
 * never delete pages, they only reorder/emphasise. `home` is always first so
 * "Home" is reachable from every mode.
 */
const RAW: Record<WorkMode, WorkModeConfig> = {
  build: {
    id: "build",
    label: "Build",
    description: "Développer et lancer 24March Studio.",
    icon: "launch",
    navigationItems: [
      { href: "/", label: "Home", icon: "home" },
      { href: "/launch", label: "Launch", icon: "launch" },
      { href: "/projects", label: "Projects", icon: "projects" },
      { href: "/dependencies", label: "Dependencies", icon: "projects" },
      { href: "/timeline", label: "Timeline", icon: "launch" },
      { href: "/integrations", label: "Integrations", icon: "library" },
    ],
    priorityWidgets: [
      { id: "blockers", label: "Prochains blocages" },
      { id: "sprint", label: "Sprint actuel" },
      { id: "tech-tasks", label: "Tâches techniques" },
      { id: "github", label: "État GitHub" },
      { id: "launch-progress", label: "Progression lancement" },
    ],
    quickActions: [
      { id: "create-task", label: "Créer une tâche" },
      { id: "run-analysis", label: "Lancer une analyse" },
      { id: "brief-claude-code", label: "Préparer un brief Claude Code" },
      { id: "import-claude-code", label: "Importer un rapport Claude Code" },
      { id: "update-progress", label: "Mettre à jour l'avancement" },
    ],
    preferredAgents: ["orbit-brain", "website-architect", "brand-strategist", "orbit-critic"],
    hiddenSections: [],
    defaultFilters: { kind: "task" },
    contextPolicy: { prioritizeMemoryTypes: ["analysis", "constraint", "decision"], emphasize: ["architecture", "roadmap", "tasks", "risks"] },
  },
  creation: {
    id: "creation",
    label: "Création",
    description: "Produire la direction artistique et les assets visuels.",
    icon: "sparkles",
    navigationItems: [
      { href: "/", label: "Home", icon: "home" },
      { href: "/visual-lab", label: "Visual Lab", icon: "sparkles" },
      { href: "/brand-profile", label: "Creative Direction", icon: "brain" },
      { href: "/projects", label: "Prompts", icon: "content" },
      { href: "/search", label: "References", icon: "sparkles" },
    ],
    priorityWidgets: [
      { id: "recent-prompts", label: "Derniers prompts" },
      { id: "creative-directions", label: "Directions créatives" },
      { id: "images-to-review", label: "Images à reviewer" },
      { id: "recent-references", label: "Références récentes" },
    ],
    quickActions: [
      { id: "generate-creative", label: "Générer une direction créative" },
      { id: "create-prompt", label: "Créer un prompt" },
      { id: "adapt-prompt", label: "Adapter un prompt à un générateur" },
      { id: "validate-result", label: "Valider ou rejeter un résultat" },
    ],
    preferredAgents: ["creative-director", "prompt-intelligence", "orbit-critic"],
    hiddenSections: ["finance"],
    defaultFilters: {},
    contextPolicy: { prioritizeMemoryTypes: ["deliverable", "reference", "constraint", "feedback"], emphasize: ["DA", "références", "contraintes visuelles", "feedbacks images"] },
  },
  content: {
    id: "content",
    label: "Contenu",
    description: "Produire et organiser les contenus de 24March Studio.",
    icon: "content",
    navigationItems: [
      { href: "/", label: "Home", icon: "home" },
      { href: "/studio/content", label: "Content Bank", icon: "content" },
      { href: "/timeline", label: "Calendar", icon: "launch" },
      { href: "/projects", label: "Scripts", icon: "content" },
      { href: "/studio", label: "Platforms", icon: "home" },
    ],
    priorityWidgets: [
      { id: "to-produce", label: "Contenus à produire" },
      { id: "to-publish", label: "Contenus à publier" },
      { id: "calendar", label: "Calendrier" },
      { id: "priority-ideas", label: "Idées prioritaires" },
      { id: "to-recycle", label: "Contenus à recycler" },
    ],
    quickActions: [
      { id: "generate-idea", label: "Générer une idée" },
      { id: "generate-script", label: "Générer un script" },
      { id: "generate-caption", label: "Générer une caption" },
      { id: "plan", label: "Planifier" },
      { id: "mark-published", label: "Marquer comme publié" },
    ],
    preferredAgents: ["content-strategist", "brand-strategist", "orbit-critic"],
    hiddenSections: ["finance"],
    defaultFilters: { kind: "content" },
    contextPolicy: { prioritizeMemoryTypes: ["deliverable", "decision", "feedback"], emphasize: ["piliers", "calendrier", "plateformes"] },
  },
  client: {
    id: "client",
    label: "Client",
    description: "Gérer les projets clients et produire les livrables.",
    icon: "projects",
    navigationItems: [
      { href: "/", label: "Home", icon: "home" },
      { href: "/projects", label: "Clients", icon: "projects" },
      { href: "/projects", label: "Projects", icon: "projects" },
      { href: "/launch", label: "Deliverables", icon: "check" },
      { href: "/studio", label: "Feedback", icon: "home" },
    ],
    priorityWidgets: [
      { id: "active-projects", label: "Projets actifs" },
      { id: "deadlines", label: "Échéances" },
      { id: "pending-validations", label: "Validations en attente" },
      { id: "deliverables", label: "Livrables" },
      { id: "recent-feedback", label: "Feedbacks récents" },
    ],
    quickActions: [
      { id: "create-client-project", label: "Créer un projet client" },
      { id: "import-brief", label: "Importer un brief" },
      { id: "run-pipeline", label: "Lancer le pipeline" },
      { id: "request-review", label: "Demander une review" },
      { id: "export-client", label: "Exporter le dossier client" },
    ],
    preferredAgents: ["orbit-brain", "brand-strategist", "creative-director", "website-architect", "content-strategist", "prompt-intelligence", "orbit-critic"],
    hiddenSections: [],
    defaultFilters: {},
    contextPolicy: { prioritizeMemoryTypes: ["brief", "decision", "deliverable", "validation", "feedback"], emphasize: ["briefs", "décisions", "livrables", "échéances"] },
  },
  steering: {
    id: "steering",
    label: "Pilotage",
    description: "Piloter le studio.",
    icon: "brain",
    navigationItems: [
      { href: "/", label: "Home", icon: "home" },
      { href: "/studio", label: "Studio Pulse", icon: "home" },
      { href: "/launch", label: "Roadmap", icon: "launch" },
      { href: "/dependencies", label: "KPIs", icon: "projects" },
      { href: "/timeline", label: "Risks", icon: "launch" },
    ],
    priorityWidgets: [
      { id: "studio-health", label: "Santé du studio" },
      { id: "objectives", label: "Objectifs" },
      { id: "load", label: "Charge" },
      { id: "risks", label: "Risques" },
      { id: "priorities", label: "Priorités globales" },
    ],
    quickActions: [
      { id: "view-priorities", label: "Voir les priorités" },
      { id: "analyze-risks", label: "Analyser les risques" },
      { id: "generate-report", label: "Générer un bilan" },
      { id: "prepare-week", label: "Préparer la semaine" },
    ],
    preferredAgents: ["orbit-brain", "orbit-critic"],
    hiddenSections: [],
    defaultFilters: {},
    contextPolicy: { prioritizeMemoryTypes: ["analysis", "decision", "constraint"], emphasize: ["priorités", "risques", "roadmap", "objectifs"] },
  },
};

/** Validated once at module load — a malformed config fails fast in dev/build. */
export const WORK_MODE_CONFIGS: Record<WorkMode, WorkModeConfig> = Object.fromEntries(
  Object.entries(RAW).map(([k, v]) => [k, WorkModeConfigSchema.parse(v)])
) as Record<WorkMode, WorkModeConfig>;

export function getWorkModeConfig(mode: WorkMode): WorkModeConfig {
  return WORK_MODE_CONFIGS[mode];
}

export function listWorkModeConfigs(): WorkModeConfig[] {
  return Object.values(WORK_MODE_CONFIGS);
}
