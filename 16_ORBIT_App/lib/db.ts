import "server-only";
import { Redis } from "@upstash/redis";
import { Project } from "./types";

const INDEX_KEY = "orbit-hub:projects";

function projectKey(id: string) {
  return `orbit-hub:project:${id}`;
}

function hasRedisEnv() {
  return Boolean(
    (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) ||
      (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

function client(): Redis {
  if (!hasRedisEnv()) {
    throw new Error(
      "Aucune base connectée. Ajoute une intégration Redis (Upstash) dans Vercel puis relie-la à ce projet, ou lis 16_ORBIT_App/README.md pour le développement local."
    );
  }
  return Redis.fromEnv();
}

export async function listProjects(): Promise<Project[]> {
  const redis = client();
  const ids = (await redis.get<string[]>(INDEX_KEY)) || [];
  if (ids.length === 0) return [];
  const projects = await Promise.all(ids.map((id) => redis.get<Project>(projectKey(id))));
  return projects
    .filter((p): p is Project => p !== null)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getProject(id: string): Promise<Project | null> {
  const redis = client();
  return (await redis.get<Project>(projectKey(id))) || null;
}

export async function saveProject(project: Project): Promise<Project> {
  const redis = client();
  await redis.set(projectKey(project.id), project);
  const ids = (await redis.get<string[]>(INDEX_KEY)) || [];
  if (!ids.includes(project.id)) {
    ids.push(project.id);
    await redis.set(INDEX_KEY, ids);
  }
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  const redis = client();
  await redis.del(projectKey(id));
  const ids = (await redis.get<string[]>(INDEX_KEY)) || [];
  await redis.set(
    INDEX_KEY,
    ids.filter((i) => i !== id)
  );
}
