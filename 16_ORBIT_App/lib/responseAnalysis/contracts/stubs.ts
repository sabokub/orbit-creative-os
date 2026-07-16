import { isPlaceholderOnly } from "../markdown";
import { DeliverableSpec, ModuleContract } from "./types";

/**
 * Scaffold contracts for modules other than Website. Deliberately minimal —
 * out of scope for this PR to fully implement (see project brief). Each one
 * still plugs into the same `ModuleContract` interface so the pipeline stays
 * uniform, and is honestly flagged `implemented: false` so the UI/analysis
 * result can say "generic analysis only" instead of pretending these are as
 * rigorous as the Website contract.
 */

function genericDeliverable(id: string, label: string, keywords: string[]): DeliverableSpec {
  return {
    id,
    label,
    headingKeywords: keywords,
    evaluate: (section) => {
      if (!section) return { status: "missing", reasons: [`Aucune section "${label}" détectée.`] };
      if (isPlaceholderOnly(section.content)) {
        return { status: "missing", reasons: ["Section composée uniquement de placeholders."] };
      }
      if (section.content.length < 60) {
        return { status: "partial", reasons: ["Section très courte."] };
      }
      return { status: "complete", reasons: [] };
    },
  };
}

export const STRATEGY_CONTRACT: ModuleContract = {
  workflowStep: "strategy",
  implemented: false,
  deliverables: [
    genericDeliverable("diagnostic", "Diagnostic", ["diagnostic"]),
    genericDeliverable("insight", "Insight cible", ["insight"]),
    genericDeliverable("positioning", "Positionnement", ["positionnement"]),
    genericDeliverable("promise", "Promesse", ["promesse"]),
    genericDeliverable("pillars", "Piliers de message", ["piliers"]),
    genericDeliverable("risks", "Risques", ["risque"]),
    genericDeliverable("next-actions", "Prochaines actions", ["prochaine action", "action"]),
  ],
};

export const CREATIVE_CONTRACT: ModuleContract = {
  workflowStep: "creative",
  implemented: false,
  deliverables: [
    genericDeliverable("colors", "Comportement des couleurs", ["couleur"]),
    genericDeliverable("light", "Langage de lumière", ["lumiere"]),
    genericDeliverable("composition", "Langage de composition", ["composition"]),
    genericDeliverable("styling", "Styling", ["styling"]),
    genericDeliverable("creative-risks", "Risques créatifs", ["risque"]),
  ],
};

export const CONTENT_CONTRACT: ModuleContract = {
  workflowStep: "content",
  implemented: false,
  deliverables: [
    genericDeliverable("content-pillars", "Piliers de contenu", ["piliers de contenu", "pilier"]),
    genericDeliverable("formats", "Formats récurrents", ["format"]),
    genericDeliverable("post-ideas", "Idées de publications", ["idees de publications", "publication"]),
    genericDeliverable("reel-ideas", "Idées de reels", ["reel"]),
    genericDeliverable("hooks", "Accroches", ["accroche"]),
    genericDeliverable("captions", "Captions", ["caption"]),
    genericDeliverable("calendar", "Calendrier 30 jours", ["calendrier"]),
    genericDeliverable("reuse-logic", "Logique de réutilisation", ["reutilisation"]),
    genericDeliverable("channel-goals", "Objectifs par canal", ["objectif"]),
  ],
};

export const IMAGES_CONTRACT: ModuleContract = {
  workflowStep: "images",
  implemented: false,
  deliverables: [
    genericDeliverable("hero-brief", "Brief image hero", ["hero"]),
    genericDeliverable("section-briefs", "Briefs image par section", ["section"]),
    genericDeliverable("variants", "Variantes hero", ["variante"]),
    genericDeliverable("checklist", "Checklist de relecture", ["checklist"]),
  ],
};

export const REVIEW_CONTRACT: ModuleContract = {
  workflowStep: "review",
  implemented: false,
  deliverables: [
    genericDeliverable("verdict", "Verdict global", ["verdict"]),
    genericDeliverable("score", "Note sur 10", ["note"]),
    genericDeliverable("strengths", "Points forts", ["point fort", "force"]),
    genericDeliverable("issues", "Problèmes", ["probleme"]),
    genericDeliverable("severity", "Gravité", ["gravite"]),
    genericDeliverable("review-risks", "Risques", ["risque"]),
    genericDeliverable("fixes", "Corrections recommandées", ["correction"]),
    genericDeliverable("status", "Statut de validation", ["statut"]),
  ],
};
