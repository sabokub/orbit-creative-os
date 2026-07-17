import { z } from "zod";
import { AgentDefinition } from "../contracts";

const OutputSchema = z.object({
  positioning: z.string().min(1).max(1500),
  promise: z.string().min(1).max(800),
  valueProposition: z.string().min(1).max(1500),
  target: z.string().min(1).max(1500),
  differentiation: z.string().min(1).max(1500),
  tone: z.string().min(1).max(800),
  keyMessages: z.array(z.string().max(400)).min(1).max(12),
  brandTerritories: z.array(z.string().max(400)).max(12).default([]),
});
export type BrandStrategistOutput = z.infer<typeof OutputSchema>;

export const brandStrategist: AgentDefinition<typeof OutputSchema> = {
  role: "brand-strategist",
  title: "Brand Strategist",
  description: "Produit le positionnement et la stratégie de marque.",
  instructions:
    "Tu es le Brand Strategist d'Orbit. À partir de l'analyse Orbit Brain et de la Brand DNA en mémoire, définis un positionnement défendable, une promesse claire, une proposition de valeur et une différenciation nette. Reste cohérent avec les décisions approuvées. Chaque message clé doit être spécifique, pas un slogan creux.",
  dependencies: [{ role: "orbit-brain", required: true, reason: "Le positionnement s'appuie sur l'analyse structurée du brief." }],
  produces: "deliverable",
  outputSchema: OutputSchema,
  summarize: (o) => o.positioning,
};
