import { NextResponse } from "next/server";
import { getStudioPlan, saveStudioPlan } from "@/lib/studioPlanDb";
import { DecisionItem } from "@/lib/studioPlan";

export const dynamic = "force-dynamic";

function uniqueDecision(existing: DecisionItem[], candidate: DecisionItem) {
  return existing.some((item) => item.id === candidate.id) ? existing : [...existing, candidate];
}

export async function POST() {
  const startedAt = new Date();
  const results: Array<{ source: string; ok: boolean; detail: string }> = [];
  const plan = await getStudioPlan();
  let decisions = [...plan.decisions];

  try {
    const response = await fetch("https://api.github.com/repos/sabokub/orbit-creative-os/commits?per_page=1", {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`GitHub ${response.status}`);
    const commits = await response.json() as Array<{ sha: string; commit?: { message?: string; committer?: { date?: string } } }>;
    const latest = commits[0];
    const shortSha = latest?.sha?.slice(0, 7) || "inconnu";
    const message = latest?.commit?.message?.split("\n")[0] || "Commit sans message";
    results.push({ source: "GitHub", ok: true, detail: `${shortSha} · ${message}` });
  } catch (error) {
    results.push({ source: "GitHub", ok: false, detail: (error as Error).message });
  }

  const token = process.env.VERCEL_ACCESS_TOKEN || process.env.VERCEL_TOKEN;
  if (token) {
    try {
      const projectId = process.env.VERCEL_PROJECT_ID;
      const teamId = process.env.VERCEL_TEAM_ID;
      const params = new URLSearchParams({ limit: "1" });
      if (projectId) params.set("projectId", projectId);
      if (teamId) params.set("teamId", teamId);
      const response = await fetch(`https://api.vercel.com/v6/deployments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`Vercel ${response.status}`);
      const payload = await response.json() as { deployments?: Array<{ uid: string; name?: string; state?: string; readyState?: string; url?: string; created?: number }> };
      const deployment = payload.deployments?.[0];
      const state = deployment?.readyState || deployment?.state || "UNKNOWN";
      results.push({ source: "Vercel", ok: state === "READY", detail: `${deployment?.name || "Déploiement"} · ${state}` });
      if (deployment && state !== "READY") {
        decisions = uniqueDecision(decisions, {
          id: `vercel-${deployment.uid}`,
          title: "Déploiement Vercel à vérifier",
          summary: `Le dernier déploiement est dans l’état ${state}.`,
          source: "vercel",
          status: "pending",
          createdAt: new Date().toISOString(),
          suggestedAction: "Ouvrir Vercel, corriger le build puis relancer la synchronisation.",
        });
      }
    } catch (error) {
      results.push({ source: "Vercel", ok: false, detail: (error as Error).message });
    }
  } else {
    results.push({ source: "Vercel", ok: false, detail: "Jeton serveur absent." });
  }

  const saved = await saveStudioPlan({
    ...plan,
    decisions,
    lastManualSyncAt: startedAt.toISOString(),
  });

  return NextResponse.json({
    ok: true,
    syncedAt: saved.lastManualSyncAt,
    results,
    pendingDecisions: saved.decisions.filter((item) => item.status === "pending").length,
  }, { headers: { "Cache-Control": "no-store" } });
}
