import {
  AgentExecutionInput,
  AgentExecutionInputSchema,
  AgentExecutionOutput,
  AnyAgentDefinition,
  MemoryEntry,
} from "./contracts";
import { getAgentDefinition } from "./registry";
import { resolveProjectContext } from "./context";
import { schemaToHint } from "./schemaHint";
import { MemoryService } from "./memory/service";

/**
 * Shared execution engine. Every agent runs through THIS function — the only
 * place that talks to the model. An agent is just a definition (role +
 * instructions + schema + deps); the engine resolves its context, builds one
 * prompt, makes one validated model call, and persists the result as a
 * versioned memory entry. No per-agent AI code, no duplicated context logic.
 */
export interface AgentRuntime {
  memory: MemoryService;
  /** The single model call path (defaults to generateJSONWithOpenAI in the route). */
  generate: (prompt: string) => Promise<string>;
  /** Fixed source of truth always included: Brand DNA + Project brief, rendered. */
  fixedContext: string;
  projectName: string;
}

const MAX_ATTEMPTS = 2;

function hasActiveOutput(entries: MemoryEntry[], role: string): boolean {
  return entries.some(
    (e) => e.agentRole === role && e.status !== "rejected" && e.status !== "superseded"
  );
}

function buildPrompt(
  def: AnyAgentDefinition,
  runtime: AgentRuntime,
  renderedContext: string,
  userIntent?: string
): string {
  const parts = [
    def.instructions,
    "",
    "=== SOURCE DE VÉRITÉ FIXE (Brand DNA + Brief) ===",
    runtime.fixedContext,
    "",
    "=== CONTEXTE PROJET SÉLECTIONNÉ (mémoire) ===",
    renderedContext || "(aucune mémoire projet pertinente pour l'instant)",
  ];

  if (userIntent && userIntent.trim()) {
    parts.push("", "=== INTENTION UTILISATEUR POUR CETTE ÉTAPE ===", userIntent.trim());
  }

  parts.push(
    "",
    "=== FORMAT DE SORTIE ATTENDU ===",
    "Réponds UNIQUEMENT avec un objet JSON valide correspondant exactement à ce schéma (les valeurs sont des placeholders de type, remplace-les par du contenu réel) :",
    schemaToHint(def.outputSchema),
    "",
    "Ne renvoie aucun texte hors du JSON. N'ajoute pas de clés supplémentaires."
  );

  return parts.join("\n");
}

export async function runAgent(
  rawInput: AgentExecutionInput,
  runtime: AgentRuntime
): Promise<AgentExecutionOutput> {
  const input = AgentExecutionInputSchema.parse(rawInput);
  const def = getAgentDefinition(input.role);
  const createdAt = new Date().toISOString();

  const entries = await runtime.memory.list(input.projectId);

  // Precondition: every required dependency must already have an active output.
  const missingRequired = def.dependencies
    .filter((d) => d.required && !hasActiveOutput(entries, d.role))
    .map((d) => d.role);
  if (missingRequired.length > 0) {
    return {
      role: input.role,
      status: "skipped",
      memoryEntryIds: [],
      contextTrace: [],
      createdAt,
      error: `Dépendance(s) requise(s) manquante(s) : ${missingRequired.join(", ")}. Lance-les d'abord.`,
    };
  }

  const ctx = resolveProjectContext(input.projectId, def, entries, { boostTypes: input.boostTypes });
  const prompt = buildPrompt(def, runtime, ctx.rendered, input.userIntent);

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const raw = await runtime.generate(prompt);
      const json = safeParseJson(raw);
      const parsed = def.outputSchema.parse(json);
      const summary = def.summarize(parsed);
      const entry = await runtime.memory.recordAgentOutput({
        projectId: input.projectId,
        agentRole: input.role,
        type: def.produces,
        title: `${def.title} — ${runtime.projectName}`,
        content: summary,
        data: parsed as Record<string, unknown>,
        runId: input.runId,
        source: input.role === "orbit-critic" ? "critic" : "agent",
      });
      return {
        role: input.role,
        status: "completed",
        output: parsed as Record<string, unknown>,
        summary,
        memoryEntryIds: [entry.id],
        contextTrace: ctx.trace,
        createdAt,
      };
    } catch (err) {
      lastError = (err as Error).message;
    }
  }

  return {
    role: input.role,
    status: "failed",
    memoryEntryIds: [],
    contextTrace: ctx.trace,
    createdAt,
    error: `Sortie invalide après ${MAX_ATTEMPTS} tentative(s) : ${lastError}`,
  };
}

/** Tolerates a model that wraps JSON in prose or ```json fences. */
function safeParseJson(raw: string): unknown {
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Réponse du modèle non-JSON.");
  }
}
