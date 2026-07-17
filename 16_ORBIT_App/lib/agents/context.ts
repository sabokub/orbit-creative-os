import {
  AnyAgentDefinition,
  ContextTraceEntry,
  MemoryEntry,
  ProjectContext,
} from "./contracts";

/**
 * Central context resolution (context continuity). Pure and store-agnostic:
 * given an agent definition and the full project memory, it selects ONLY the
 * relevant slice — never the whole raw memory — and renders a size-capped,
 * traceable context string.
 *
 * Selection priority (higher = kept first under the size cap):
 *  - approved truth outranks drafts
 *  - constraints, brief/intake, decisions are foundational
 *  - outputs from this agent's declared dependencies are essential
 *  - critic feedback is included so revisions actually address it
 *  - superseded and rejected entries are NEVER active truth (excluded)
 */

const CHARS_PER_TOKEN = 4;
const DEFAULT_TOKEN_CAP = 6000;

function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function priorityOf(entry: MemoryEntry, dependencyRoles: Set<string>): number {
  let score = 0;
  if (entry.status === "approved") score += 100;
  if (entry.type === "constraint") score += 60;
  if (entry.type === "brief" || entry.type === "intake") score += 55;
  if (entry.type === "decision") score += 50;
  if (entry.type === "validation") score += 45;
  if (entry.agentRole && dependencyRoles.has(entry.agentRole)) score += 70;
  if (entry.type === "deliverable") score += 30;
  if (entry.type === "feedback") score += 40;
  if (entry.type === "analysis") score += 35;
  if (entry.type === "reference") score += 20;
  // Gentle recency nudge so ties resolve toward newer knowledge.
  score += Math.min(10, entry.version);
  return score;
}

function reasonFor(entry: MemoryEntry, dependencyRoles: Set<string>): string {
  if (entry.agentRole && dependencyRoles.has(entry.agentRole)) return `Sortie d'une dépendance (${entry.agentRole}).`;
  if (entry.type === "constraint") return "Contrainte projet.";
  if (entry.type === "brief" || entry.type === "intake") return "Brief / intake initial.";
  if (entry.type === "decision") return "Décision projet.";
  if (entry.type === "validation") return "Élément validé.";
  if (entry.type === "feedback") return "Feedback à intégrer.";
  return `Mémoire pertinente (${entry.type}).`;
}

export interface ResolveOptions {
  tokenCap?: number;
}

export function resolveProjectContext(
  projectId: string,
  definition: AnyAgentDefinition,
  entries: MemoryEntry[],
  options: ResolveOptions = {}
): ProjectContext {
  const tokenCap = options.tokenCap ?? DEFAULT_TOKEN_CAP;
  const dependencyRoles = new Set(definition.dependencies.map((d) => d.role));

  // Active truth only: drop superseded and rejected entries entirely.
  const active = entries.filter((e) => e.status !== "superseded" && e.status !== "rejected");

  const ranked = active
    .map((entry) => ({ entry, priority: priorityOf(entry, dependencyRoles) }))
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return b.entry.createdAt.localeCompare(a.entry.createdAt);
    });

  const selected: MemoryEntry[] = [];
  const trace: ContextTraceEntry[] = [];
  let usedTokens = 0;
  let truncated = false;

  for (const { entry } of ranked) {
    const block = renderEntry(entry);
    const tokens = estimateTokens(block);
    if (usedTokens + tokens > tokenCap) {
      truncated = true;
      continue;
    }
    usedTokens += tokens;
    selected.push(entry);
    trace.push({
      memoryId: entry.id,
      type: entry.type,
      status: entry.status,
      reason: reasonFor(entry, dependencyRoles),
      estimatedTokens: tokens,
    });
  }

  const rendered = selected.map(renderEntry).join("\n\n");

  return {
    projectId,
    role: definition.role,
    rendered,
    entries: selected,
    trace,
    estimatedTokens: usedTokens,
    truncated,
  };
}

function renderEntry(entry: MemoryEntry): string {
  const header = `[${entry.type.toUpperCase()}${entry.status === "approved" ? " · APPROUVÉ" : ""}] ${entry.title}`;
  return `${header}\n${entry.content}`;
}
