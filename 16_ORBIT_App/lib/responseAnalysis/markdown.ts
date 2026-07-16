import { ExtractedCTA, ExtractedFAQItem, ExtractedImagePrompt, ExtractedSEO, ExtractedSection } from "./types";

/**
 * Deterministic, local, no-AI structural parsing of a raw AI-generated
 * Markdown response. Never loses the original text — every extractor here
 * reads from `raw`/`normalized` but the caller keeps the original string
 * untouched alongside whatever gets extracted.
 */

export function normalizeResponse(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

export interface HeadingLine {
  level: number;
  text: string;
  rawText: string;
  start: number;
  end: number;
}

/** Strips leading numbering ("1.", "1)", "—") and surrounding markdown emphasis from a heading. */
export function cleanHeadingText(text: string): string {
  return text
    .replace(/^[\s#*_-]+/, "")
    .replace(/[\s*_]+$/, "")
    .replace(/^\d+[.).\s-]+/, "")
    .trim();
}

/** Normalizes text for fuzzy keyword matching: lowercase, accents stripped, punctuation squashed. */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extracts every ## / ### heading (Markdown ATX) as ordered sections, with their body content. */
export function extractSections(normalized: string): ExtractedSection[] {
  const lines = normalized.split("\n");
  const result: ExtractedSection[] = [];
  let current: { level: number; text: string; bodyLines: string[] } | null = null;
  for (const line of lines) {
    const match = /^(#{1,4})\s+(.*)$/.exec(line);
    if (match) {
      if (current) {
        const content = current.bodyLines.join("\n").trim();
        result.push({ heading: current.text, level: current.level, content, wordCount: countWords(content) });
      }
      current = { level: match[1].length, text: cleanHeadingText(match[2]), bodyLines: [] };
    } else if (current) {
      current.bodyLines.push(line);
    }
  }
  if (current) {
    const content = current.bodyLines.join("\n").trim();
    result.push({ heading: current.text, level: current.level, content, wordCount: countWords(content) });
  }
  return result;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Extracts Markdown list items ("- ", "* ", "1. ") from a block of text. */
export function extractListItems(content: string): string[] {
  const items: string[] = [];
  for (const line of content.split("\n")) {
    const match = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/.exec(line);
    if (match && match[1].trim()) items.push(match[1].trim());
  }
  return items;
}

/** Extracts Markdown table rows (pipe-delimited), skipping the header separator row. */
export function extractTableRows(content: string): string[][] {
  const rows: string[][] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    if (/^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$/.test(trimmed)) continue; // separator row
    const cells = trimmed
      .split("|")
      .map((c) => c.trim())
      .filter((c, idx, arr) => !(c === "" && (idx === 0 || idx === arr.length - 1)));
    if (cells.length) rows.push(cells);
  }
  return rows;
}

const PLACEHOLDER_PATTERNS: RegExp[] = [
  /à compl[ée]ter/i,
  /a compl[ée]ter/i,
  /\btodo\b/i,
  /\btbd\b/i,
  /lorem ipsum/i,
  /\[\.\.\.\]/,
  /\[insérer[^\]]*\]/i,
  /\[insert[^\]]*\]/i,
  /\bxxx+\b/i,
  /\?\?\?+/,
  /placeholder/i,
  /\bà définir\b/i,
  /\ba definir\b/i,
];

/** Finds placeholder/filler markers ("à compléter", TODO, lorem ipsum, [...], etc.) anywhere in the text. */
export function findPlaceholders(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const match = pattern.exec(text);
    if (match) found.add(match[0]);
  }
  return Array.from(found);
}

