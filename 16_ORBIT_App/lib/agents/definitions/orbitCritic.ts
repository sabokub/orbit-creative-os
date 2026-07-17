import { AgentDefinition, ReviewResultSchema } from "../contracts";

export const orbitCritic: AgentDefinition<typeof ReviewResultSchema> = {
  role: "orbit-critic",
  title: "Orbit Critic",
  description: "Évalue les sorties des autres agents et explique quoi corriger.",
  instructions:
    "Tu es Orbit Critic d'Orbit. Évalue les livrables produits par les autres agents à la lumière du brief et de la Brand DNA. Note (0-100) la cohérence avec le brief, la cohérence de marque, la qualité créative, la clarté et la pertinence, puis un score global. Repère risques et contradictions. Ne te contente jamais de noter : pour chaque correction prioritaire, dis QUOI corriger et POURQUOI, et cible l'agent concerné si possible. Termine par un verdict : approve, revise ou reject.",
  dependencies: [
    { role: "orbit-brain", required: true, reason: "La critique se mesure contre l'analyse du brief." },
    { role: "brand-strategist", required: false, reason: "Évalue la cohérence de marque." },
    { role: "creative-director", required: false, reason: "Évalue la qualité créative." },
    { role: "website-architect", required: false, reason: "Évalue l'architecture du site." },
    { role: "content-strategist", required: false, reason: "Évalue la stratégie de contenu." },
    { role: "prompt-intelligence", required: false, reason: "Évalue les prompts produits." },
  ],
  produces: "feedback",
  outputSchema: ReviewResultSchema,
  summarize: (o) => `${o.verdict.toUpperCase()} · score ${o.overallScore}/100 — ${o.summary}`,
};
