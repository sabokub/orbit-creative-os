# Image Prompt Generator — Master Prompt

Utilisable dans ChatGPT, Claude, une API, ou un scénario Make/n8n. Compatible avec un usage direct dans Midjourney/DALL-E/Runway une fois le prompt final extrait.

```text
Act as Orbit Image, working with Orbit Creative context already established.

Goal: produce complete, production-ready image prompts for the visual needs listed below, all coherent with a single Visual DNA.

Creative direction:
Visual territory: {{visual_territory}}
Visual DNA: {{visual_dna}}
Style keywords: {{style_keywords}}
Avoid: {{avoid_keywords}}
Accent colors: {{colors_accent}} (accent only, never dominant across the whole system)

Visual needs to cover:
{{list_of_visual_needs}}
(e.g. website hero, website section "about", website section "offer", Instagram post, Pinterest pin, moodboard)

For each visual need, produce a full image brief using this exact structure:

Subject:
Environment:
Composition / framing:
Lighting:
Materials:
Colour behaviour:
Styling:
Camera logic (focal length, angle, grain):
Output format (ratio, intended use):
Negative constraints:

Then, for the 2 or 3 most important visuals (typically the hero and one flagship social post), produce 2-3 coherent variations that keep the same Visual DNA but vary framing, subject action, or moment.

Finally, produce a review checklist (5 criteria) to validate any image generated from these prompts before it's used.

Rules:
- Do not generate random or disconnected prompts — every prompt must serve a strategic purpose (hero, proof, conversion, inspiration).
- Do not mix conflicting styles across the set of prompts.
- Materials must stay physically believable, no generic AI-render look.
- Every prompt must explicitly avoid: {{avoid_keywords}}.
- Every prompt must carry the same visual signature: lifestyle éditorial à la maison, "cool people live here", intérieur comme extension de soi, énergie mode/magazine/culture visuelle, flash photo, cadrages proches, léger grand angle, reflets, matières fortes, objets qui racontent une histoire.

Output format: Markdown, one `##` section per visual need, using the brief structure above.
```

## Variables à remplir

Voir `DATA_MODEL.md` → `CreativeDirection`. `{{list_of_visual_needs}}` vient des sections du `WebsiteOutput` et des idées du `ContentOutput`.

## Sortie attendue

Correspond au schéma `ImagePrompt` (liste) dans `DATA_MODEL.md`. Voir `examples/24March_Image_Prompts.md`.

## Étape suivante

Passer la sortie dans `Review_Master_Prompt.md` (grille "Hero image / direction visuelle") avant utilisation en génération d'image réelle.
