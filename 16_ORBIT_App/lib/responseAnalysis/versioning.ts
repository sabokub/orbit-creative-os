import { extractSections, foldText, normalizeResponse } from "./markdown";
import { AnalysisResult } from "./types";

/**
 * "New version of an existing deliverable" detection + merge support (spec
 * item 10). Never silently overwrites a previously-saved output/review —
 * the apply route always looks at this diff first and requires an explicit
 * `versionAction` from the caller whenever a previous version exists.
 */

export interface VersionDiff {
  hasPreviousVersion: boolean;
  addedSections: string[];
  removedSections: string[];
  changedSections: string[];
  lengthDelta: number;
  /** True when the new response meaningfully differs from the previous one (new/removed/modified section). */
  significant: boolean;
}

export function diffAgainstPrevious(previousContent: string | undefined, analysis: AnalysisResult): VersionDiff {
  if (!previousContent || !previousContent.trim()) {
    return {
      hasPreviousVersion: false,
      addedSections: [],
      removedSections: [],
      changedSections: [],
      lengthDelta: analysis.normalizedResponse.length,
      significant: false,
    };
  }

  const oldSections = extractSections(normalizeResponse(previousContent));
  const oldMap = new Map(oldSections.map((s) => [foldText(s.heading), { heading: s.heading, content: s.content }]));
  const newMap = new Map(analysis.extractedSections.map((s) => [foldText(s.heading), { heading: s.heading, content: s.content }]));

  const addedSections = [...newMap.entries()].filter(([key]) => !oldMap.has(key)).map(([, v]) => v.heading);
  const removedSections = [...oldMap.entries()].filter(([key]) => !newMap.has(key)).map(([, v]) => v.heading);
  const changedSections = [...newMap.entries()]
    .filter(([key, v]) => oldMap.has(key) && oldMap.get(key)!.content.trim() !== v.content.trim())
    .map(([, v]) => v.heading);

  return {
    hasPreviousVersion: true,
    addedSections,
    removedSections,
    changedSections,
    lengthDelta: analysis.normalizedResponse.length - previousContent.length,
    significant: addedSections.length > 0 || removedSections.length > 0 || changedSections.length > 0,
  };
}

/**
 * Merge semantics: the new response wins for every section it defines; any
 * section that existed in the previous version but is entirely absent from
 * the new one is preserved, appended under a clearly-labelled marker so
 * nothing validated previously disappears silently.
 */
export function mergeWithPrevious(previousContent: string, analysis: AnalysisResult): string {
  const oldSections = extractSections(normalizeResponse(previousContent));
  const newHeadingKeys = new Set(analysis.extractedSections.map((s) => foldText(s.heading)));
  const preserved = oldSections.filter((s) => !newHeadingKeys.has(foldText(s.heading)));

  if (preserved.length === 0) return analysis.normalizedResponse;

  const preservedBlock = preserved
    .map((s) => `${"#".repeat(Math.min(4, Math.max(2, s.level)))} ${s.heading}\n\n${s.content}`)
    .join("\n\n");

  return `${analysis.normalizedResponse}\n\n---\n\n_Sections conservées de la version précédente (absentes de la nouvelle réponse) :_\n\n${preservedBlock}`;
}
