export type PlanStatus = "done" | "in-progress" | "review" | "todo";

export type PlanItem = {
  title: string;
  detail: string;
  area: string;
  status: PlanStatus;
  due: string;
};

export type ContentItem = {
  title: string;
  format: string;
  status: string;
  timing: string;
};

export type SitePageItem = {
  title: string;
  status: string;
  progress: number;
};

export const LAUNCH_DATE = new Date("2026-09-01T09:00:00+02:00");
export const PLAN_UPDATED_AT = "16 juillet 2026";

export const PRIORITIES: PlanItem[] = [
  {
    title: "Valider ORBIT V2 sur mobile",
    detail: "Responsive, navigation et liens de toutes les pages",
    area: "Système",
    status: "in-progress",
    due: "Cette semaine",
  },
  {
    title: "Finaliser le guide client",
    detail: "Dernière relecture visuelle puis export PDF final",
    area: "Produit",
    status: "review",
    due: "Avant lancement",
  },
  {
    title: "Préparer l’annonce à la waitlist",
    detail: "Carrousel 3 slides et email de lancement du guide",
    area: "Contenu",
    status: "in-progress",
    due: "Avant lancement",
  },
];

export const CONTENT_QUEUE: ContentItem[] = [
  {
    title: "Vidéo — J’ai enfin trouvé ma DA",
    format: "TikTok / Reel",
    status: "Montage terminé",
    timing: "À publier",
  },
  {
    title: "Carrousel — sortie du guide waitlist",
    format: "Instagram · 3 slides",
    status: "Texte à finaliser",
    timing: "Avant lancement",
  },
  {
    title: "Email — accès anticipé au guide",
    format: "Email waitlist",
    status: "À rédiger",
    timing: "Avant lancement",
  },
  {
    title: "Vidéo — je bosse partout",
    format: "Reel / coulisses",
    status: "Caption prête",
    timing: "À programmer",
  },
];

export const SITE_PAGES: SitePageItem[] = [
  { title: "Accueil", status: "V2 en validation mobile", progress: 75 },
  { title: "À propos", status: "Structure à finaliser", progress: 35 },
  { title: "Contact", status: "À construire", progress: 10 },
  { title: "Journal", status: "À cadrer", progress: 0 },
  { title: "Mentions légales", status: "À rédiger", progress: 0 },
];

export const TRACKS = [
  {
    label: "Identité & marque",
    icon: "brain" as const,
    tasks: ["done", "done", "done", "in-progress"] as PlanStatus[],
  },
  {
    label: "Site web",
    icon: "website" as const,
    tasks: ["done", "in-progress", "in-progress", "todo", "todo"] as PlanStatus[],
  },
  {
    label: "Contenus & réseaux",
    icon: "content" as const,
    tasks: ["done", "done", "in-progress", "todo", "todo"] as PlanStatus[],
  },
  {
    label: "Produits & ressources",
    icon: "library" as const,
    tasks: ["done", "review", "todo", "todo"] as PlanStatus[],
  },
  {
    label: "Système & automatisations",
    icon: "sparkles" as const,
    tasks: ["done", "in-progress", "in-progress", "done", "todo"] as PlanStatus[],
  },
];

const STATUS_WEIGHT: Record<PlanStatus, number> = {
  done: 1,
  review: 0.75,
  "in-progress": 0.5,
  todo: 0,
};

export function progressFromStatuses(statuses: PlanStatus[]): number {
  if (!statuses.length) return 0;
  return Math.round((statuses.reduce((sum, status) => sum + STATUS_WEIGHT[status], 0) / statuses.length) * 100);
}

export const TRACK_PROGRESS = TRACKS.map((track) => ({
  ...track,
  progress: progressFromStatuses(track.tasks),
}));

export const GLOBAL_LAUNCH_PROGRESS = Math.round(
  TRACK_PROGRESS.reduce((sum, track) => sum + track.progress, 0) / TRACK_PROGRESS.length
);

export const STATUS_LABEL: Record<PlanStatus, string> = {
  done: "Terminé",
  review: "À relire",
  "in-progress": "En cours",
  todo: "À faire",
};
