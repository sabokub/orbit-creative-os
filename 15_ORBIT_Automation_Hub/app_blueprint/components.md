# Components

## ProjectCard

Objectif : représenter un projet dans le Dashboard.

Champs affichés : nom du projet, type, stage actuel, date de dernière activité, mini badge de statut de review le plus récent.

États possibles : normal, en cours de génération (indicateur discret), bloqué (badge rouge si une review récente est `Blocked`).

Actions utilisateur : clic → `/projects/:id`.

Données nécessaires : `Project.id`, `name`, `type`, `stage`, `updated_at`, dernier `Review.status`.

## WorkflowSelector

Objectif : choisir quel générateur lancer.

Champs : liste à choix (Stratégie / Direction créative / Site / Contenu / Images / Review / Flow complet).

États possibles : aucune sélection, une sélection, flow complet sélectionné (désactive la sélection individuelle).

Actions utilisateur : sélectionner un ou plusieurs générateurs, valider.

Données nécessaires : liste des étapes disponibles (voir `../WORKFLOWS.md`).

## IntakeForm

Objectif : capturer le brief projet.

Champs : tous les champs de `../PROJECT_INTAKE_FORM.md` (projet, activité, audience, positionnement, direction visuelle, canaux, contraintes, livrables demandés, critère de succès).

États possibles : vide, en cours, incomplet (nom du projet manquant → bloquant), complet.

Actions utilisateur : saisir, uploader des références, soumettre.

Données nécessaires : écrit un objet `Brief` (voir `../DATA_MODEL.md`).

## OutputPanel

Objectif : afficher et éditer un livrable généré (Markdown).

Champs : titre du livrable, contenu Markdown rendu, bouton "Éditer" (bascule en textarea brut), horodatage de génération.

États possibles : non généré (placeholder "à générer"), généré non reviewé, généré et reviewé, en cours d'édition.

Actions utilisateur : lire, éditer manuellement, régénérer, envoyer en review, exporter.

Données nécessaires : le livrable concerné (`WebsiteOutput`, `ContentOutput`, `ImagePrompt[]`, `BrandKit`, `CreativeDirection`).

## ReviewScoreCard

Objectif : afficher le résultat d'une review.

Champs : cible reviewée, score /10 (ou /50 si projet complet), points forts, problèmes, risques, corrections recommandées, badge de statut.

États possibles : `Approved` (vert), `Needs revision` (orange), `Blocked` (rouge).

Actions utilisateur : voir le détail, relancer une review après correction, naviguer vers le livrable concerné.

Données nécessaires : objet `Review` (voir `../DATA_MODEL.md`).

## ExportButton

Objectif : déclencher l'export d'un livrable.

Champs : sélecteur de format (Markdown / Google Doc-ready / PDF-ready).

États possibles : désactivé (si `Review.status = Blocked` ou pas encore reviewé), actif, export en cours, export terminé (lien de téléchargement).

Actions utilisateur : choisir un format, exporter, télécharger.

Données nécessaires : le livrable, son statut de review, règles de `../EXPORT_FORMATS.md`.

## PromptPreview

Objectif : montrer le master prompt exact qui sera envoyé, avant génération.

Champs : contenu du prompt rempli (variables substituées), bouton "Copier", bouton "Generate".

États possibles : prompt prêt, prompt en cours de génération, réponse reçue.

Actions utilisateur : copier le prompt pour usage manuel (ChatGPT/Claude), ou lancer directement si l'API est branchée, coller une réponse générée manuellement.

Données nécessaires : master prompt template (`../prompts/`) + données du projet pour remplir les `{{variables}}`.

## StatusBadge

Objectif : indicateur visuel de statut réutilisé partout (ProjectCard, OutputPanel, ReviewScoreCard).

Valeurs : `Approved` (vert), `Needs revision` (orange), `Blocked` (rouge), `Not reviewed` (gris), `In progress` (bleu).

États possibles : une valeur à la fois, pas de combinaison.

Actions utilisateur : aucune (composant d'affichage seul), éventuellement clic pour voir le détail de la review.

Données nécessaires : une valeur de statut.
