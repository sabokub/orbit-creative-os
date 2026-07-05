# ORBIT Automation Hub — v1

## Ce que c'est

Une couche pratique posée par-dessus ORBIT.

Elle ne remplace rien : elle assemble les modules ORBIT existants (Brand, Creative, Website, Content, Image, Critic) en un flow exécutable, avec des prompts prêts à l'emploi, un modèle de données simple et un blueprint d'interface.

Objectif : produire un site, du contenu réseaux, des prompts image et une review critique pour un projet réel, sans tout refaire à la main dans ChatGPT à chaque fois.

Projet pilote : **24March Studio** (studio de direction artistique d'intérieur).

## Ce que ça n'est pas

- Ce n'est pas une app SaaS.
- Ce n'est pas un remplacement des manuels agents (`02_Agents/Manuals/`) ni de la bibliothèque de prompts (`10_Prompt_Library/`).
- Ce n'est pas encore une automatisation codée. C'est une spécification produit + des prompts + un blueprint d'app, exploitables immédiatement en manuel ou semi-automatique.

## Structure du dossier

```
15_ORBIT_Automation_Hub/
  README.md                     → ce fichier
  PRODUCT_SPEC.md                → ce que le produit v1 fait et ne fait pas
  SETUP.md                       → 2 options d'implémentation (no-code / mini-app)
  DATA_MODEL.md                  → structure de données d'un projet ORBIT
  WORKFLOWS.md                   → le flow complet, étape par étape
  PROJECT_INTAKE_FORM.md         → formulaire de brief prêt à copier / brancher à Tally
  WEBSITE_GENERATOR.md           → spec fonctionnelle du générateur de site
  CONTENT_GENERATOR.md           → spec fonctionnelle du générateur de contenu
  IMAGE_PROMPT_GENERATOR.md      → spec fonctionnelle du générateur de prompts image
  REVIEW_ENGINE.md               → spec fonctionnelle du moteur de review
  EXPORT_FORMATS.md              → formats d'export (Markdown, Google Doc, PDF)
  examples/                      → sorties concrètes pour 24March Studio
  prompts/                       → master prompts copier-coller (ChatGPT / Claude / API / Make / n8n)
  app_blueprint/                 → spec d'une mini-interface interne
```

## Comment lire ce dossier

1. `PRODUCT_SPEC.md` pour comprendre le périmètre v1.
2. `WORKFLOWS.md` pour voir le flow complet.
3. `prompts/` pour utiliser les master prompts directement.
4. `examples/` pour voir un cas réel (24March Studio) de bout en bout.
5. `SETUP.md` si tu veux passer à une automatisation réelle (no-code ou mini-app).
6. `app_blueprint/` si tu veux coder l'interface plus tard.

## Lien avec le reste d'ORBIT

Cette couche s'appuie sur :

- `02_Agents/Manuals/` — les manuels de chaque agent (Brand Strategist, Creative Director, Website Director, Content Director, Image Director, Critic).
- `10_Prompt_Library/` — les prompts courts existants, réutilisés et étendus ici en master prompts complets.
- `13_ChatGPT_Runtime/` — le runtime ChatGPT (Start Here, commandes, quality gate, intake) qui reste la porte d'entrée conversationnelle.
- `11_Automated_Workflows/` — les specs de workflow existantes, ici rendues exécutables avec des étapes concrètes et des sorties attendues.

Rien n'est dupliqué : chaque fichier de ce dossier référence les fichiers ORBIT existants au lieu de les recopier.
