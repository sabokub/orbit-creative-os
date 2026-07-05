# Content Generator — Master Prompt

Utilisable dans ChatGPT, Claude, une API, ou un scénario Make/n8n.

```text
Act as Orbit Content, working with Orbit Brand and Orbit Creative context already established.

Goal: produce a complete, ready-to-use 30-day social content system for the project below.

Project context:
Name: {{project_name}}
Activity: {{activity}}
Audience: {{audience}}
Offer: {{offer}}
Positioning: {{positioning_statement}}
Tone of voice: {{tone_of_voice}}
Visual territory: {{visual_territory}}
Style keywords: {{style_keywords}}
Avoid: {{avoid_keywords}}
Channels: {{channels}} (goals per channel: Instagram = proof + authority + conversion, TikTok = proximity + process + discovery, Pinterest = long-term inspiration + SEO + traffic)

Produce, in this exact order:

1. Content pillars — 4 to 5 pillars (authority, education, inspiration, proof, personality), each with a one-line definition and why it fits this brand.
2. Recurring formats — for each pillar, 1-2 repeatable formats that don't require heavy production.
3. 30 post ideas — numbered 1-30, each tagged with its pillar, one line describing the idea.
4. 10 reel ideas — numbered 1-10, each with a hook and a short concept description.
5. 10 hooks — strong opening lines, reusable across formats.
6. Caption examples — 5 full, ready-to-publish captions in the brand's tone, each tied to a post idea above.
7. Visual prompts — for the 5 caption examples and the 10 reel ideas, a short image/video direction (full prompt structure lives in the image prompt generator — here just describe subject + mood + format).
8. 30-day calendar — day-by-day table: day, channel, format, topic, pillar.
9. Reuse logic — explain how the strongest ideas become multiple assets (carousel → reel → story → pin).
10. Channel goals — one paragraph per active channel, what success looks like.

Rules:
- No post without a pillar.
- No trend-chasing without brand fit.
- Every claim backed by proof when relevant.
- Content must be producible without a full studio setup unless stated otherwise.
- Stay strictly inside the visual territory and avoid list given above.

Output format: Markdown, with `##` for each of the 10 numbered items above, and a Markdown table for item 8.
```

## Variables à remplir

Voir `DATA_MODEL.md` → `Brief`, `BrandKit`, `CreativeDirection`.

## Sortie attendue

Correspond au schéma `ContentOutput` dans `DATA_MODEL.md`. Voir `examples/24March_Content_Output.md`.

## Étape suivante

Passer les idées visuelles dans `Image_Prompt_Master_Prompt.md`, puis la sortie complète dans `Review_Master_Prompt.md` (grille "Contenu") avant export.
