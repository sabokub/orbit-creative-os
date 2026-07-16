export type PlanStatus = "done" | "in-progress" | "review" | "todo";
export type PlanPriority = "high" | "medium" | "low";
export type DecisionStatus = "pending" | "applied" | "ignored";
export type DecisionSource = "conversation" | "drive" | "github" | "vercel" | "manual";

export type PlanItem = { id:string; title:string; detail:string; area:string; status:PlanStatus; priority:PlanPriority; due:string; scheduledFor?:string; order?:number; durationMinutes?:number; blockedBy?:string };
export type ContentItem = { id:string; title:string; format:string; status:PlanStatus; priority:PlanPriority; timing:string; scheduledFor?:string; order?:number; durationMinutes?:number };
export type DecisionItem = { id:string; title:string; summary:string; source:DecisionSource; status:DecisionStatus; createdAt:string; suggestedAction?:string; relatedTaskId?:string };
export type SitePageItem = { id:string; title:string; status:string; progress:number };
export type TrackItem = { id:string; label:string; icon:"brain"|"website"|"content"|"library"|"sparkles"; tasks:PlanStatus[] };
export type StudioPlan = { launchDate:string; updatedAt:string; lastManualSyncAt?:string; priorities:PlanItem[]; contentQueue:ContentItem[]; decisions:DecisionItem[]; sitePages:SitePageItem[]; tracks:TrackItem[] };

