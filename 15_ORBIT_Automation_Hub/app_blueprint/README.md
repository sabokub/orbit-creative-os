# App Blueprint

Spécification d'une mini-interface interne pour piloter le hub. Pas une app lourde : 5 pages, 8 composants, un état par projet.

À implémenter avec la stack décrite dans `../SETUP.md` Option B (Next.js + TypeScript + Tailwind).

## Fichiers

- `routes.md` — les 5 pages, leur objectif, leur contenu.
- `components.md` — les 8 composants réutilisables.
- `state_model.md` — comment l'état circule entre pages et composants.
- `api_contracts.md` — les appels (internes ou externes) que l'app doit exposer.

## Principe directeur

Un projet = un dossier de données (voir `../DATA_MODEL.md`). L'app ne fait qu'afficher, éditer et faire avancer ce dossier à travers les étapes du `../WORKFLOWS.md`. Elle ne réinvente pas la logique ORBIT : elle exécute les master prompts de `../prompts/` et range les résultats.
