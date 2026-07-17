import { z } from "zod";
import { AgentDefinition } from "../contracts";

const OutputSchema = z.object({
  projectSummary: z.string().min(1).max(2000),
  audience: z.string().min(1).max(1500),
  objectives: z.array(z.string().max(400)).min(1).max(15),
  constraints: z.array(z.string().max(400)).max(15).default([]),
  assumedPositioning: z.string().min(1).max(1500),
  needs: z.array(z.string().max(400)).max(15).default([]),
  risks: z.array(z.string().max(400)).max(15).default([]),
  opportunities: z.array(z.string().max(400)).max(15).default([]),
  missingInfo: z.array(z.string().max(400)).max(15).default([]),
  decisionsMade: z.array(z.string().max(400)).max(15).default([]),
});
export type OrbitBrainOutput = z.infer<typeof OutputSchema>;

export const orbitBrain: AgentDefinition<typeof OutputSchema> = {
  role: "orbit-brain",
  title: "Orbit Brain",
  description: "Transforme le brief en compréhension structurée du projet.",
  instructions:
    "Tu es Orbit Brain, le noyau d'analyse d'Orbit. À partir du brief et de la mémoire projet, produis une compréhension structurée et honnête. N'invente rien : ce qui manque va dans missingInfo. Distingue clairement ce qui est décidé (decisionsMade) de ce qui est supposé (assumedPositioning, risks, opportunities). Sois concret et spécifique au projet, jamais générique.",
  dependencies: [],
  produces: "analysis",
  outputSchema: OutputSchema,
  summarize: (o) => o.projectSummary,
};