export const DEFAULT_STUDIO_PLAN: StudioPlan = {
  launchDate:"2026-09-01T09:00:00+02:00", updatedAt:new Date().toISOString(),
  priorities:[
    {id:"define-site-da",title:"Définir précisément la DA du site",detail:"Fusionner les trois maquettes de référence en un système visuel unique",area:"Site web",status:"in-progress",priority:"high",due:"18 juillet",scheduledFor:"2026-07-18",order:1,durationMinutes:120},
    {id:"homepage-final",title:"Finaliser la homepage du site",detail:"Appliquer la DA validée et terminer le responsive",area:"Site web",status:"todo",priority:"high",due:"22 juillet",scheduledFor:"2026-07-22",order:2,durationMinutes:240,blockedBy:"define-site-da"},
    {id:"guide-client-final",title:"Refondre le guide client",detail:"Aligner les 8 pages sur la DA finale du site",area:"Produit",status:"todo",priority:"high",due:"29 juillet",scheduledFor:"2026-07-29",order:3,durationMinutes:300,blockedBy:"define-site-da"},
    {id:"about-page",title:"Finaliser la page À propos",detail:"Copywriting, manifeste et portrait",area:"Site web",status:"todo",priority:"medium",due:"2 août",scheduledFor:"2026-08-02",order:4,durationMinutes:180,blockedBy:"homepage-final"},
    {id:"offers-pages",title:"Finaliser les pages par pièce",detail:"Salon, chambre, bureau, salle de bain et balcon",area:"Site web",status:"todo",priority:"high",due:"8 août",scheduledFor:"2026-08-08",order:5,durationMinutes:360,blockedBy:"homepage-final"},
    {id:"contact-legal",title:"Créer contact et mentions légales",detail:"Formulaire, informations légales et politique de confidentialité",area:"Site web",status:"todo",priority:"medium",due:"12 août",scheduledFor:"2026-08-12",order:6,durationMinutes:180},
    {id:"waitlist-announcement",title:"Préparer l’annonce à la waitlist",detail:"Carrousel 3 slides et email de lancement du guide",area:"Contenu",status:"in-progress",priority:"high",due:"15 août",scheduledFor:"2026-08-15",order:7,durationMinutes:90,blockedBy:"guide-client-final"},
    {id:"guide-export",title:"Exporter et tester le guide final",detail:"PDF haute qualité, liens, affichage mobile et impression",area:"Produit",status:"todo",priority:"high",due:"17 août",scheduledFor:"2026-08-17",order:8,durationMinutes:120,blockedBy:"guide-client-final"},
    {id:"site-qa",title:"Faire la QA complète du site",detail:"Mobile, desktop, liens, formulaires, performances et SEO",area:"Site web",status:"todo",priority:"high",due:"22 août",scheduledFor:"2026-08-22",order:9,durationMinutes:240,blockedBy:"offers-pages"},
    {id:"content-bank",title:"Préparer la banque de contenus de lancement",detail:"Scripts, captions, covers et calendrier de publication",area:"Contenu",status:"todo",priority:"high",due:"25 août",scheduledFor:"2026-08-25",order:10,durationMinutes:300},
    {id:"launch-sequence",title:"Programmer la séquence de lancement",detail:"Email, posts, stories et checklist jour J",area:"Lancement",status:"todo",priority:"high",due:"28 août",scheduledFor:"2026-08-28",order:11,durationMinutes:180,blockedBy:"site-qa"},
    {id:"prelaunch-check",title:"Faire la répétition générale",detail:"Parcours complet, paiements, liens et sauvegardes",area:"Lancement",status:"todo",priority:"high",due:"31 août",scheduledFor:"2026-08-31",order:12,durationMinutes:120,blockedBy:"launch-sequence"}
  ],
  contentQueue:[
    {id:"video-da",title:"Vidéo — J’ai enfin trouvé ma DA",format:"TikTok / Reel",status:"review",priority:"high",timing:"À publier",scheduledFor:"2026-07-19",order:1,durationMinutes:20},
    {id:"video-work-everywhere",title:"Vidéo — je bosse partout",format:"Reel / coulisses",status:"review",priority:"medium",timing:"À programmer",scheduledFor:"2026-07-21",order:2,durationMinutes:15},
    {id:"carousel-guide",title:"Carrousel — sortie du guide waitlist",format:"Instagram · 3 slides",status:"in-progress",priority:"high",timing:"Avant lancement",scheduledFor:"2026-08-15",order:3,durationMinutes:45},
    {id:"email-guide",title:"Email — accès anticipé au guide",format:"Email waitlist",status:"todo",priority:"high",timing:"Avant lancement",scheduledFor:"2026-08-16",order:4,durationMinutes:35},
    {id:"site-teaser",title:"Teaser — nouveau site",format:"Reel / Stories",status:"todo",priority:"high",timing:"Pré-lancement",scheduledFor:"2026-08-24",order:5,durationMinutes:60},
    {id:"launch-post",title:"Post — lancement officiel",format:"Instagram / TikTok",status:"todo",priority:"high",timing:"Jour J",scheduledFor:"2026-08-31",order:6,durationMinutes:60}
  ],
  decisions:[{id:"decision-guide-da",title:"Le guide dépend de la DA du site",summary:"Le design d’ORBIT reste interne. Le guide suit le système visuel du site 24March Studio.",source:"conversation",status:"applied",createdAt:"2026-07-16T12:35:00+02:00",suggestedAction:"Bloquer la refonte du guide jusqu’à validation de la DA web.",relatedTaskId:"guide-client-final"}],
  sitePages:[
    {id:"home",title:"Accueil",status:"Direction visuelle à finaliser",progress:45},{id:"about",title:"À propos",status:"Structure à finaliser",progress:35},{id:"rooms",title:"Pages par pièce",status:"À construire",progress:10},{id:"contact",title:"Contact",status:"À construire",progress:10},{id:"journal",title:"Journal",status:"À cadrer",progress:0},{id:"legal",title:"Mentions légales",status:"À rédiger",progress:0}
  ],
  tracks:[
    {id:"brand",label:"Identité & marque",icon:"brain",tasks:["done","done","done","in-progress"]},{id:"website",label:"Site web",icon:"website",tasks:["done","in-progress","todo","todo","todo","todo"]},{id:"content",label:"Contenus & réseaux",icon:"content",tasks:["done","review","in-progress","todo","todo","todo"]},{id:"products",label:"Produits & ressources",icon:"library",tasks:["done","review","todo","todo"]},{id:"systems",label:"Système & automatisations",icon:"sparkles",tasks:["done","done","in-progress","in-progress","todo"]}
  ]
};

const STATUS_WEIGHT:Record<PlanStatus,number>={done:1,review:.75,"in-progress":.5,todo:0};
export function progressFromStatuses(statuses:PlanStatus[]){return statuses.length?Math.round(statuses.reduce((s,v)=>s+STATUS_WEIGHT[v],0)/statuses.length*100):0}
export function trackProgress(plan:StudioPlan){return plan.tracks.map(t=>({...t,progress:progressFromStatuses(t.tasks)}))}
export function globalLaunchProgress(plan:StudioPlan){const t=trackProgress(plan);return t.length?Math.round(t.reduce((s,v)=>s+v.progress,0)/t.length):0}
export function sortByOrder<T extends {order?:number}>(items:T[]){return [...items].sort((a,b)=>(a.order??999)-(b.order??999))}
export const STATUS_LABEL:Record<PlanStatus,string>={done:"Terminé",review:"À relire","in-progress":"En cours",todo:"À faire"};
export const PRIORITY_LABEL:Record<PlanPriority,string>={high:"Haute",medium:"Moyenne",low:"Basse"};
export const PRIORITY_WEIGHT:Record<PlanPriority,number>={high:3,medium:2,low:1};