import "server-only";
import { Project } from "../types";
import { getBrandProfile } from "../brandProfile";
import { generateJSONWithOpenAI } from "../openai";
import { MemoryService } from "./memory/service";
import { RedisMemoryStore } from "./memory/redisStore";
import { RedisRunStore } from "./runs/redisStore";
import { AgentRuntime } from "./engine";

/** Production wiring: Redis-backed stores, OpenAI JSON call, brand+brief preamble. */

export function memoryService(): MemoryService {
  return new MemoryService(new RedisMemoryStore());
}

export function runStore(): RedisRunStore {
  return new RedisRunStore();
}

/** Renders the fixed source of truth (Brand DNA + Project brief) always injected into every agent. */
export function buildFixedContext(project: Project): string {
  const brand = getBrandProfile(project.brief.brandProfileId);
  const b = project.brief;
  return [
    `# Marque : ${brand.name}`,
    `Activité : ${brand.activity}`,
    `Positionnement : ${brand.positioning}`,
    `Audience : ${brand.audience}`,
    `Offre : ${brand.offer}`,
    `Promesse : ${brand.brandPromise}`,
    `Ton : ${brand.toneOfVoice}`,
    `Direction visuelle : ${brand.visualDirection}`,
    `Couleurs : ${brand.colors}`,
    `Piliers de message : ${brand.messagePillars.join(" | ")}`,
    `À éviter : ${brand.avoid.join(", ")}`,
    "",
    `# Brief du projet : ${project.name}`,
    `Objectif : ${b.projectGoal}`,
    `Contexte spécifique : ${b.specificContext}`,
    `Livrable : ${b.deliverableType}`,
    `Références : ${b.references}`,
    `Contraintes : ${b.constraints}`,
    `Canaux : ${b.channels}`,
    `Format : ${b.format}`,
    `Critères de succès : ${b.successCriteria}`,
  ].join("\n");
}

export function createRuntimeForProject(project: Project): AgentRuntime {
  return {
    memory: memoryService(),
    generate: (prompt: string) => generateJSONWithOpenAI(prompt),
    fixedContext: buildFixedContext(project),
    projectName: project.name,
  };
}
