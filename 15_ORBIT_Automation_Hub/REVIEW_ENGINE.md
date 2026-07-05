# Review Engine — Spec fonctionnelle

S'appuie sur `02_Agents/Manuals/Critic_Manual.md`, `10_Prompt_Library/Review_Prompts.md` et `13_ChatGPT_Runtime/Runtime_Quality_Gate.md`.
Prompt exécutable : `prompts/Review_Master_Prompt.md`.

## Entrée

N'importe quelle sortie du hub : `WebsiteOutput`, `ContentOutput`, `ImagePrompt` (ou une image produite), `BrandKit`, `CreativeDirection`.

## Grille de score — /50

Chaque grille ci-dessous est notée sur 10, cumulée sur 50 pour l'ensemble d'un projet, ou utilisée seule (sur 10) pour reviewer un seul livrable.

### Site (10 pts)
Clarté, navigation, preuve, logique de conversion, lisibilité mobile.

### Hero image / direction visuelle (10 pts)
Fidélité Visual DNA, cohérence matière, force narrative, absence d'éléments à éviter, usabilité directe.

### Contenu (10 pts)
Ancrage dans un pilier, pertinence audience, cohérence de ton, clarté du format, potentiel de recyclage.

### Brand kit (10 pts)
Clarté du positionnement, différenciation, crédibilité, cohérence verbale/visuelle, applicabilité.

### Direction créative (10 pts)
Reconnaissance, justesse émotionnelle, originalité, cohérence, faisabilité de production.

## Sortie garantie

1. **Score** — /10 par grille utilisée, /50 si review de projet complet.
2. **Points forts** — 2 à 4, spécifiques.
3. **Problèmes** — listés par ordre d'impact.
4. **Risques** — ce qui peut mal tourner si publié tel quel.
5. **Corrections recommandées** — actionnables, pas vagues.
6. **Statut** — `Approved` / `Needs revision` / `Blocked`.

## Règles de décision du statut

- `Approved` — score ≥ 8/10 par grille concernée, aucun problème critique.
- `Needs revision` — score 5-7/10, ou un problème moyen non bloquant.
- `Blocked` — score < 5/10, ou un problème critique (incohérence stratégique, hors-marque, élément à éviter présent).

Reprend les niveaux de sévérité du `Critic_Manual.md` : Low / Medium / High / Critical. `Critical` force `Blocked`.

## Boucle de correction

```
Review → si Blocked ou Needs revision → retour à l'étape génératrice concernée → régénération → nouvelle review
```

Ne jamais exporter un livrable `Blocked`.

## Sortie attendue (schéma)

Voir `DATA_MODEL.md` → `Review`.

## Exemple de référence

Reviews intégrées dans `examples/24March_Website_Output.md` et `examples/24March_Content_Output.md` (section finale de chaque fichier).
