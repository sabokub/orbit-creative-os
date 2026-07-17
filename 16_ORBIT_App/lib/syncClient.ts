"use client";

import {
  ConversationAnalysis,
  ConversationSource,
  ExternalConversation,
  ExternalTarget,
  ProgressEntry,
  SyncStatusReport,
} from "./sync/contracts";
import { AssembledContext } from "./sync/context";

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { error?: string }).error || `Requête échouée (${res.status})`);
  return body as T;
}

export function importConversation(projectId: string, source: ConversationSource, content: string, title?: string) {
  return fetch(`/api/conversations/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, source, content, title }),
  }).then(parse<{ conversation: ExternalConversation; analysis: ConversationAnalysis }>);
}

export function analyzeConversation(projectId: string, content: string) {
  return fetch(`/api/projects/${projectId}/conversation/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  }).then(parse<ConversationAnalysis>);
}

export function listConversations(projectId: string) {
  return fetch(`/api/projects/${projectId}/conversations`, { cache: "no-store" }).then(parse<ExternalConversation[]>);
}

export function listProgress(projectId: string) {
  return fetch(`/api/projects/${projectId}/progress`, { cache: "no-store" }).then(parse<ProgressEntry[]>);
}

export function addProgress(projectId: string, summary: string, details?: string) {
  return fetch(`/api/projects/${projectId}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary, details, source: "orbit", type: "note" }),
  }).then(parse<ProgressEntry>);
}

export function getSyncStatus(projectId: string) {
  return fetch(`/api/projects/${projectId}/sync-status`, { cache: "no-store" }).then(parse<SyncStatusReport>);
}

export function exportContext(projectId: string, target: ExternalTarget, objective?: string) {
  return fetch(`/api/projects/${projectId}/context/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, objective }),
  }).then(parse<AssembledContext>);
}
