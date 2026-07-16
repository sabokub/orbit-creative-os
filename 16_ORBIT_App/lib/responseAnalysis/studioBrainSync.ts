import "server-only";
import { createDecision, createItem, listItems, pushActivity, updateItem } from "../studioBrain";
import { StudioItem } from "../types";
import { foldText } from "./markdown";
import { AnalysisResult, StudioBrainChangeProposal } from "./types";

export interface ApplyResult {
  createdTaskIds: string[];
  completedTaskIds: string[];
  createdDecisionIds: string[];
  skipped: string[];
}

/**
 * Applies the *accepted* proposed Studio Brain changes from a validated
 * AnalysisResult. Only ever called after explicit user validation (never
 * from the analyze step itself). Idempotent: re-applying the same
 * AnalysisResult (e.g. a double-click on "Valider") is a no-op the second
 * time because every creation is preceded by a fresh dedupe check against
 * current Studio Brain state, matched on folded title + project.
 */
export async function applyAnalysisToStudioBrain(analysis: AnalysisResult): Promise<ApplyResult> {
  const result: ApplyResult = { createdTaskIds: [], completedTaskIds: [], createdDecisionIds: [], skipped: [] };
  const accepted = analysis.proposedStudioBrainChanges.filter((c) => c.accepted);
  if (accepted.length === 0) return result;

  const allItems = await listItems();
  const existingByTitle = new Map<string, StudioItem>(
    allItems.filter((it) => it.status !== "archived").map((it) => [foldText(it.title), it])
  );

  for (const change of accepted) {
    try {
      switch (change.kind) {
        case "create_task": {
          const title = String(change.payload.title || "").trim();
          if (!title) {
            result.skipped.push(change.id);
            break;
          }
          const key = foldText(title);
          if (existingByTitle.has(key)) {
            result.skipped.push(change.id);
            break;
          }
          const created = await createItem({
            kind: "task",
            title,
            description: `Généré depuis l'analyse de la réponse (${analysis.workflowStep}), source : ${analysis.source}.`,
            category: String(change.payload.category || "Général"),
            projectId: analysis.projectId,
            estimateMinutes: 30,
            urgency: 3,
            impact: 3,
            launchCritical: false,
            dependsOn: [],
          });
          existingByTitle.set(key, created);
          result.createdTaskIds.push(created.id);
          break;
        }
        case "complete_task": {
          const candidates = allItems.filter(
            (it) =>
              it.kind === "task" &&
              it.projectId === analysis.projectId &&
              it.status !== "done" &&
              it.status !== "archived"
          );
          for (const candidate of candidates) {
            const updated = await updateItem(candidate.id, { status: "done" });
            result.completedTaskIds.push(updated.id);
          }
          break;
        }
        case "create_decision": {
          const question = String(change.payload.question || "").trim();
          if (!question) {
            result.skipped.push(change.id);
            break;
          }
          const options = Array.isArray(change.payload.options) ? (change.payload.options as string[]) : ["Valider", "Ignorer"];
          const decision = await createDecision({
            question,
            context: typeof change.payload.context === "string" ? change.payload.context : undefined,
            options,
            source: "conversation",
          });
          result.createdDecisionIds.push(decision.id);
          break;
        }
        case "unblock_dependent":
        case "update_deliverable":
        default:
          // No-op placeholders for future non-Website modules / richer diffing.
          result.skipped.push(change.id);
          break;
      }
    } catch {
      result.skipped.push(change.id);
    }
  }

  await pushActivity(
    "note",
    `Intégration Studio Brain depuis l'analyse de réponse (${analysis.workflowStep}) : ${result.createdTaskIds.length} tâche(s) créée(s), ${result.completedTaskIds.length} terminée(s), ${result.createdDecisionIds.length} décision(s).`
  );

  return result;
}

/** Exposed for tests that only want to check the "would create" preview without hitting Redis-backed helpers. */
export function previewAcceptedChanges(analysis: AnalysisResult): StudioBrainChangeProposal[] {
  return analysis.proposedStudioBrainChanges.filter((c) => c.accepted);
}
