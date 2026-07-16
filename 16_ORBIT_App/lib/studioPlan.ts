export type PlanStatus = "done" | "in-progress" | "review" | "todo";
export type PlanPriority = "high" | "medium" | "low";

export type PlanItem = {
  id: string;
  title: string;
  detail: string;
  area: string;
  status: PlanStatus;
  priority: PlanPriority;
  due: string;
  scheduledFor?: string;
};

export type ContentItem = {
  id: string;
  title: string;
  format: string;
  status: string;
  timing: string;
};

export type SitePageItem = {
  id: string;
  title: string;
  status: string;
  progress: number;
};

export type TrackItem = {
  id: string;
  label: string;
  icon: "brain" | "website" | "content" | "library" | "sparkles";
  tasks: PlanStatus[];
};

export type StudioPlan = {
  launchDate: string;
  updatedAt: string;
  priorities: PlanItem[];
  contentQueue: ContentItem[];
  sitePages: SitePageItem[];
  tracks: TrackItem[];
};

export const DEFAULT_STUDIO_PLAN: StudioPlan = {
  launchDate: "2026-09-01T09:00:00+02:00",
  updatedAt: "2026-07-16T09:00:00+02:00",
  priorities: [
    { id: "orbit-v2-mobile", title: "Valider ORBIT V2 sur mobile", detail: "Responsive, navigation et liens de toutes les pages", area: "Système", status: "in-progress", priority: "high", due: "Aujourd’hui", scheduledFor: "2026-07-16" },
    { id: "guide-client-final", title: "Finaliser le guide client", detail: "Dernière relecture visuelle puis export PDF final", area: "Produit", status: "review", priority: "high", due: "Avant lancement" },
    { id: "waitlist-announcement", title: "Préparer l’annonce à la waitlist", detail: "Carrousel 3 slides et email de lancement du guide", area: "Contenu", status: "in-progress", priority: "medium", due: "Avant lancement" },
  ],
  contentQueue: [
    { id: "video-da", title: "Vidéo — J’ai enfin trouvé ma DA", format: "TikTok / Reel", status: "Montage terminé", timing: "À publier" },
    { id: "carousel-guide", title: "Carrousel — sortie du guide waitlist", format: "Instagram · 3 slides", status: "Texte à finaliser", timing: "Avant lancement" },
    { id: "email-guide", title: "Email — accès anticipé au guide", format: "Email waitlist", status: "À rédiger", timing: "Avant lancement" },
    { id: "video-work-everywhere", title: "Vidéo — je bosse partout", format: "Reel / coulisses", status: "Caption prête", timing: "À programmer" },
  ],
  sitePages: [
    { id: "home", title: "Accueil", status: "V2 en validation mobile", progress: 75 },
    { id: "about", title: "À propos", status: "Structure à finaliser", progress: 35 },
    { id: "contact", title: "Contact", status: "À construire", progress: 10 },
    { id: "journal", title: "Journal", status: "À cadrer", progress: 0 },
    { id: "legal", title: "Mentions légales", status: "À rédiger", progress: 0 },
  ],
  tracks: [
    { id: "brand", label: "Identité & marque", icon: "brain", tasks: ["done", "done", "done", "in-progress"] },
    { id: "website", label: "Site web", icon: "website", tasks: ["done", "in-progress", "in-progress", "todo", "todo"] },
    { id: "content", label: "Contenus & réseaux", icon: "content", tasks: ["done", "done", "in-progress", "todo", "todo"] },
    { id: "products", label: "Produits & ressources", icon: "library", tasks: ["done", "review", "todo", "todo"] },
    { id: "systems", label: "Système & automatisations", icon: "sparkles", tasks: ["done", "in-progress", "in-progress", "done", "todo"] },
  ],
};

const STATUS_WEIGHT: Record<PlanStatus, number> = { done: 1, review: 0.75, "in-progress": 0.5, todo: 0 };

export function progressFromStatuses(statuses: PlanStatus[]): number {
  if (!statuses.length) return 0;
  return Math.round((statuses.reduce((sum, status) => sum + STATUS_WEIGHT[status], 0) / statuses.length) * 100);
}

export function trackProgress(plan: StudioPlan) {
  return plan.tracks.map((track) => ({ ...track, progress: progressFromStatuses(track.tasks) }));
}

export function globalLaunchProgress(plan: StudioPlan): number {
  const tracks = trackProgress(plan);
  if (!tracks.length) return 0;
  return Math.round(tracks.reduce((sum, track) => sum + track.progress, 0) / tracks.length);
}

export const STATUS_LABEL: Record<PlanStatus, string> = { done: "Terminé", review: "À relire", "in-progress": "En cours", todo: "À faire" };
export const PRIORITY_LABEL: Record<PlanPriority, string> = { high: "Haute", medium: "Moyenne", low: "Basse" };
export const PRIORITY_WEIGHT: Record<PlanPriority, number> = { high: 3, medium: 2, low: 1 };
