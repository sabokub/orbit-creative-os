import { z } from "zod";
import { AgentDefinition, IMAGE_GENERATORS } from "../contracts";

/** Block-based prompt structure (brief section "Prompt Intelligence"). */
const PromptBlocksSchema = z.object({
  objective: z.string().min(1).max(600),
  subject: z.string().min(1).max(600),
  environment: z.string().max(600).default(""),
  composition: z.string().max(600).default(""),
  light: z.string().max(600).default(""),
  camera: z.string().max(600).default(""),
  material: z.string().max(600).default(""),
  style: z.string().max(600).default(""),
  constraints: z.array(z.string().max(300)).max(15).default([]),
  negatives: z.array(z.string().max(300)).max(15).default([]),
});

const AdaptationSchema = z.object({
  generator: z.enum(IMAGE_GENERATORS),
  prompt: z.string().min(1).max(2500),
});

const StructuredPromptSchema = z.object({
  title: z.string().min(1).max(200),
  blocks: PromptBlocksSchema,
  /** Per-generator flattened prompt — the adaptation axis (GPT Image, Nano Banana, Midjourney, Sora). */
  adaptations: z.array(AdaptationSchema).min(1).max(IMAGE_GENERATORS.length),
});

const OutputSchema = z.object({
  prompts: z.array(StructuredPromptSchema).min(1).max(12),
});
export type PromptIntelligenceOutput = z.infer<typeof OutputSchema>;

export const promptIntelligence: AgentDefinition<typeof OutputSchema> = {
  role: "prompt-intelligence",
  title: "Prompt Intelligence",
  description: "Produit des prompts structurés en blocs, adaptés à plusieurs générateurs.",
  instructions:
    "Tu es Prompt Intelligence d'Orbit. À partir de la direction créative, du contexte projet et de la Brand DNA, produis des prompts d'image structurés en blocs (objectif, sujet, environnement, composition, lumière, caméra, matière, style, contraintes, négatifs). Pour chaque prompt, fournis une adaptation aplatie pour chaque générateur demandé (gpt-image, nano-banana, midjourney, sora) en respectant les conventions de chacun (Midjourney : mots-clés + paramètres ; Sora : mouvement/temporalité ; gpt-image/nano-banana : phrases descriptives). Porte toujours la signature visuelle de la marque.",
  dependencies: [
    { role: "creative-director", required: true, reason: "Les prompts exécutent la direction créative." },
  ],
  produces: "deliverable",
  outputSchema: OutputSchema,
  summarize: (o) => `${o.prompts.length} prompt(s) structuré(s) : ${o.prompts.map((p) => p.title).join(" · ")}`,
};
