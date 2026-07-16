import { countWords, extractCTAs, extractFAQ, extractListItems, extractSEO, foldText, isPlaceholderOnly } from "../markdown";
import { DeliverableSpec, ModuleContract } from "./types";

/**
 * Website module contract — mirrors the 13 deliverables required by
 * WEBSITE_TEMPLATE in lib/prompts.ts, in the exact same order. Completeness
 * is never just "heading exists": each deliverable has a real minimum-content
 * check so a heading with no substance (or only a placeholder) is reported
 * as missing/partial, never complete.
 */

function missingBecauseNoHeading(label: string) {
  return { status: "missing" as const, reasons: [`Aucune section "${label}" détectée dans la réponse.`] };
}

function placeholderReasons(): string[] {
  return ["La section ne contient que des placeholders ou du texte générique (à compléter, TODO, [...], etc.)."];
}

const WEBSITE_DELIVERABLES: DeliverableSpec[] = [
  {
    id: "positioning-web",
    label: "Positionnement web",
    headingKeywords: ["positionnement web", "positionnement"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Positionnement web");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      if (section.content.length < 200) {
        return { status: "partial", reasons: [`Section trop courte (${section.content.length} caractères, minimum recommandé 200).`] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "hero-promise",
    label: "Promesse du hero",
    headingKeywords: ["promesse du hero", "promesse hero", "hero"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Promesse du hero");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      if (section.content.length < 30) {
        return { status: "partial", reasons: ["Promesse hero trop courte ou incomplète."] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "sitemap",
    label: "Arborescence",
    headingKeywords: ["arborescence", "sitemap", "plan du site"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Arborescence");
      const items = extractListItems(section.content);
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      if (items.length < 3) {
        return { status: "partial", reasons: [`Seulement ${items.length} page(s)/entrée(s) listée(s), minimum recommandé 3.`] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "homepage-structure",
    label: "Structure de la homepage",
    headingKeywords: ["structure de la homepage", "structure homepage", "structure de la page d accueil"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Structure de la homepage");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      const items = extractListItems(section.content);
      if (items.length < 3 && section.content.length < 150) {
        return { status: "partial", reasons: ["Structure trop sommaire (moins de 3 sections listées et texte court)."] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "section-copywriting",
    label: "Copywriting de chaque section",
    headingKeywords: ["copywriting de chaque section", "copywriting", "textes de chaque section"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Copywriting de chaque section");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      if (section.content.length < 400) {
        return { status: "partial", reasons: [`Copywriting trop court (${section.content.length} caractères, minimum recommandé 400).`] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "ctas",
    label: "Appels à l’action",
    headingKeywords: ["appels a l action", "appel a l action", "cta"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Appels à l’action");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      const ctas = extractCTAs(section.content);
      if (ctas.length < 2) {
        return { status: "partial", reasons: [`Seulement ${ctas.length} CTA détecté(s), minimum recommandé 2.`] };
      }
      if (ctas.every((c) => c.vague)) {
        return { status: "partial", reasons: ["Tous les CTA détectés sont vagues (ex: \"cliquez ici\")."] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "proof-elements",
    label: "Éléments de preuve",
    headingKeywords: ["elements de preuve", "preuve"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Éléments de preuve");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      const items = extractListItems(section.content);
      if (items.length < 2 && section.content.length < 150) {
        return { status: "partial", reasons: ["Trop peu d'éléments de preuve concrets."] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "offers-web",
    label: "Offres reformulées pour le web",
    headingKeywords: ["offres reformulees pour le web", "offres pour le web", "offres reformulees"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Offres reformulées pour le web");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      if (section.content.length < 150) {
        return { status: "partial", reasons: ["Offres décrites trop sommairement."] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "faq",
    label: "FAQ (5-8 Q/R)",
    headingKeywords: ["faq", "questions reponses", "foire aux questions"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("FAQ");
      const pairs = extractFAQ(section.content);
      if (pairs.length === 0) {
        return { status: "missing", reasons: ["Le titre FAQ existe mais aucune paire question/réponse n'a été détectée."] };
      }
      if (pairs.length < 5) {
        return { status: "partial", reasons: [`Seulement ${pairs.length} question(s)/réponse(s), minimum attendu 5.`] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "hero-image-direction",
    label: "Direction de l’image hero",
    headingKeywords: ["direction de l image hero", "direction image hero", "image hero"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Direction de l’image hero");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      if (section.content.length < 80) {
        return { status: "partial", reasons: ["Direction de l'image hero trop courte pour être exploitable."] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "section-image-prompts",
    label: "Prompts image par section",
    headingKeywords: ["prompts image par section", "prompts image", "prompt image"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Prompts image par section");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      const items = extractListItems(section.content);
      if (items.length < 3 && section.content.length < 200) {
        return { status: "partial", reasons: [`Seulement ${items.length} prompt(s) image détecté(s), minimum recommandé 3.`] };
      }
      return { status: "complete", reasons: [] };
    },
  },
  {
    id: "seo-basics",
    label: "Bases SEO",
    headingKeywords: ["bases seo", "seo"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Bases SEO");
      const seo = extractSEO(section.content);
      if (!seo || (!seo.metaTitle && !seo.metaDescription)) {
        return { status: "missing", reasons: ["Ni meta title ni meta description détectés."] };
      }
      if (!seo.metaTitle || !seo.metaDescription) {
        return { status: "partial", reasons: [seo.metaTitle ? "Meta description manquante." : "Meta title manquant."] };
      }
      return { status: seo.issues.length > 0 ? "partial" : "complete", reasons: seo.issues };
    },
  },
  {
    id: "ux-writing-tone",
    label: "Ton UX writing",
    headingKeywords: ["ton ux writing", "ux writing", "ton"],
    evaluate: (section) => {
      if (!section) return missingBecauseNoHeading("Ton UX writing");
      if (isPlaceholderOnly(section.content)) return { status: "missing", reasons: placeholderReasons() };
      if (section.content.length < 80) {
        return { status: "partial", reasons: ["Description du ton UX writing trop courte."] };
      }
      return { status: "complete", reasons: [] };
    },
  },
];

export const WEBSITE_CONTRACT: ModuleContract = {
  workflowStep: "website",
  implemented: true,
  deliverables: WEBSITE_DELIVERABLES,
};

export function websiteHeadingKeywordSet(): string[] {
  return WEBSITE_DELIVERABLES.flatMap((d) => d.headingKeywords);
}

// Re-exported so tests / other contracts can share the same fold implementation.
export { foldText, countWords };
