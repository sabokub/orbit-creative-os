import "server-only";
import { z } from "zod";
import { generateJSONWithOpenAI } from "../openai";
import { BrandProfile, ProjectBrief } from "../types";

/**
 * Semantic analysis: the one AI call in the whole pipeline. Used only for
 * genuinely semantic judgments the structural parser cannot make —
 * classification confidence, writing quality, Brand DNA / brief coherence,
 * contradiction/tone detection, recommendations. Never used for structural
 * parsing (headings/lists/CTAs/etc. — see markdown.ts).
 *
 * Output is Zod-validated. On invalid JSON structure, one retry is attempted
 * with a stricter reminder prompt; if that also fails, the caller falls back
 * to structural-only analysis and must say so explicitly (never fakes a
 * quality score).
 */

const SemanticResultSchema = z.object({
  qualityScore: z.number().min(0).max(100),
  brandCoherenceScore: z.number().min(0).max(100),
  brandCoherenceIssues: z.array(z.string().max(400)).max(20),
  briefCoherenceScore: z.number().min(0).max(100),
  briefCoherenceIssues: z.array(z.string().max(400)).max(20),
  contradictions: z.array(z.string().max(400)).max(20),
  toneMismatch: z.boolean(),
  vagueCtas: z.array(z.string().max(200)).max(20),
  weakImagePrompts: z.array(z.string().max(200)).max(20),
  recommendations: z.array(z.string().max(400)).max(20),
  summary: z.string().max(1200),
});

export type SemanticResult = z.infer<typeof SemanticResultSchema>;

export interface SemanticAnalysisOutcome {
  performed: boolean;
  result?: SemanticResult;
  error?: string;
}

/** Hard cap on the response text sent to the semantic pass — protects cost/latency and avoids pathological payloads. */
const MAX_SEMANTIC_INPUT_CHARS = 18_000;

function buildSemanticPrompt(
  responseText: string,
  brand: BrandProfile,
  brief: ProjectBrief,
  moduleLabel: string
): string {
  const truncated = responseText.length > MAX_SEMANTIC_INPUT_CHARS
    ? `${responseText.slice(0, MAX_SEMANTIC_INPUT_CHARS)}\n\n[...tronqué pour l'analyse...]`
    : responseText;

  return `Tu es un évaluateur qualité pour un studio de création. Analyse le livrable ci-dessous (module : ${moduleLabel}) par rapport à l'ADN de marque et au brief du projet, et réponds UNIQUEMENT avec un objet JSON valide respectant exactement ce schéma :
{
  "qualityScore": number (0-100),
  "brandCoherenceScore": number (0-100),
  "brandCoherenceIssues": string[],
  "briefCoherenceScore": number (0-100),
  "briefCoherenceIssues": string[],
  "contradictions": string[],
  "toneMismatch": boolean,
  "vagueCtas": string[],
  "weakImagePrompts": string[],
  "recommendations": string[],
  "summary": string (2-4 phrases, en français)
}

ADN de marque :
Nom : ${brand.name}
Positionnement : ${brand.positioning}
Ton de voix : ${brand.toneOfVoice}
Direction visuelle : ${brand.visualDirection}
À éviter : ${brand.avoid.join(", ")}

Brief du projet :
Objectif : ${brief.projectGoal}
Contexte : ${brief.specificContext}
Critères de réussite : ${brief.successCriteria}

Livrable à évaluer :
${truncated}

Ne réponds qu'avec le JSON, sans texte autour, sans balises markdown.`;
}

async function attemptParse(raw: string): Promise<SemanticResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Réponse d'analyse sémantique non-JSON.");
  }
  const validated = SemanticResultSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Structure d'analyse sémantique invalide : ${validated.error.issues[0]?.message || "schéma non respecté"}.`);
  }
  return validated.data;
}

export async function runSemanticAnalysis(
  responseText: string,
  brand: BrandProfile,
  brief: ProjectBrief,
  moduleLabel: string
): Promise<SemanticAnalysisOutcome> {
  if (!process.env.OPENAI_API_KEY) {
    return { performed: false, error: "Aucune clé OpenAI configurée — analyse structurelle uniquement." };
  }
  if (!responseText.trim()) {
    return { performed: false, error: "Réponse vide, analyse sémantique ignorée." };
  }

  const prompt = buildSemanticPrompt(responseText, brand, brief, moduleLabel);

  try {
    const raw = await generateJSONWithOpenAI(prompt);
    const result = await attemptParse(raw);
    return { performed: true, result };
  } catch (firstErr) {
    // One controlled retry with a stricter reminder, then fail gracefully.
    try {
      const retryPrompt = `${prompt}\n\nRappel strict : réponds avec un unique objet JSON valide, sans aucun texte, préambule ou balise markdown autour.`;
      const raw = await generateJSONWithOpenAI(retryPrompt);
      const result = await attemptParse(raw);
      return { performed: true, result };
    } catch (secondErr) {
      return {
        performed: false,
        error: `Analyse sémantique indisponible : ${(secondErr as Error).message || (firstErr as Error).message}`,
      };
    }
  }
}
