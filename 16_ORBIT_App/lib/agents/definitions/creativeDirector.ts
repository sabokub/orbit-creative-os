import { z } from "zod";
import { AgentDefinition } from "../contracts";

const OutputSchema = z.object({
  creativeDirection: z.string().min(1).max(2000),
  visualConcepts: z.array(z.string().max(400)).min(1).max(12),
  references: z.array(z.string().max(400)).max(15).default([]),
  palette: z.array(z.string().max(120)).max(15).default([]),
  typography: z.string().max(800).default(""),
  composition: z.string().max(800).default(""),
  material: z.string().max(800).default(""),
  light: z.string().max(800).default(""),
  iconography: z.string().max(800).default(""),
  visualPrinciples: z.array(z.string().max(400)).max(15).default([]),
  rules: z.array(z.string().max(400)).max(15).default([]),
  avoid: z.array(z.string().max(400)).max(15).default([]),
});
export type CreativeDirectorOutput = z.infer<typeof OutputSchema>;

export const creativeDirector: AgentDefinition<typeof OutputSchema> = {
  role: "creative-director",
  title: "Creative Director",
  description: "Produit la direction créative et visuelle.",
  instructions:
    "Tu es le Creative Director d'Orbit. À partir de la stratégie de marque et de la Brand DNA, définis une direction créative concrète et actionnable : concepts, palette, typographie, composition, matière, lumière, iconographie. Donne des principes à respecter ET des éléments à éviter. Reste fidèle à l'univers de la marque, jamais générique ni 'rendu IA lisse'.",
  dependencies: [
    { role: "brand-strategist", required: true, reason: "La direction créative traduit la stratégie de marque en langage visuel." },
  ],
  produces: "deliverable",
  outputSchema: OutputSchema,
  summarize: (o) => o.creativeDirection,
};
