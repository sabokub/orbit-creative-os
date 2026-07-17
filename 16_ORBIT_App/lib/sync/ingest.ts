import {
  ConversationAnalysis,
  ConversationMessage,
  ConversationSource,
  ExtractedItem,
  ExtractionKind,
  ExternalConversation,
  Provenance,
} from "./contracts";

/**
 * Deterministic, offline ingestion. No model call — so a pasted conversation
 * becomes structured progress in milliseconds, and there is no prompt-injection
 * surface (external text is only ever read as data, never executed or trusted
 * as instructions). A later pass can layer an LLM extractor on top via the
 * agent engine; this baseline must always work without one.
 */

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** kind → { patterns, truth-changing? }. Order matters: earlier wins. */
const RULES: Array<{ kind: ExtractionKind; changesTruth: boolean; patterns: RegExp[] }> = [
  { kind: "rejection", changesTruth: true, patterns: [/\b(rejet|rejeté|on ne fait pas|abandonn|scrap|discard)/i] },
  { kind: "validation", changesTruth: true, patterns: [/\b(validé|validated|approuv|approved|ok pour|on valide|go pour)/i] },
  { kind: "decision", changesTruth: true, patterns: [/\b(décision|on décide|on part sur|we decided|choix\s*:|décidé|let's go with)/i] },
  { kind: "scope-change", changesTruth: true, patterns: [/\b(périmètre|scope change|hors scope|on ajoute au scope|nouvelle exigence)/i] },
  { kind: "technical-issue", changesTruth: false, patterns: [/\b(bug|erreur|error|crash|échoue|failing|broken)/i] },
  { kind: "task", changesTruth: false, patterns: [/(^|\s)(todo|à faire|tâche|action\s*:|- \[ \]|il faut|need to|we should)/i] },
  { kind: "deliverable", changesTruth: false, patterns: [/\b(livrable|deliverable|produit final|export prêt)/i] },
  { kind: "feedback", changesTruth: false, patterns: [/\b(feedback|retour|remarque|à améliorer|préférence)/i] },
  { kind: "progress-note", changesTruth: false, patterns: [/\b(terminé|fait|done|complété|shipped|mergé|déployé|fini)/i] },
  { kind: "hypothesis", changesTruth: false, patterns: [/\b(hypothèse|peut-être|maybe|probablement|je suppose|il se peut)/i] },
  { kind: "proposal", changesTruth: false, patterns: [/\b(proposition|je propose|suggestion|et si on|what if)/i] },
];

function classifyLine(line: string): { kind: ExtractionKind; changesTruth: boolean } {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(line))) return { kind: rule.kind, changesTruth: rule.changesTruth };
  }
  return { kind: "information", changesTruth: false };
}

function segments(text: string): string[] {
  return text
    .split(/\n|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4 && s.length <= 2000);
}

export function analyzeConversationText(projectId: string, text: string): ConversationAnalysis {
  const segs = segments(text);
  const items: ExtractedItem[] = [];
  const seen = new Set<string>();

  for (const seg of segs) {
    const { kind, changesTruth } = classifyLine(seg);
    if (kind === "information") continue; // don't flood the review queue with plain prose
    const key = `${kind}:${seg.toLowerCase().slice(0, 120)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      kind,
      content: seg.replace(/^[-*\d.\s\[\]x]+/, "").slice(0, 2000),
      requiresConfirmation: changesTruth,
      sourceExcerpt: seg.slice(0, 2000),
    });
  }

  const contradictions: string[] = [];
  const hasValidation = items.some((i) => i.kind === "validation");
  const hasRejection = items.some((i) => i.kind === "rejection");
  if (hasValidation && hasRejection) {
    contradictions.push("La conversation contient à la fois une validation et un rejet — vérifier lequel fait foi.");
  }

  const summary = segs.slice(0, 3).join(" ").slice(0, 4000) || text.slice(0, 4000);
  return { projectId, summary, items, contradictions };
}

export interface NormalizeInput {
  projectId: string;
  source: ConversationSource;
  title?: string;
  rawContent?: string;
  messages?: ConversationMessage[];
  externalId?: string;
  author?: string;
  participants?: string[];
}

/** Builds a normalized ExternalConversation, keeping the raw content for traceability. */
export function normalizeConversation(input: NormalizeInput): ExternalConversation {
  const now = new Date().toISOString();
  const provenance: Provenance = {
    source: input.source,
    externalId: input.externalId,
    author: input.author,
    capturedAt: now,
    rawRef: input.externalId,
    verification: input.source === "claude-code" ? "verified-in-code" : "declared",
  };
  const bodyText =
    input.rawContent || (input.messages || []).map((m) => `${m.role}: ${m.content}`).join("\n");
  return {
    id: genId("conv"),
    projectId: input.projectId,
    source: input.source,
    externalId: input.externalId,
    title: (input.title || bodyText.slice(0, 60) || "Conversation importée").slice(0, 300),
    participants: input.participants ?? [],
    messages: input.messages ?? [],
    rawContent: input.rawContent,
    startedAt: input.messages?.[0]?.at,
    updatedAt: now,
    importedAt: now,
    syncStatus: "analyzed",
    provenance,
    metadata: {},
  };
}

/** Flattens a conversation to text for analysis (messages or raw). */
export function conversationText(conversation: ExternalConversation): string {
  if (conversation.rawContent) return conversation.rawContent;
  return conversation.messages.map((m) => `${m.role}: ${m.content}`).join("\n");
}
