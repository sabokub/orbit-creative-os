export type PlanStatus = "done" | "in-progress" | "review" | "todo";
export type PlanPriority = "high" | "medium" | "low";
export type DecisionStatus = "pending" | "applied" | "ignored";
export type DecisionSource = "conversation" | "drive" | "github" | "vercel" | "manual";

export type PlanItem = {
  id: string;
  title: string;
  detail: string;
  area: string;
  status: PlanStatus;
  priority: PlanPriority;
  due: string;
  scheduledFor?: string;
  order?: number;
  durationMinutes?: number;
  blockedBy?: string;
};

export type ContentItem = {
  id: string;
  title: string;
  format: string;
  status: PlanStatus;
  priority: PlanPriority;
  timing: string;
  scheduledFor?: string;
  order?: number;
  durationMinutes?: number;
};

export type DecisionItem = {
  id: string;
  title: string;
  summary: string;
  source: DecisionSource;
  status: DecisionStatus;
  createdAt: string;
  suggestedAction?: string;
  relatedTaskId?: string;
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
  lastManualSyncAt?: string;
  priorities: PlanItem[];
  contentQueue: ContentItem[];
  decisions: DecisionItem[];
  sitePages: SitePageItem[];
  tracks: TrackItem[];
};

export const DEFAULT_STUDIO_PLAN: StudioPlan = {
  launchDate: "2026-09-01T09:00:00+02:00",
  updatedAt: "2026-07-16T09:00:00+02:00",
  priorities: [
    { id: "define-site-da", title: "Définir précisément la DA du site", detail: "Fusionner les trois maquettes de référence en un système visuel unique", area: "Site web", status: "in-progress", priority: "high", due: "Cette semaine", order: 1, durationMinutes: 120 },
    { id: "guide-client-final", title: "Refondre le guide client", detail: "À aligner sur la DA finale du site, pas sur ORBIT", area: "Produit", status: "todo", priority: "high", due: "Après validation de la DA", order: 2, durationMinutes: 180, blockedBy: "define-site-da" },
    { id: "waitlist-announcement", title: "Préparer l’annonce à la waitlist", detail: "Carrousel 3 slides et email de lancement du guide", area: "Contenu", status: "in-progress", priority: "medium", due: "Avant lancement", order: 3, durationMinutes: 90 },
  ],
  contentQueue: [
    { id: "video-da", title: "Vidéo — J’ai enfin trouvé ma DA", format: "TikTok / Reel", status: "review", priority: "high", timing: "À publier", order: 1, durationMinutes: 20 },
    { id: "carousel-guide", title: "Carrousel — sortie du guide waitlist", format: "Instagram · 3 slides", status: "in-progress", priority: "high", timing: "Avant lancement", order: 2, durationMinutes: 45 },
    { id: "email-guide", title: "Email — accès anticipé au guide", format: "Email waitlist", status: "todo", priority: "medium", timing: "Avant lancement", order: 3, durationMinutes: 35 },
    { id: "video-work-everywhere", title: "Vidéo — je bosse partout", format: "Reel / coulisses", status: "review", priority: "low", timing: "À programmer", order: 4, durationMinutes: 15 },
  ],
  decisions: [
    {
      id: "decision-guide-da",
      title: "Le guide dépend de la DA du site",
      summary: "Le design d’ORBIT reste interne. Le guide doit suivre le futur système visuel du site 24March Studio.",
      source: "conversation",
      status: "applied",
      createdAt: "2026-07-16T12:35:00+02:00",
      suggestedAction: "Bloquer la refonte du guide jusqu’à validation de la DA web.",
      relatedTaskId: "guide-client-final",
    },
  ],
  sitePages: [
    { id: "home", title: "Accueil", status: "Direction visuelle à finaliser", progress: 45 },
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
    { id: "systems", label: "Système & automatisations", icon: "sparkles", tasks: ["done", "done", "in-progress", "in-progress", "todo"] },
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

export function sortByOrder<T extends { order?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export const STATUS_LABEL: Record<PlanStatus, string> = { done: "Terminé", review: "À relire", "in-progress": "En cours", todo: "À faire" };
export const PRIORITY_LABEL: Record<PlanPriority, string> = { high: "Haute", medium: "Moyenne", low: "Basse" };
export const PRIORITY_WEIGHT: Record<PlanPriority, number> = { high: 3, medium: 2, low: 1 };
