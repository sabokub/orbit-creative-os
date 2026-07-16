"use client";

import { StudioPlan } from "./studioPlan";

async function parse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `La requête a échoué (${response.status})`);
  }
  return response.json();
}

export async function fetchStudioPlan(): Promise<StudioPlan> {
  const response = await fetch("/api/studio-plan", { cache: "no-store" });
  return parse<StudioPlan>(response);
}

export async function updateStudioPlan(plan: StudioPlan): Promise<StudioPlan> {
  const response = await fetch("/api/studio-plan", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  });
  return parse<StudioPlan>(response);
}
