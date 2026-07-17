import { MemoryEntry } from "../agents/contracts";
import { ExternalTarget, ProgressEntry } from "./contracts";

/**
 * buildExternalAssistantContext — produces a COMPACT context package to paste
 * into ChatGPT / Claude / Claude Code. It never dumps raw memory: it filters to
 * active truth (approved decisions, constraints, latest deliverables) plus the
 * most recent progress, and respects a configurable size cap. Pure and
 * store-agnostic; the server wrapper feeds it data.
 */

const CHARS_PER_TOKEN = 4;
const DEFAULT_TOKEN_CAP = 2500;

const TARGET_FORMAT: Record<ExternalTarget, string> = {
  chatgpt: "Réponds en Markdown structuré. Termine par un bloc JSON `sessionReport` (projectId, summary, decisions, tasksCreated, tasksCompleted, deliverables, nextActions, memoryCandidates).",
  claude: "Réponds en Markdown structuré. Termine par un bloc JSON `sessionReport` réimportable dans Orbit.",
  "claude-code": "Tu travailles sur le dépôt. À la fin, POST un rapport structuré vers /api/integrations/claude-code/progress (voir ClaudeCodeReport). N'affirme rien comme vérifié sans preuve GitHub.",
};

export interface AssembleContextInput {
  projectId: string;
  projectName: string;
  objective: string;
  target: ExternalTarget;
  memory: MemoryEntry[];
  progress: ProgressEntry[];
  tokenCap?: number;
}

export interface AssembledContext {
  target: ExternalTarget;
  text: string;
  estimatedTokens: number;
  truncated: boolean;
}

export function buildExternalAssistantContext(input: AssembleContextInput): AssembledContext {
  const cap = input.tokenCap ?? DEFAULT_TOKEN_CAP;
  const active = input.memory.filter((e) => e.status !== "superseded" && e.status !== "rejected");

  const decisions = active.filter((e) => e.type === "decision" || (e.type === "validation" && e.status === "approved"));
  const constraints = active.filter((e) => e.type === "constraint");
  const deliverables = active.filter((e) => e.type === "deliverable" && e.status === "approved");
  const architecture = active.filter((e) => e.type === "analysis");
  const recentProgress = input.progress.slice(0, 5);
  const blockers = recentProgress.flatMap((p) => p.blockers);

  const sections: string[] = [];
  const push = (heading: string, lines: string[]) => {
    if (lines.length === 0) return;
    sections.push(`## ${heading}\n${lines.map((l) => `- ${l}`).join("\n")}`);
  };

  sections.push(`# Projet : ${input.projectName} (${input.projectId})`);
  sections.push(`## Objectif actuel\n${input.objective || "(non précisé)"}`);
  push("Décisions validées", decisions.map((d) => d.content));
  push("Contraintes actives", constraints.map((c) => c.content));
  push("Livrables approuvés", deliverables.map((d) => `${d.title} — ${d.content}`));
  push("Architecture utile", architecture.map((a) => a.content));
  push(
    "Derniers changements",
    recentProgress.map((p) => `[${p.source}] ${p.summary}${p.commitSha ? ` (${p.commitSha.slice(0, 7)})` : ""}`)
  );
  push("Problèmes ouverts / blocages", blockers);
  sections.push(`## À ne pas refaire\nNe reconstruis pas ce qui est déjà listé ci-dessus comme décidé ou livré.`);
  sections.push(`## Format de réponse attendu\n${TARGET_FORMAT[input.target]}`);

  // Assemble under the size cap, dropping lowest-priority trailing sections first.
  let text = sections.join("\n\n");
  let truncated = false;
  const maxChars = cap * CHARS_PER_TOKEN;
  if (text.length > maxChars) {
    truncated = true;
    // Keep identity + objective + format; trim the middle knowledge sections.
    const head = sections.slice(0, 3).join("\n\n");
    const tail = sections.slice(-2).join("\n\n");
    const budget = Math.max(0, maxChars - head.length - tail.length - 4);
    const middle = sections.slice(3, -2).join("\n\n").slice(0, budget);
    text = [head, middle, tail].filter(Boolean).join("\n\n");
  }

  return {
    target: input.target,
    text,
    estimatedTokens: Math.ceil(text.length / CHARS_PER_TOKEN),
    truncated,
  };
}
