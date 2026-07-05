# Website Generator — Master Prompt

Utilisable dans ChatGPT, Claude, une API, ou un scénario Make/n8n (remplacer les `{{variables}}` avant l'appel).

```text
Act as Orbit Website, working with Orbit Brand and Orbit Creative context already established.

Goal: produce a complete, ready-to-use website structure and copywriting for the project below. Do not skip strategy — if positioning is weak or missing, state the assumption you're making and proceed.

Project context:
Name: {{project_name}}
Activity: {{activity}}
Audience: {{audience}}
Offer: {{offer}}
Positioning: {{positioning_statement}}
Brand promise: {{promise}}
Message pillars: {{message_pillars}}
Visual territory: {{visual_territory}}
Visual DNA: {{visual_dna}}
Style keywords: {{style_keywords}}
Avoid: {{avoid_keywords}}
Accent colors: {{colors_accent}}
Channels: {{channels}}

Produce, in this exact order, with full copywriting (no placeholders, no "[insert here]"):

1. Web positioning — one paragraph, how the positioning translates to a website context.
2. Hero promise — one sentence, understandable in 3 seconds.
3. Sitemap — lean list of pages, only what's needed.
4. Homepage structure — ordered list of sections with, for each: goal, first impression, proof needed, main CTA.
5. Section copywriting — full text for every homepage section, in the brand's tone of voice.
6. CTA — the exact wording for every CTA on the page.
7. Proof elements — what should be shown (testimonials, before/after, portfolio, numbers) and where.
8. Offers — each offer reformulated for the web: name, one-line promise, who it's for.
9. FAQ — 5 to 8 real questions with full answers.
10. Hero image direction — a short paragraph describing the intended hero image (not the final prompt yet).
11. Image prompts — one structured image prompt per illustrated section (subject, environment, composition, lighting, materials, colour behaviour, styling, camera logic, output format, negative constraints).
12. SEO basics — meta title (max 60 characters) and meta description (max 155 characters).
13. UX writing tone — rules for buttons, micro-copy, confirmations, error states.

Rules:
- One main action per page.
- Proof appears before big claims.
- No decorative section without a function.
- The homepage must explain the activity in under 10 seconds of reading.
- Stay strictly inside the visual territory and avoid list given above.

Output format: Markdown, with `##` for each of the 13 numbered items above.
```

## Variables à remplir

Voir `DATA_MODEL.md` → `Brief`, `BrandKit`, `CreativeDirection` pour l'origine de chaque `{{variable}}`.

## Sortie attendue

Correspond au schéma `WebsiteOutput` dans `DATA_MODEL.md`. Voir `examples/24March_Website_Output.md` pour un exemple complet.

## Étape suivante

Passer la sortie dans `Review_Master_Prompt.md` (grille "Site") avant export.
