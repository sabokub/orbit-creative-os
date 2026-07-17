import { z } from "zod";
import { AgentDefinition } from "../contracts";

const SectionSchema = z.object({
  name: z.string().min(1).max(200),
  goal: z.string().min(1).max(500),
  mainCopy: z.string().max(1500).default(""),
  cta: z.string().max(300).default(""),
});

const PageSchema = z.object({
  name: z.string().min(1).max(200),
  goal: z.string().min(1).max(500),
  sections: z.array(SectionSchema).max(20).default([]),
});

const OutputSchema = z.object({
  sitemap: z.array(z.string().max(200)).min(1).max(30),
  pages: z.array(PageSchema).min(1).max(20),
  userJourney: z.array(z.string().max(400)).max(20).default([]),
  primaryCtas: z.array(z.string().max(300)).max(15).default([]),
  uxRecommendations: z.array(z.string().max(400)).max(20).default([]),
});
export type WebsiteArchitectOutput = z.infer<typeof OutputSchema>;

export const websiteArchitect: AgentDefinition<typeof OutputSchema> = {
  role: "website-architect",
  title: "Website Architect",
  description: "Produit l'architecture du site et le copywriting principal.",
  instructions:
    "Tu es le Website Architect d'Orbit. À partir de la stratégie de marque et de la direction créative, conçois un sitemap, une hiérarchie de pages, des sections avec objectif et copy principal, un parcours utilisateur, des CTA et des recommandations UX. Une action principale par page. Preuve avant grandes promesses. Ne contredis pas les décisions approuvées.",
  dependencies: [
    { role: "brand-strategist", required: true, reason: "Les messages du site découlent du positionnement." },
    { role: "creative-director", required: false, reason: "La direction créative informe le ton et la hiérarchie visuelle." },
  ],
  produces: "deliverable",
  outputSchema: OutputSchema,
  summarize: (o) => `Sitemap : ${o.sitemap.join(" · ")}`,
};
