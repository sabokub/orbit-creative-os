# Export Formats

## Markdown (format natif)

Chaque livrable est produit directement en Markdown. C'est le format source de vérité, versionné dans le repo si besoin (`examples/` en est la preuve).

Règles :
- Un fichier par livrable (`Website_Output.md`, `Content_Output.md`, etc.).
- Titres en `##` pour les sections, pas de niveaux au-delà de `###`.
- Tableaux Markdown pour le calendrier de contenu et les grilles de score.

## Google Doc-ready

Le Markdown ci-dessus est copié tel quel dans un Google Doc :
- Les `#`/`##` deviennent Titre 1 / Titre 2 via collage ou l'extension "Markdown to Docs".
- Les listes à puces et tableaux Markdown collent proprement dans Google Docs sans reformatage.
- Alternative Option A : Make/n8n peut pousser le Markdown converti en HTML directement dans un Google Doc via l'API Google Docs (voir `SETUP.md`).

## PDF-ready

Deux chemins :
1. Google Doc → Fichier → Télécharger → PDF (le plus simple, zéro outil supplémentaire).
2. Pandoc en local : `pandoc Website_Output.md -o Website_Output.pdf` si une génération batch est souhaitée (Option B).

## Convention de nommage des exports

```
<project_id>_<deliverable>_<date>.<ext>
ex: 24march-studio_website-output_2026-07-05.md
```

## Où stocker les exports

- Option A (no-code) : dossier Google Drive dédié par projet, ou page Notion par projet.
- Option B (mini-app) : `/exports/<project_id>/` dans le repo de l'app, ou bucket de stockage si l'app est déployée.

## Ce qui ne doit jamais être exporté

Un livrable dont la `Review.status` est `Blocked`. Voir `REVIEW_ENGINE.md`.
