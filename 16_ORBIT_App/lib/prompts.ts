import { BrandProfile, ProjectBrief, WorkflowStep } from "./types";

export const STEP_LABELS: Record<WorkflowStep, string> = {
  strategy: "Stratégie de marque",
  creative: "Direction créative",
  website: "Site internet",
  content: "Contenu réseaux",
  images: "Prompts image",
  review: "Relecture critique",
};

export const STEP_ORDER: WorkflowStep[] = [
  "strategy",
  "creative",
  "website",
  "content",
  "images",
  "review",
];

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.split(`{{${key}}}`).join(value || "(non renseigné)"),
    template
  );
}

const STRATEGY_TEMPLATE = `Agis comme Orbit Brand. Construis le positionnement de ce projet en suivant cette structure : diagnostic, insight cible, positionnement, promesse, piliers de message, risques et prochaines actions.

Profil de marque (identité fixe — ne pas réinventer, seulement affiner pour ce livrable) :
Nom : {{brand_name}}
Activité : {{brand_activity}}
Cible : {{brand_audience}}
Offre : {{brand_offer}}
Positionnement existant : {{brand_positioning}}
Promesse de marque : {{brand_promise}}
Piliers de message :
{{brand_pillars}}

Brief du projet (contexte spécifique à ce livrable) :
Projet : {{project_name}}
Objectif : {{project_goal}}
Contexte spécifique : {{specific_context}}
Critères de réussite : {{success_criteria}}

Réponds en français, avec des recommandations précises, directement utilisables et sans jargon inutile.`;

const CREATIVE_TEMPLATE = `Agis comme Orbit Creative. Traduis la stratégie en territoire visuel avec : comportement des couleurs, langage de lumière, langage de composition, styling et risques créatifs.

Profil de marque :
Direction visuelle : {{brand_visual_direction}}
Direction photo : {{brand_photography}}
Couleurs : {{brand_colors}}
À éviter :
{{brand_avoid}}

Brief du projet :
Projet : {{project_name}}
Contexte spécifique : {{specific_context}}
Références : {{references}}
Contraintes : {{constraints}}

Stratégie issue de l’étape précédente :
{{strategy_output}}

Réponds en français. Distingue clairement les règles fixes, les choix propres à ce projet et les risques de banalisation.`;

const WEBSITE_TEMPLATE = `Agis comme Orbit Website en utilisant le contexte déjà établi par Orbit Brand et Orbit Creative.

Objectif : produire une structure de site et un copywriting complets, directement exploitables pour le projet ci-dessous. Ne saute pas la stratégie : si le positionnement est faible ou absent, indique clairement l’hypothèse retenue puis avance.

Profil de marque — identité fixe valable pour tous les livrables :
Nom : {{brand_name}}
Activité : {{brand_activity}}
Cible : {{brand_audience}}
Offre : {{brand_offer}}
Positionnement : {{brand_positioning}}
Direction visuelle : {{brand_visual_direction}}
Ton de voix : {{brand_tone}}
Couleurs : {{brand_colors}}
Direction du site : {{brand_website_direction}}
À éviter :
{{brand_avoid}}

Brief du projet — contexte spécifique à ce livrable :
Projet : {{project_name}}
Objectif : {{project_goal}}
Contexte spécifique : {{specific_context}}
Livrable : {{deliverable_type}}
Canaux : {{channels}}
Contraintes : {{constraints}}

Stratégie et direction créative précédentes :
{{strategy_output}}
{{creative_output}}

Produis, dans cet ordre exact, avec des textes complets et sans placeholders :
1. Positionnement web
2. Promesse du hero
3. Arborescence
4. Structure de la homepage
5. Copywriting de chaque section
6. Appels à l’action
7. Éléments de preuve
8. Offres reformulées pour le web
9. FAQ de 5 à 8 questions-réponses
10. Direction de l’image hero
11. Prompts image par section
12. Bases SEO : meta title et meta description
13. Ton UX writing

Réponds en français au format Markdown, avec un titre ## pour chacun des 13 éléments.`;

const CONTENT_TEMPLATE = `Agis comme Orbit Content en utilisant le contexte déjà établi par Orbit Brand et Orbit Creative.

Objectif : produire un système éditorial complet et directement utilisable sur 30 jours pour le projet ci-dessous.

Profil de marque :
Nom : {{brand_name}}
Cible : {{brand_audience}}
Offre : {{brand_offer}}
Ton de voix : {{brand_tone}}
Direction visuelle : {{brand_visual_direction}}
Direction du contenu : {{brand_content_direction}}
À éviter :
{{brand_avoid}}

Brief du projet :
Projet : {{project_name}}
Objectif : {{project_goal}}
Contexte spécifique : {{specific_context}}
Canaux : {{channels}}
Contraintes : {{constraints}}

Stratégie et direction créative précédentes :
{{strategy_output}}
{{creative_output}}

Produis, dans cet ordre exact :
1. Piliers de contenu — 4 à 5
2. Formats récurrents par pilier
3. 30 idées de publications numérotées et associées à un pilier
4. 10 idées de reels avec accroche et concept
5. 10 accroches
6. 5 exemples de captions complètes
7. Directions visuelles pour les 5 captions et les 10 reels
8. Calendrier de 30 jours sous forme de tableau : jour, canal, format, sujet, pilier
9. Logique de réutilisation
10. Objectifs par canal

Réponds en français au format Markdown, avec un titre ## pour chacun des 10 éléments et un tableau Markdown pour le calendrier.`;

