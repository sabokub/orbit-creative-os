"use client";

import { Project } from "./types";

const INDEX_KEY = "orbit-hub:projects";

function projectKey(id: string) {
  return `orbit-hub:project:${id}`;
}

export function listProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(INDEX_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  return ids
    .map((id) => getProject(id))
    .filter((p): p is Project => p !== null)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function getProject(id: string): Project | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(projectKey(id));
  return raw ? (JSON.parse(raw) as Project) : null;
}

export function saveProject(project: Project) {
  if (typeof window === "undefined") return;
  project.updated_at = new Date().toISOString();
  window.localStorage.setItem(projectKey(project.id), JSON.stringify(project));

  const raw = window.localStorage.getItem(INDEX_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  if (!ids.includes(project.id)) {
    ids.push(project.id);
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
  }
}

export function deleteProject(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(projectKey(id));
  const raw = window.localStorage.getItem(INDEX_KEY);
  const ids: string[] = raw ? JSON.parse(raw) : [];
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(ids.filter((i) => i !== id)));
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${base || "project"}-${Date.now().toString(36)}`;
}
