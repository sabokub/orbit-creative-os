import "server-only";

const DEFAULT_MODEL = "gpt-4o-mini";

export async function generateWithOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Aucune clé OpenAI configurée. Ajoute OPENAI_API_KEY dans les variables d'environnement Vercel, ou continue en mode copier-coller (bouton Copier au-dessus)."
    );
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error?.message || `Requête OpenAI échouée (${res.status})`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Réponse OpenAI vide.");
  return content as string;
}

/**
 * Same call as `generateWithOpenAI` but requests strict JSON output
 * (`response_format: json_object`) and returns the raw string for the
 * caller to Zod-validate — this module never trusts model JSON blindly.
 * Used only for semantic analysis (classification/quality/coherence
 * judgments), never for structural parsing. Has an explicit timeout so a
 * hung request can't stall the whole review flow.
 */
export async function generateJSONWithOpenAI(prompt: string, timeoutMs = 25_000): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Aucune clé OpenAI configurée.");
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error?.message || `Requête OpenAI échouée (${res.status})`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("Réponse OpenAI vide.");
    return content as string;
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Analyse sémantique OpenAI expirée après ${timeoutMs}ms.`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
