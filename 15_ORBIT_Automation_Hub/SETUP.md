# Setup — 2 options d'implémentation

## Option A — No-code / rapide

Objectif : avoir un flow fonctionnel en quelques jours, sans écrire de code.

Stack :
- **Tally** (ou Typeform) — formulaire de brief, basé sur `PROJECT_INTAKE_FORM.md`.
- **Make** (ou n8n) — orchestration : reçoit le brief, appelle l'API OpenAI/Claude avec les master prompts, range les résultats.
- **OpenAI API / Claude API** — génération des livrables à partir des master prompts (`prompts/`).
- **Google Docs / Notion** — destination des exports.
- **GitHub** (ce repo) — source de vérité pour les prompts, manuels et specs : Make/n8n ne fait qu'appeler l'API, la logique métier reste ici.

### Étapes

1. Recréer `PROJECT_INTAKE_FORM.md` comme formulaire Tally (un champ par ligne du formulaire).
2. Dans Make/n8n, créer un scénario déclenché par une nouvelle soumission Tally.
3. Étape 1 du scénario : construire le prompt final en injectant les réponses du formulaire dans `prompts/Website_Generator_Master_Prompt.md` (remplacement de variables `{{project_name}}`, `{{audience}}`, etc.).
4. Étape 2 : appel HTTP vers l'API OpenAI ou Claude avec ce prompt.
5. Étape 3 : répéter pour `Content_Generator_Master_Prompt.md` et `Image_Prompt_Master_Prompt.md`.
6. Étape 4 : appel à `Review_Master_Prompt.md` avec la sortie de l'étape précédente en entrée.
7. Étape 5 : si le statut de review est `Approved`, pousser le résultat dans un Google Doc (module Google Docs de Make) ou une page Notion (module Notion).
8. Étape 6 : si le statut est `Needs revision` ou `Blocked`, notifier (email/Slack) au lieu d'exporter.
9. Archiver chaque scénario exécuté : un dossier Google Drive ou une base Notion par projet, nommé selon `EXPORT_FORMATS.md`.

### Effort

Un scénario Make par générateur (site, contenu, image, review) = 4 scénarios. Réutilisables pour tout projet ORBIT suivant, pas seulement 24March Studio.

## Option B — Mini-app interne

Objectif : une interface qu'on pilote soi-même, sans dépendre d'un formulaire externe, avec un historique de projets consultable.

Stack recommandé :
- **Next.js** + **TypeScript** — framework app.
- **Tailwind** — style.
- **Markdown outputs** — chaque génération est un fichier `.md`, affiché et éditable dans l'app.
- **OpenAI API / Claude API** — branché plus tard (l'app fonctionne d'abord en mode "copier le prompt généré, coller la réponse").
- **Stockage local JSON ou SQLite** — un projet = un objet, structure définie dans `DATA_MODEL.md`.

### Étapes

1. Scaffolder l'app avec les routes décrites dans `app_blueprint/routes.md`.
2. Implémenter `IntakeForm` (voir `app_blueprint/components.md`) qui écrit un objet `Project` (voir `DATA_MODEL.md`) en JSON local.
3. Implémenter `WorkflowRunner` : pour chaque étape du flow (`WORKFLOWS.md`), un bouton "Generate" qui :
   - dans une v0 sans API : affiche le master prompt rempli avec les données du projet, prêt à copier dans ChatGPT/Claude, puis un champ pour coller la réponse.
   - dans une v1 avec API : appelle directement l'API avec le prompt rempli et stocke la réponse.
4. Implémenter `OutputPanel` pour afficher/éditer chaque livrable en Markdown.
5. Implémenter `ReviewScoreCard` pour afficher le résultat du `Review_Master_Prompt.md`.
6. Implémenter `ExportButton` selon `EXPORT_FORMATS.md`.
7. Ajouter SQLite seulement quand le nombre de projets dépasse ce que le JSON local gère confortablement (au-delà d'une dizaine de projets actifs).

### Effort

Une v0 sans appel API (mode "copier-coller assisté") est faisable en un sprint court. L'appel API direct est une itération suivante, pas un prérequis pour que l'app soit utile.

## Recommandation

Commencer par Option A pour valider le flow sur 24March Studio en conditions réelles. Passer à Option B seulement si le volume de projets ou le besoin d'un historique consultable le justifie.
