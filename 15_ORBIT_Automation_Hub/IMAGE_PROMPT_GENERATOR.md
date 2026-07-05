# Image Prompt Generator — Spec fonctionnelle

S'appuie sur `02_Agents/Manuals/Image_Director_Manual.md` et `10_Prompt_Library/Image_Prompts.md`.
Prompt exécutable : `prompts/Image_Prompt_Master_Prompt.md`.

## Entrée

- `CreativeDirection` (territoire visuel, visual DNA)
- `WebsiteOutput.homepage.sections` (sections à illustrer)
- `ContentOutput.post_ideas` / `reel_ideas` (contenus à illustrer)

## Sortie garantie

1. **Prompts hero image** — 1 à 3 variations pour l'image hero du site.
2. **Prompts site web** — un prompt par section illustrée (about, offres, preuve, etc.).
3. **Prompts réseaux sociaux** — Instagram post, Pinterest pin, moodboard, par pilier de contenu.
4. **Variations** — pour chaque prompt clé, 2-3 variations gardant la même Visual DNA.
5. **Contraintes négatives** — ce qu'il faut éviter, explicite par prompt.
6. **Critères de review** — grille pour valider chaque image générée avant usage.

## Structure d'un prompt image

```
Sujet :
Environnement :
Composition / cadrage :
Lumière :
Matières :
Comportement couleur :
Styling :
Logique caméra (focale, angle, grain) :
Format de sortie (ratio, usage) :
Contraintes négatives :
```

Cette structure est imposée par `Image_Director_Manual.md` (subject, environment, composition, lighting, materials, colour behaviour, styling, camera logic, output format).

## Direction artistique par défaut — 24March Studio

Vibe : lifestyle éditorial à la maison, "cool people live here", intérieur comme extension de soi, énergie mode/magazine/culture visuelle. Flash photo, cadrages proches, léger grand angle, reflets, matières fortes, objets qui racontent une histoire, détails de vie (canapé, cuisine, miroir, food, drink, magazines), styling mode appliqué à l'intérieur.

Contraintes négatives par défaut :

- pas d'intérieur beige trop sage
- pas de décoration classique
- pas de moodboard matériaux trop agence
- pas de rendu IA générique
- pas d'image trop vide ou trop lisse
- pas d'ambiance nightlife / club
- pas d'appartement Kinfolk trop clean
- pas de luxe froid
- pas d'esthétique trop adulte ou trop sage

Couleurs d'accent : bleu et vert du moodboard, jamais dominants sur l'ensemble du système.

## Critères de review d'une image générée

1. Fidélité à la Visual DNA.
2. Cohérence de matière (rien qui semble irréel ou plastique).
3. Présence d'un détail narratif (objet, texture, geste).
4. Absence des éléments à éviter listés ci-dessus.
5. Utilisable directement pour l'usage prévu (site, post, pin).

## Sortie attendue (schéma)

Voir `DATA_MODEL.md` → `ImagePrompt`.

## Exemple de référence

`examples/24March_Image_Prompts.md`

## Review liée

Utiliser la grille "Hero Image" et "Direction créative" du `Review_Master_Prompt.md`.
