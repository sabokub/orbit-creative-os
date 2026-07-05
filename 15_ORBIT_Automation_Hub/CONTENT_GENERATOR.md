# Content Generator — Spec fonctionnelle

S'appuie sur `02_Agents/Manuals/Content_Director_Manual.md` et `10_Prompt_Library/Content_Prompts.md`.
Prompt exécutable : `prompts/Content_Generator_Master_Prompt.md`.

## Entrée

- `Brief` (intake)
- `BrandKit` (stratégie)
- `CreativeDirection` (territoire visuel)

## Sortie garantie

1. **Piliers éditoriaux** — 4 à 5 piliers (autorité, éducation, inspiration, preuve, personnalité).
2. **Formats récurrents** — formats répétables par pilier (ex : avant/après, behind-the-scenes, moodboard breakdown).
3. **30 idées de posts** — reliées à un pilier chacune.
4. **10 idées de reels** — avec concept + hook.
5. **10 hooks forts** — phrases d'ouverture réutilisables.
6. **Captions exemples** — 5 captions complètes, prêtes à publier, dans le ton de la marque.
7. **Prompts image/vidéo** — un prompt par contenu visuel nécessaire (renvoie vers `IMAGE_PROMPT_GENERATOR.md`).
8. **Calendrier 30 jours** — jour par jour, canal, format, sujet.
9. **Logique de réutilisation** — comment un contenu fort devient plusieurs formats/canaux.
10. **Objectifs par canal** — Instagram, TikTok, Pinterest.

## Règles de génération

- Pas de post isolé sans pilier (hérité de `Content_Director_Manual.md`).
- Le contenu suit la maturité de l'audience (découverte / comparaison / décision / fidélisation).
- Chaque post fort doit être pensé pour être recyclé (carrousel → reel → story → pin).
- Le ton reste cohérent avec `BrandKit.tone_of_voice`.

## Objectifs par canal (par défaut, studio de direction artistique d'intérieur)

- **Instagram** — preuve visuelle, portfolio, autorité esthétique, conversion vers devis.
- **TikTok** — proximité, process, avant/après, personnalité du studio, découverte.
- **Pinterest** — inspiration long terme, SEO visuel, trafic vers le site.

## Structure du calendrier 30 jours

```json
{ "day": 1, "channel": "instagram", "format": "carrousel", "topic": "", "pillar": "" }
```

Répété sur 30 jours, avec répartition équilibrée entre les canaux actifs du `Brief`.

## Sortie attendue (schéma)

Voir `DATA_MODEL.md` → `ContentOutput`.

## Exemple de référence

`examples/24March_Content_Output.md`

## Review liée

Toute sortie de ce générateur doit passer par `REVIEW_ENGINE.md` avant export, avec la grille "Contenu" du `Review_Master_Prompt.md`.
