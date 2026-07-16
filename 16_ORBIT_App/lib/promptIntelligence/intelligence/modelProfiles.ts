import { TargetModel } from "../types";

/**
 * Model-specific adaptation profiles (issue #13, section 8). One configurable
 * place for model behavior — nothing else in the builder should special-case
 * a model by name. Every claim here is either a widely-documented general
 * practice or explicitly caveated as "unconfirmed" — no invented API
 * parameters (see knowledge item `model-quirk-image-model-param-caution`).
 */
export interface ModelProfile {
  targetModel: TargetModel;
  label: string;
  kind: "text" | "image" | "video" | "manual";
  /** Preferred section order for this model — a permutation of PromptSectionId, most important first. */
  sectionOrderHint: string[];
  instructionDensity: "compact" | "standard" | "detailed";
  markdownStructure: boolean;
  expectsJsonOrSchema: boolean;
  useNegativeConstraints: boolean;
  useCameraVocabulary: boolean;
  /** Approximate target length for the final prompt, in characters — a guideline for the budget system, not a hard API limit. */
  lengthTargetChars: number;
  referenceHandling: string;
  outputFormattingNote: string;
  /** Caveat shown in the UI/trace whenever this profile is used — keeps claims honest. */
  caveat?: string;
}

const OPENAI_TEXT: ModelProfile = {
  targetModel: "openai-text",
  label: "OpenAI — texte / raisonnement général",
  kind: "text",
  sectionOrderHint: ["role", "objective", "currentTask", "requiredDeliverable", "projectContext", "brandDNA", "priorDecisions", "methodRules", "constraints", "outputStructure", "verificationChecklist"],
  instructionDensity: "standard",
  markdownStructure: true,
  expectsJsonOrSchema: false,
  useNegativeConstraints: false,
  useCameraVocabulary: false,
  lengthTargetChars: 3200,
  referenceHandling: "Décrire les références en texte ; ne pas supposer que des fichiers joints sont disponibles.",
  outputFormattingNote: "Markdown avec des ## par livrable, comme attendu par le pipeline d'analyse ORBIT.",
};

const CLAUDE_TEXT: ModelProfile = {
  targetModel: "claude-text",
  label: "Claude — texte / raisonnement général",
  kind: "text",
  sectionOrderHint: ["role", "objective", "projectContext", "brandDNA", "priorDecisions", "currentTask", "requiredDeliverable", "methodRules", "constraints", "outputStructure", "verificationChecklist"],
  instructionDensity: "standard",
  markdownStructure: true,
  expectsJsonOrSchema: false,
  useNegativeConstraints: false,
  useCameraVocabulary: false,
  lengthTargetChars: 3400,
  referenceHandling: "Regrouper le contexte long sous des titres clairs pour éviter toute confusion entre les blocs de contexte.",
  outputFormattingNote: "Markdown avec des ## par livrable ; Claude gère bien un contexte long et bien étiqueté.",
};

const OPENAI_IMAGE: ModelProfile = {
  targetModel: "openai-image",
  label: "OpenAI — génération d'image",
  kind: "image",
  sectionOrderHint: ["currentTask", "requiredDeliverable", "constraints"],
  instructionDensity: "compact",
  markdownStructure: false,
  expectsJsonOrSchema: false,
  useNegativeConstraints: true,
  useCameraVocabulary: true,
  lengthTargetChars: 900,
  referenceHandling: "Décrire la référence visuelle en mots (sujet/matières/lumière) plutôt que renvoyer à un fichier.",
  outputFormattingNote: "Un seul paragraphe dense sujet → environnement → style → technique, pas de Markdown.",
  caveat: "Les paramètres d'API spécifiques (ratio, seed, etc.) évoluent souvent — ce profil ne les prescrit pas.",
};

const NANO_BANANA_IMAGE: ModelProfile = {
  targetModel: "nano-banana-image",
  label: "Nano Banana / style Gemini — génération d'image",
  kind: "image",
  sectionOrderHint: ["currentTask", "requiredDeliverable", "constraints"],
  instructionDensity: "compact",
  markdownStructure: false,
  expectsJsonOrSchema: false,
  useNegativeConstraints: true,
  useCameraVocabulary: true,
  lengthTargetChars: 900,
  referenceHandling: "Décrire la référence visuelle en mots ; ce profil ne suppose aucune fonctionnalité d'upload de référence spécifique.",
  outputFormattingNote: "Prompt en un bloc, vocabulaire concret (matières, lumière, caméra), contraintes négatives explicites en fin de prompt.",
  caveat: "Profil générique et prudent — pas de paramètre propriétaire non confirmé.",
};

const SORA_VIDEO: ModelProfile = {
  targetModel: "sora-video",
  label: "Style Sora / vidéo générative",
  kind: "video",
  sectionOrderHint: ["currentTask", "requiredDeliverable", "constraints"],
  instructionDensity: "compact",
  markdownStructure: false,
  expectsJsonOrSchema: false,
  useNegativeConstraints: true,
  useCameraVocabulary: true,
  lengthTargetChars: 1100,
  referenceHandling: "Décrire mouvement de caméra et rythme en mots ; pas de suppositions sur la durée maximale exacte du modèle.",
  outputFormattingNote: "Décrire scène, mouvement de caméra, rythme, durée approximative, contraintes négatives.",
  caveat: "Vocabulaire vidéo générique — les paramètres techniques précis (durée max, fps) ne sont pas asserés ici faute de confirmation.",
};

const MANUAL_EXPORT: ModelProfile = {
  targetModel: "manual-export",
  label: "Export manuel (copier-coller, modèle non spécifié)",
  kind: "manual",
  sectionOrderHint: ["role", "objective", "currentTask", "requiredDeliverable", "projectContext", "brandDNA", "priorDecisions", "methodRules", "constraints", "outputStructure", "verificationChecklist"],
  instructionDensity: "standard",
  markdownStructure: true,
  expectsJsonOrSchema: false,
  useNegativeConstraints: false,
  useCameraVocabulary: false,
  lengthTargetChars: 3200,
  referenceHandling: "Aucune hypothèse sur les capacités du modèle cible — prompt autosuffisant.",
  outputFormattingNote: "Markdown standard, comme le profil OpenAI texte, pour rester exploitable partout.",
};

const PROFILES: Record<TargetModel, ModelProfile> = {
  "openai-text": OPENAI_TEXT,
  "claude-text": CLAUDE_TEXT,
  "openai-image": OPENAI_IMAGE,
  "nano-banana-image": NANO_BANANA_IMAGE,
  "sora-video": SORA_VIDEO,
  "manual-export": MANUAL_EXPORT,
};

export function getModelProfile(model: TargetModel): ModelProfile {
  return PROFILES[model];
}

export function allModelProfiles(): ModelProfile[] {
  return Object.values(PROFILES);
}
