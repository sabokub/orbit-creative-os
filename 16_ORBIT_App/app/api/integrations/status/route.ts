import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type IntegrationState = "connected" | "available" | "missing" | "error";

type IntegrationStatus = {
  id: string;
  label: string;
  state: IntegrationState;
  detail: string;
  checkedAt: string;
};

function hasAny(...values: Array<string | undefined>) {
  return values.some(Boolean);
}

export async function GET() {
  const checkedAt = new Date().toISOString();
  const statuses: IntegrationStatus[] = [];

  const redisConnected = hasAny(
    process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN,
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
  statuses.push({
    id: "redis",
    label: "Redis / Upstash",
    state: redisConnected ? "connected" : "missing",
    detail: redisConnected ? "Plan ORBIT persistant et synchronisé." : "Variables Redis absentes.",
    checkedAt,
  });

  try {
    const response = await fetch("https://api.github.com/repos/sabokub/orbit-creative-os", {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 60 },
    });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const repo = await response.json() as { pushed_at?: string; default_branch?: string };
    statuses.push({
      id: "github",
      label: "GitHub",
      state: "connected",
      detail: `Repo accessible · branche ${repo.default_branch || "main"} · dernier push ${repo.pushed_at ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(repo.pushed_at)) : "inconnu"}.`,
      checkedAt,
    });
  } catch (error) {
    statuses.push({ id: "github", label: "GitHub", state: "error", detail: (error as Error).message, checkedAt });
  }

  const vercelConfigured = hasAny(process.env.VERCEL_ACCESS_TOKEN, process.env.VERCEL_TOKEN);
  statuses.push({
    id: "vercel",
    label: "Vercel",
    state: vercelConfigured ? "connected" : "available",
    detail: vercelConfigured ? "Jeton Vercel détecté. Les déploiements peuvent être synchronisés." : "Déploiement actif, mais aucun jeton serveur n’est configuré pour lire les builds dans ORBIT.",
    checkedAt,
  });

  const driveConfigured = hasAny(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  statuses.push({
    id: "drive",
    label: "Google Drive",
    state: driveConfigured ? "connected" : "missing",
    detail: driveConfigured ? "Identifiants Google détectés." : "OAuth ou compte de service Google à connecter.",
    checkedAt,
  });

  const calendarConfigured = hasAny(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_CALENDAR_REFRESH_TOKEN);
  statuses.push({
    id: "calendar",
    label: "Google Calendar",
    state: calendarConfigured ? "connected" : "missing",
    detail: calendarConfigured ? "Identifiants calendrier détectés." : "Autorisation Google Calendar à connecter.",
    checkedAt,
  });

  return NextResponse.json({ statuses, checkedAt }, { headers: { "Cache-Control": "no-store" } });
}
