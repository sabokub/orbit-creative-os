import { BrandProfile } from "./types";

/**
 * Brand Profile global — identité fixe de 24March Studio.
 * V1 : un seul profil, codé en dur, utilisé par défaut par tous les projets.
 * Modifiable ici directement tant qu'il n'y a pas de page d'édition.
 */
export const DEFAULT_BRAND_PROFILE: BrandProfile = {
  id: "24march-studio",
  name: "24March Studio (24M Studio)",
  activity:
    "Studio digital de décoration intérieure et direction artistique d'intérieur. Le studio aide des particuliers créatifs à transformer leur espace en lieu personnel, photogénique et visuellement fort. L'approche mêle décoration, culture visuelle, image de marque, lifestyle, moodboard, sélection mobilier/objets, direction visuelle et visualisation 3D.",
  positioning:
    "24March Studio n'est pas seulement un service de décoration. C'est une direction artistique d'intérieur pour créer des espaces personnels, désirables, photogéniques et identitaires.",
  audience:
    "Clients 18-35 ans, urbains, créatifs ou très sensibles à l'esthétique. Créateurs de contenu, freelances, jeunes entrepreneurs, DA, graphistes, photographes, stylistes, personnes dans la mode, beauté, food, musique, event, tattoo, design, ou jeunes actifs avec un bon œil mais pas forcément la méthode. Ils veulent un intérieur qui ressemble à leur univers, qui a une vibe, une identité, et qui fonctionne aussi dans leur vie sociale, leur contenu et leur image personnelle.",
  offer:
    "Direction artistique d'intérieur (concept + moodboard + plan de mise en œuvre), sélection mobilier/objets curatée, visualisation 3D de l'espace, accompagnement styling content-ready.",
  brandPromise: "Ton intérieur devient un espace qui te ressemble, qui se vit et qui se montre.",
  messagePillars: [
    "Ton intérieur est une extension de ton image, pas une case à cocher déco.",
    "Une méthode de direction artistique, pas un simple relooking.",
    "Un résultat qui fonctionne dans ta vie ET dans ton contenu.",
    "Une identité assumée, jamais un style générique.",
  ],
  visualDirection:
    "Lifestyle éditorial à la maison. Cool people live here. Jeunes clients créatifs. Intérieurs vivants, colorés, personnels, assumés. Énergie mode / magazine / culture visuelle. Flash photo, cadrages proches, léger grand angle, reflets, matières fortes, objets qui racontent quelque chose, détails de vie (canapé, cuisine, miroir, food, drink, magazines), styling mode appliqué à l'intérieur.",
  toneOfVoice:
    "Direct, visuel, sensible, un peu mode, accessible mais pas basique. Expert sans être froid. Culture visuelle, intérieur comme extension de soi, goût, identité, lifestyle.",
  colors:
    "Bleu profond et vert comme couleurs d'accent. Ne jamais rendre tout le système bleu ou vert : les couleurs soutiennent la direction artistique, elles ne doivent pas devenir un gimmick.",
  photographyDirection:
    "Flash photo direct, cadrages proches, léger grand angle, reflets, matières fortes, objets qui racontent une histoire, grain visible, look argentique — jamais un rendu 3D lisse ou générique.",
  contentDirection:
    "Piliers autorité / éducation / inspiration / preuve / personnalité. Contenu ancré dans la méthode et l'univers du studio, jamais du conseil déco Pinterest générique.",
  websiteDirection:
    "Une action principale par page, preuve avant les grandes promesses, homepage compréhensible en moins de 10 secondes, ton direct et complice, jamais corporate.",
  imagePromptRules:
    "Chaque prompt image doit porter la signature : lifestyle éditorial à la maison, cool people live here, intérieur comme extension de soi, énergie mode/magazine/culture visuelle, flash photo, cadrages proches, léger grand angle, reflets, matières fortes, objets qui racontent une histoire.",
  avoid: [
    "intérieur beige trop sage",
    "décoration classique",
    "moodboard matériaux trop agence",
    "rendu IA générique",
    "image trop vide ou trop lisse",
    "nightlife / club",
    "appartement Kinfolk trop clean",
    "luxe froid",
    "esthétique trop adulte ou trop sage",
    "dashboard SaaS violet/générique",
    "ton trop corporate",
    "contenu trop 'conseils déco Pinterest'",
  ],
  successCriteria:
    "Un livrable qui donne immédiatement envie à un jeune créatif urbain de se dire 'je veux que mon appart ressemble à ça, et que ça me ressemble' — sans jamais tomber dans la déco classique ou le rendu IA générique.",
};

/** V1 : un seul brand profile possible. L'id est ignoré, réservé pour une v2 multi-marques. */
export function getBrandProfile(_id?: string): BrandProfile {
  return DEFAULT_BRAND_PROFILE;
}

export const WORKFLOW_TYPE_LABELS: Record<string, string> = {
  website: "Website Generator",
  content: "Content Generator",
  images: "Image Prompt Generator",
  review: "Hero Image Review",
  "brand-kit": "Brand Kit Generator",
};

/** Première étape du pipeline interne (strategy/creative/website/content/images/review) associée à chaque workflow visible. */
export const WORKFLOW_TYPE_FIRST_STEP: Record<string, string> = {
  website: "website",
  content: "content",
  images: "images",
  review: "review",
  "brand-kit": "strategy",
};
