import { z } from "zod";
import { AgentDefinition } from "../contracts";

const CalendarEntrySchema = z.object({
  when: z.string().min(1).max(120),
  item: z.string().min(1).max(400),
});

const DistributionSchema = z.object({
  platform: z.string().min(1).max(120),
  approach: z.string().min(1).max(500),
});

const OutputSchema = z.object({
  pillars: z.array(z.string().max(300)).min(1).max(12),
  angles: z.array(z.string().max(400)).max(20).default([]),
  formats: z.array(z.string().max(200)).max(20).default([]),
  contentIdeas: z.array(z.string().max(400)).min(1).max(40),
  calendar: z.array(CalendarEntrySchema).max(40).default([]),
  distribution: z.array(DistributionSchema).max(15).default([]),
  ctas: z.array(z.string().max(300)).max(15).default([]),
  recycling: z.array(z.string().max(400)).max(15).default([]),
});
export type ContentStrategistOutput = z.infer<typeof OutputSchema>;

export const contentStrategist: AgentDefinition<typeof OutputSchema> = {
  role: "content-strategist",
  title: "Content Strategist",
  description: "Produit la stratégie de contenu éditorial.",
  instructions:
    "Tu es le Content Strategist d'Orbit. À partir de la stratégie de marque, de la direction créative et de l'architecture du site, définis des piliers éditoriaux, des angles, des formats, des idées concrètes, un calendrier, une distribution par plateforme, des CTA et une logique de recyclage. Ancré dans l'univers et la méthode du studio, jamais du conseil générique.",
  dependencies: [
    { role: "brand-strategist", required: true, reason: "Les piliers éditoriaux traduisent les messages de marque." },
    { role: "creative-director", required: false, reason: "La direction créative cadre le ton des contenus." },
  ],
  produces: "deliverable",
  outputSchema: OutputSchema,
  summarize: (o) => `Piliers : ${o.pillars.join(" · ")}`,
};
