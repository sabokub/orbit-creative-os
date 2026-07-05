# State Model

## Principe

Un seul objet racine par projet : `Project` (voir `../DATA_MODEL.md`). Toutes les pages et composants lisent et écrivent dans cet objet. Pas d'état global multi-projets sauf la liste utilisée par le Dashboard.

## Store (v1, sans backend)

```
/data/projects/<project_id>.json   → un fichier = un Project complet
```

Chargé en mémoire par page via un simple `readFileSync`/`fetch` local (Option B v0), remplaçable par SQLite ou une vraie base une fois le volume de projets justifiant la migration (voir `../SETUP.md`).

## Cycle de vie d'un projet

```
brief → strategy → creative → website → content → images → review → exported
```

`Project.stage` avance uniquement quand l'étape correspondante a une sortie non vide. Il peut reculer si une review renvoie `Blocked` sur une étape antérieure réutilisée (rare, mais géré : le stage ne descend jamais automatiquement, seul un statut de review le signale sur l'`OutputPanel` concerné).

## Flux de données entre pages

1. `New Project` écrit `Project.brief`, crée le fichier, redirige vers `Project Workspace` avec `stage = brief`.
2. `Project Workspace` lit l'objet complet, affiche ce qui existe, propose "suivant" vers `Workflow Runner` pour l'étape manquante.
3. `Workflow Runner` :
   - lit `Project.brief` + les sorties précédentes nécessaires à l'étape (voir table de dépendances dans `../WORKFLOWS.md`),
   - remplit un master prompt (`PromptPreview`),
   - écrit la sortie générée dans le champ correspondant de `Project` (ex: `Project.website_output`),
   - lance la review, écrit le résultat dans `Project.reviews[]`,
   - met à jour `Project.stage`.
4. `Output Library` lit `Project.exports[]` et l'historique des versions (si conservé — sinon uniquement la dernière version de chaque champ).

## Règle de cohérence

Aucune étape ne doit lire une donnée qui n'existe pas encore dans `Project`. Le `Workflow Runner` désactive le bouton "Generate" tant que les dépendances d'entrée (voir `../WORKFLOWS.md`) ne sont pas remplies, et affiche pourquoi.

## État transverse : notifications de review

Quand une review renvoie `Blocked`, un signal traverse `ProjectCard` (badge rouge), `OutputPanel` (bordure rouge) et `ReviewScoreCard` (statut rouge) — un seul champ source (`Review.status` le plus récent par cible), affiché à plusieurs endroits, jamais dupliqué en état séparé.
