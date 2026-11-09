/** Translate infrastructure failures to actionable, non-sensitive UI text. */
export function explainOrbitError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error ?? "Erreur inconnue");
  if (/fetch failed|failed to fetch|networkerror|REDIS_CONNECT_FAILED/i.test(raw)) {
    return "Base de données Redis inaccessible. La connexion au service distant a échoué. Vérifie l’intégration Redis dans Vercel puis réessaie. Tes données n’ont pas été modifiées.";
  }
  if (/Aucune base connectée|UPSTASH_REDIS_REST_URL|KV_REST_API_URL/i.test(raw)) {
    return "Configuration Redis manquante. Vérifie que les variables d’environnement de l’intégration sont disponibles en Preview et Production.";
  }
  return raw;
}
