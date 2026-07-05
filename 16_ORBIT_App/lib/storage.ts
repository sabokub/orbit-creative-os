"use client";

import { Brief, Project } from "./types";

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function listProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects", { cache: "no-store" });
  return parse<Project[]>(res);
}

export async function getProject(id: string): Promise<Project | null> {
  const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  return parse<Project>(res);
}

export async function createProject(brief: Brief): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brief),
  });
  return parse<Project>(res);
}

export async function saveProject(project: Project): Promise<Project> {
  const res = await fetch(`/api/projects/${project.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(project),
  });
  return parse<Project>(res);
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  await parse(res);
}