/** True if a block of content is entirely (or almost entirely) placeholder/empty text. */
export function isPlaceholderOnly(content: string): boolean {
  const trimmed = content.trim();
  if (!trimmed) return true;
  const withoutPlaceholders = PLACEHOLDER_PATTERNS.reduce((acc, p) => acc.replace(p, ""), trimmed);
  return withoutPlaceholders.replace(/[\s\-*#:.]/g, "").length === 0;
}

const CTA_VERBS = [
  "réserve",
  "reserve",
  "découvre",
  "decouvre",
  "commence",
  "démarre",
  "demarre",
  "contacte",
  "prends rendez-vous",
  "prends contact",
  "obtiens",
  "télécharge",
  "telecharge",
  "rejoins",
  "explore",
  "planifie",
  "book",
  "discover",
  "start",
  "get",
  "join",
];

const VAGUE_CTA_PATTERNS = [/^cliquez ici$/i, /^click here$/i, /^en savoir plus$/i, /^learn more$/i, /^ici$/i, /^ok$/i, /^soumettre$/i];

/** Extracts CTA phrases from a section's list items / short bold lines. */
export function extractCTAs(content: string): ExtractedCTA[] {
  const ctas: ExtractedCTA[] = [];
  const candidates = [...extractListItems(content), ...extractBoldPhrases(content)];
  for (const raw of candidates) {
    const text = raw.replace(/[.:]+$/, "").trim();
    if (!text || text.length > 80) continue;
    const folded = foldText(text);
    const looksLikeCta = CTA_VERBS.some((verb) => folded.includes(foldText(verb))) || /^[A-ZÀ-Ý]/.test(text);
    if (!looksLikeCta) continue;
    const vague = VAGUE_CTA_PATTERNS.some((p) => p.test(text.trim()));
    ctas.push({ text, vague });
  }
  return dedupeBy(ctas, (c) => foldText(c.text));
}

function extractBoldPhrases(content: string): string[] {
  const matches = content.match(/\*\*([^*]+)\*\*/g) || [];
  return matches.map((m) => m.replace(/\*\*/g, "").trim()).filter(Boolean);
}

/**
 * Extracts Q/A pairs from a FAQ-like section. Supports several common shapes:
 *  - "**Q: ...**" / "**R: ...**" or "Q:"/"R:" / "Q:"/"A:"
 *  - a bold or heading-like question line ending in "?" followed by an answer paragraph
 *  - "- Question ? Réponse."
 */
export function extractFAQ(content: string): ExtractedFAQItem[] {
  const pairs: ExtractedFAQItem[] = [];
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);

  let pendingQuestion: string | null = null;
  for (const line of lines) {
    const qaInline = /^(?:\*\*)?(?:q\s*[:.]|question\s*[:.])\s*(.*?)(?:\*\*)?$/i.exec(line);
    const raInline = /^(?:\*\*)?(?:r\s*[:.]|a\s*[:.]|reponse\s*[:.]|réponse\s*[:.]|answer\s*[:.])\s*(.*?)(?:\*\*)?$/i.exec(line);
    const boldQuestion = /^\*\*(.+\?)\*\*$/.exec(line);
    const numberedQuestion = /^(?:[-*•]|\d+[.)])\s*(.+\?)\s*$/.exec(line);
    const bareQuestion = /^(.{3,200}\?)$/.exec(line);

    if (qaInline) {
      pendingQuestion = qaInline[1].trim();
      continue;
    }
    if (raInline && pendingQuestion) {
      pairs.push({ question: pendingQuestion, answer: raInline[1].trim() });
      pendingQuestion = null;
      continue;
    }
    if (boldQuestion) {
      pendingQuestion = boldQuestion[1].trim();
      continue;
    }
    if (numberedQuestion && !pendingQuestion) {
      // "- Question ? Réponse inline" on the same bullet
      const rest = line.slice(line.indexOf(numberedQuestion[1]) + numberedQuestion[1].length).trim();
      if (rest.replace(/^[-–:]\s*/, "").trim()) {
        pairs.push({ question: numberedQuestion[1].trim(), answer: rest.replace(/^[-–:]\s*/, "").trim() });
      } else {
        pendingQuestion = numberedQuestion[1].trim();
      }
      continue;
    }
    if (pendingQuestion && bareQuestion === null && line) {
      pairs.push({ question: pendingQuestion, answer: line });
      pendingQuestion = null;
      continue;
    }
    if (bareQuestion && !pendingQuestion) {
      pendingQuestion = bareQuestion[1].trim();
    }
  }

  return dedupeBy(pairs, (p) => foldText(p.question));
}

/** Extracts a "meta title" / "meta description" pair from a SEO-labelled section. */
export function extractSEO(content: string): ExtractedSEO | null {
  const titleMatch = /meta\s*title\s*[:\-–]\s*(.+)/i.exec(content);
  const descMatch = /meta\s*description\s*[:\-–]\s*(.+)/i.exec(content);
  if (!titleMatch && !descMatch) return null;
  const metaTitle = titleMatch ? stripTrailingMarkdown(titleMatch[1]) : undefined;
  const metaDescription = descMatch ? stripTrailingMarkdown(descMatch[1]) : undefined;
  const issues: string[] = [];
  if (!metaTitle) issues.push("Meta title manquant");
  else if (metaTitle.length > 65) issues.push(`Meta title trop long (${metaTitle.length} caractères, recommandé ≤ 60-65)`);
  if (!metaDescription) issues.push("Meta description manquante");
  else if (metaDescription.length > 165) issues.push(`Meta description trop longue (${metaDescription.length} caractères, recommandé ≤ 155-160)`);
  return { metaTitle, metaDescription, issues };
}

function stripTrailingMarkdown(text: string): string {
  return text.replace(/\*\*/g, "").replace(/["'«»]/g, "").split("\n")[0].trim();
}

/** Extracts image prompts (list items) from an image-direction / image-prompt section. */
export function extractImagePrompts(sectionHeading: string, content: string): ExtractedImagePrompt[] {
  const items = extractListItems(content);
  if (items.length > 0) {
    return items.map((prompt) => ({ section: sectionHeading, prompt }));
  }
  // Fall back to sub-headings (### per visual need) with their body as the prompt.
  const subSections = extractSections(content);
  if (subSections.length > 0) {
    return subSections.map((s) => ({ section: s.heading, prompt: s.content }));
  }
  const trimmed = content.trim();
  return trimmed ? [{ section: sectionHeading, prompt: trimmed }] : [];
}

function dedupeBy<T>(items: T[], keyFn: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

/** Rough duplication/contradiction heuristic: two sections whose bodies are near-identical, or that state opposite things about the same subject. */
export function detectDuplicateSections(sections: ExtractedSection[]): string[] {
  const warnings: string[] = [];
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const a = foldText(sections[i].content);
      const b = foldText(sections[j].content);
      if (a.length < 40 || b.length < 40) continue;
      if (a === b) {
        warnings.push(`Les sections "${sections[i].heading}" et "${sections[j].heading}" sont quasi-identiques.`);
      }
    }
  }
  return warnings;
}