const IMAGES_TEMPLATE = `Agis comme Orbit Image en utilisant la direction créative déjà établie.

Objectif : produire des prompts image complets, cohérents et prêts pour la production, tous rattachés à un seul ADN visuel.

Profil de marque :
Direction visuelle : {{brand_visual_direction}}
Direction photo : {{brand_photography}}
Couleurs : {{brand_colors}}
Règles de prompting image : {{brand_image_rules}}
À éviter :
{{brand_avoid}}

Brief du projet :
Projet : {{project_name}}
Contexte spécifique : {{specific_context}}
Livrable : {{deliverable_type}}
Références : {{references}}
Contraintes : {{constraints}}
Format attendu : {{format}}

Direction créative précédente :
{{creative_output}}

Livrables site et contenu à illustrer :
{{website_output}}
{{content_output}}

Pour chaque besoin visuel — hero, sections du site, publication Instagram, épingle Pinterest et moodboard — produis un brief image complet selon cette structure exacte :
Sujet / Environnement / Composition / Lumière / Matières / Comportement des couleurs / Styling / Logique caméra / Format de sortie / Contraintes négatives.

Ajoute ensuite 2 à 3 variantes pour le hero, une publication sociale phare et une checklist de relecture en 5 critères.

Réponds en français au format Markdown, avec une section ## par besoin visuel. Les prompts finaux destinés aux générateurs d’images peuvent être en anglais lorsque cela améliore leur précision, mais toutes les explications doivent être en français.`;

const REVIEW_TEMPLATE = `Agis comme Orbit Critic.

Objectif : relire le livrable ci-dessous et produire une critique argumentée, hiérarchisée et directement actionnable.

Profil de marque — ADN de référence pour la relecture :
Nom : {{brand_name}}
Positionnement : {{brand_positioning}}
Direction visuelle : {{brand_visual_direction}}
Ton de voix : {{brand_tone}}
À éviter :
{{brand_avoid}}

Brief du projet :
Projet : {{project_name}}
Livrable à relire : {{review_target}}
Objectif : {{project_goal}}
Critères de réussite : {{success_criteria}}
Contraintes : {{constraints}}

Livrable à relire :
{{review_input}}

Produis, dans cet ordre exact :
1. Verdict global
2. Note sur 10 avec justification
3. Points forts — 2 à 4 éléments précis
4. Problèmes classés par impact
5. Niveau de gravité de chaque problème : Faible / Moyen / Élevé / Critique
6. Risques
7. Corrections recommandées
8. Statut de validation exact : Validé si note ≥ 8 sans problème critique / À corriger si note de 5 à 7 ou problème moyen-élevé / Bloqué si note < 5 ou présence d’un problème critique

Réponds en français au format Markdown, avec un titre ## pour chacun des 8 éléments.`;

const TEMPLATES: Record<WorkflowStep, string> = {
  strategy: STRATEGY_TEMPLATE,
  creative: CREATIVE_TEMPLATE,
  website: WEBSITE_TEMPLATE,
  content: CONTENT_TEMPLATE,
  images: IMAGES_TEMPLATE,
  review: REVIEW_TEMPLATE,
};

export function buildPrompt(
  step: WorkflowStep,
  brand: BrandProfile,
  projectName: string,
  brief: ProjectBrief,
  priorOutputs: Partial<Record<WorkflowStep, string>>,
  reviewTarget?: string
): string {
  const values: Record<string, string> = {
    brand_name: brand.name,
    brand_activity: brand.activity,
    brand_audience: brand.audience,
    brand_offer: brand.offer,
    brand_positioning: brand.positioning,
    brand_promise: brand.brandPromise,
    brand_pillars: brand.messagePillars.map((pillar) => `- ${pillar}`).join("\n"),
    brand_visual_direction: brand.visualDirection,
    brand_tone: brand.toneOfVoice,
    brand_colors: brand.colors,
    brand_photography: brand.photographyDirection,
    brand_content_direction: brand.contentDirection,
    brand_website_direction: brand.websiteDirection,
    brand_image_rules: brand.imagePromptRules,
    brand_avoid: brand.avoid.map((item) => `- ${item}`).join("\n"),
    project_name: projectName,
    project_goal: brief.projectGoal,
    specific_context: brief.specificContext,
    deliverable_type: brief.deliverableType,
    references: brief.references,
    constraints: brief.constraints,
    channels: brief.channels,
    format: brief.format,
    success_criteria: brief.successCriteria,
    strategy_output: priorOutputs.strategy || "",
    creative_output: priorOutputs.creative || "",
    website_output: priorOutputs.website || "",
    content_output: priorOutputs.content || "",
    review_target: reviewTarget || "",
    review_input: reviewTarget ? priorOutputs[reviewTarget as WorkflowStep] || "" : "",
  };
  return fill(TEMPLATES[step], values);
}

export function detectReviewStatus(reviewText: string): "Approved" | "Needs revision" | "Blocked" {
  const lower = reviewText.toLowerCase();
  if (lower.includes("bloqué") || lower.includes("bloquee") || lower.includes("bloquée") || lower.includes("blocked")) return "Blocked";
  if (lower.includes("à corriger") || lower.includes("a corriger") || lower.includes("à affiner") || lower.includes("a affiner") || lower.includes("needs revision")) return "Needs revision";
  if (lower.includes("validé") || lower.includes("valide") || lower.includes("approuvé") || lower.includes("approuve") || lower.includes("approved")) return "Approved";
  return "Needs revision";
}
