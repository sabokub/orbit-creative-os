# Routes

## 1. `/` — Dashboard

Objectif : voir tous les projets en un coup d'œil et démarrer une action.

Contenu :
- Liste de `ProjectCard` (un par projet, triés par date de dernière activité).
- Bouton "New Project" (→ `/projects/new`).
- Bloc "Workflows disponibles" listant les 4 générateurs + review, avec accès direct au dernier projet actif pour chacun.

États possibles :
- Vide (aucun projet) → afficher un état vide avec le bouton "New Project" en avant.
- Liste normale.

Actions utilisateur :
- Cliquer une `ProjectCard` → `/projects/:id`.
- Cliquer "New Project" → `/projects/new`.

Données nécessaires : liste de `Project` (id, name, stage, updated_at).

## 2. `/projects/new` — New Project

Objectif : capturer le brief et créer le projet.

Contenu :
- `IntakeForm` (calqué sur `../PROJECT_INTAKE_FORM.md`).
- `WorkflowSelector` : choisir quel(s) générateur(s) lancer en premier (site / contenu / images / tout le flow).
- Zone d'upload de références visuelles (optionnelle, fichiers stockés localement, liés au projet).

États possibles :
- Formulaire vide.
- Formulaire en cours de saisie (validation champ par champ, aucun champ bloquant sauf nom du projet).
- Soumission réussie → redirection `/projects/:id`.

Actions utilisateur :
- Remplir les champs.
- Choisir un workflow de départ.
- Uploader des références.
- Valider → crée l'objet `Project` (stage: `brief`).

Données nécessaires : schéma `Brief` (voir `../DATA_MODEL.md`).

## 3. `/projects/:id` — Project Workspace

Objectif : vue centrale d'un projet — brief, sorties générées, reviews, exports.

Contenu :
- Résumé du brief (lecture seule, avec lien "Éditer").
- `OutputPanel` par livrable généré (BrandKit, CreativeDirection, WebsiteOutput, ContentOutput, ImagePrompts).
- `ReviewScoreCard` pour chaque review effectuée.
- `ExportButton` par livrable validé.
- Accès à `/projects/:id/run` pour lancer une nouvelle étape.

États possibles :
- Projet au stade `brief` uniquement → n'afficher que le résumé du brief + CTA "Lancer la stratégie".
- Projet avec sorties partielles → afficher ce qui existe, griser ce qui manque.
- Projet complet → tout affiché, exports disponibles.

Actions utilisateur :
- Éditer le brief.
- Lancer une étape suivante (→ `/projects/:id/run`).
- Exporter un livrable.
- Voir le détail d'une review.

Données nécessaires : objet `Project` complet.

## 4. `/projects/:id/run` — Workflow Runner

Objectif : exécuter une étape du flow (`../WORKFLOWS.md`) avec visibilité sur ce qui se passe.

Contenu :
- Liste des étapes du workflow choisi, avec statut (à faire / en cours / fait).
- `PromptPreview` : le master prompt rempli avec les données du projet, visible avant génération.
- Bouton "Generate" (appelle l'API si configurée, sinon affiche le prompt à copier + un champ pour coller la réponse).
- Bouton "Review" (lance `Review_Master_Prompt.md` sur la sortie qui vient d'être générée).
- Bouton "Export" (actif seulement si la review n'est pas `Blocked`).

États possibles :
- Étape non commencée.
- Génération en cours (si appel API).
- Sortie générée, en attente de review.
- Sortie reviewée (`Approved` / `Needs revision` / `Blocked`).
- Sortie exportée.

Actions utilisateur :
- Voir le prompt rempli avant de lancer.
- Lancer la génération.
- Lancer la review.
- Corriger et régénérer si `Blocked` ou `Needs revision`.
- Exporter.

Données nécessaires : étape courante, `Project`, master prompt correspondant.

## 5. `/projects/:id/library` — Output Library

Objectif : archives par projet, historique de toutes les versions générées.

Contenu :
- Liste chronologique de tous les outputs générés pour ce projet (même les versions remplacées).
- Filtre par type de livrable (site / contenu / images / review).
- Lien de téléchargement vers chaque export (`EXPORT_FORMATS.md`).

États possibles :
- Vide (aucune génération encore).
- Liste avec historique.

Actions utilisateur :
- Filtrer par type.
- Télécharger un export.
- Comparer deux versions (optionnel, hors v1 stricte).

Données nécessaires : liste d'`Export` + versions antérieures des livrables (si conservées).
