import { BrandProfile, ProjectBrief } from "../types";
import { DEFAULT_BRAND_PROFILE } from "../brandProfile";

export const TEST_BRAND: BrandProfile = DEFAULT_BRAND_PROFILE;

export const TEST_BRIEF: ProjectBrief = {
  brandProfileId: "24march-studio",
  workflowType: "website",
  projectGoal: "Créer la structure et les textes de la homepage du site.",
  specificContext: "Le site doit présenter le studio, sa méthode, ses offres et donner envie de réserver un audit.",
  deliverableType: "Homepage complète avec hero, sections, CTA, FAQ et prompts image.",
  references: "Luxe éditorial chic, collage scrapbook premium.",
  constraints: "Pas de rendu SaaS générique.",
  channels: "Site internet",
  format: "Markdown",
  successCriteria: "Le visiteur pense 'je veux vivre là'.",
};

const LONG_PARAGRAPH =
  "24March Studio n'est pas seulement un service de décoration, c'est une direction artistique d'intérieur pensée pour des espaces personnels, photogéniques et identitaires. " +
  "La méthode part toujours de l'univers du client avant de proposer un concept, un moodboard et un plan de mise en œuvre concret. ";

export const FULL_WEBSITE_RESPONSE = `## Positionnement web
${LONG_PARAGRAPH}${LONG_PARAGRAPH}

## Promesse du hero
Ton intérieur devient un espace qui te ressemble, qui se vit et qui se montre.

## Arborescence
- Accueil
- Méthode
- Offres
- Portfolio
- Contact

## Structure de la homepage
- Hero avec promesse et CTA principal
- Section méthode en 3 étapes
- Section preuve sociale avec témoignages
- Section offres avec CTA secondaire
- Footer avec FAQ et contact

## Copywriting de chaque section
${LONG_PARAGRAPH}${LONG_PARAGRAPH}${LONG_PARAGRAPH}

## Appels à l’action
- Réserve ton audit gratuit
- Découvre la méthode complète

## Éléments de preuve
- Plus de 40 projets livrés en 2 ans
- Témoignages clients vérifiés sur Instagram

## Offres reformulées pour le web
Direction artistique d'intérieur complète avec concept, moodboard et plan de mise en œuvre. Sélection mobilier et objets curatée. Visualisation 3D de l'espace incluse dans chaque formule proposée aux clients.

## FAQ
**Q: Combien de temps dure une prestation ?**
**R: Entre 4 et 8 semaines selon le périmètre du projet.**

**Q: Faut-il déjà avoir des idées précises ?**
**R: Non, la méthode part de zéro et construit ton univers avec toi.**

**Q: Le studio intervient-il partout en France ?**
**R: Oui, à distance avec des visio dédiées et des livrables détaillés.**

**Q: Puis-je garder mes meubles actuels ?**
**R: Oui, la sélection s'articule autour de ce que tu veux garder.**

**Q: Quel est le budget moyen d'un projet ?**
**R: Cela dépend du périmètre, un devis est proposé après le premier échange.**

## Direction de l’image hero
Lifestyle éditorial à la maison, flash photo direct, cadrages proches, léger grand angle, reflets et matières fortes pour une énergie mode/magazine.

## Prompts image par section
- Hero : intérieur habité, flash photo, cadrage proche, reflets, énergie mode
- Méthode : moodboard détaillé, matières fortes, lumière naturelle
- Offres : détail mobilier stylé, composition éditoriale

## Bases SEO
Meta title : 24March Studio — Direction artistique d'intérieur
Meta description : Un studio de direction artistique d'intérieur pour des espaces personnels, désirables et photogéniques.

## Ton UX writing
Direct, visuel, sensible, un peu mode, accessible mais jamais basique — chaque micro-texte doit sonner comme une conversation, pas un mode d'emploi.
`;
