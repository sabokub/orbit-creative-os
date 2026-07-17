"use client";

import {
  AgentRole,
  MemoryEntry,
  MemoryStatus,
  OrchestrationRun,
  AgentDependency,
  MemoryType,
} from "./agents/contracts";

/** Agent roster row returned by GET /api/projects/[id]/agents. */
export interface AgentRosterItem {
  role: AgentRole;
  title: string;
  description: string;
  produces: MemoryType;
  dependencies: AgentDependency[];
  status: MemoryStatus | "not_run";
  memoryId?: string;
  summary?: string;
  updatedAt?: string;
}

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Requête échouée (${res.status})`);
  return body as T;
}

export function listAgents(projectId: string): Promise<AgentRosterItem[]> {
  return fetch(`/api/projects/${projectId}/agents`, { cache: "no-store" }).then(parse<AgentRosterItem[]>);
}

export function listMemory(projectId: string): Promise<MemoryEntry[]> {
  return fetch(`/api/projects/${projectId}/memory`, { cache: "no-store" }).then(parse<MemoryEntry[]>);
}

export function listRuns(projectId: string): Promise<OrchestrationRun[]> {
  return fetch(`/api/projects/${projectId}/runs`, { cache: "no-store" }).then(parse<OrchestrationRun[]>);
}

export function runAgent(projectId: string, role: AgentRole, userIntent?: string) {
  return fetch(`/api/agents/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, role, userIntent }),
  }).then(parse<{ result: import("./agents/contracts").AgentExecutionOutput }>);
}

export function runPipeline(projectId: string, userIntent?: string) {
  return fetch(`/api/orchestrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, mode: "full", userIntent }),
  }).then(parse<{ run: OrchestrationRun }>);
}

export function runReview(projectId: string) {
  return fetch(`/api/projects/${projectId}/review`, { method: "POST" }).then(parse<{ run: OrchestrationRun }>);
}

export function setMemoryStatus(projectId: string, id: string, status: MemoryStatus) {
  return fetch(`/api/projects/${projectId}/memory`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "setStatus", id, status }),
  }).then(parse<MemoryEntry>);
}
