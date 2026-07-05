# Product Spec — ORBIT Automation Hub v1

## Problème

Créer un site, du contenu réseaux, des prompts image et une review pour un projet ORBIT demande aujourd'hui de repasser manuellement par chaque manuel d'agent, chaque prompt, dans le bon ordre, dans ChatGPT, à chaque fois. C'est lent, non répétable, et dépend de la mémoire de l'opérateur.

## Objectif v1

Un outil interne qui exécute ce flow de façon répétable :

```
Brief projet
→ stratégie
→ direction créative
→ structure de site
→ copywriting site
→ prompts image du site
→ calendrier contenu réseaux
→ captions / hooks / idées reels
→ review critique
→ export (Markdown / Google Doc-ready / PDF-ready)
```

## Ce que la v1 fait

- Capture un brief projet structuré (intake).
- Génère, via des master prompts, les livrables suivants :
  - stratégie de marque (positionnement, promesse, piliers)
  - direction créative (territoire visuel, visual DNA)
  - structure de site (sitemap, homepage, sections, copywriting, CTA, FAQ, SEO basique)
  - prompts image (hero, sections, réseaux, variations, contraintes négatives)
  - contenu réseaux (piliers, 30 idées de posts, 10 reels, 10 hooks, captions, calendrier 30 jours)
  - review critique (score /50, points forts, problèmes, risques, corrections, statut)
- Exporte chaque livrable en Markdown, prêt à coller dans Google Docs, Notion, ou à convertir en PDF.
- Garde une trace par projet (un dossier = un projet = un historique de sorties).

## Ce que la v1 ne fait pas

- Pas de génération d'images réelle (elle produit les *prompts*, pas les fichiers image).
- Pas de publication automatique sur Instagram / TikTok / Pinterest (elle produit le calendrier et les captions, pas le posting).
- Pas de CMS ou de site réellement déployé (elle produit la structure et les textes, pas le code du site).
- Pas de compte utilisateur, pas de facturation, pas de multi-tenant.
- Pas d'IA embarquée dans le repo : la génération se fait via ChatGPT, Claude, ou un appel API externe (voir `SETUP.md`).

## Utilisateurs v1

- Toi (opérateur unique), pour 24March Studio et les projets ORBIT suivants.
- Pas de collaborateurs externes en v1. L'app blueprint prévoit la structure pour en ajouter plus tard sans redesign.

## Critère de succès v1

Tu peux, pour un nouveau projet :

1. Remplir un brief en moins de 15 minutes.
2. Obtenir un site + un plan de contenu + des prompts image + une review en une session, sans réécrire les prompts à la main.
3. Exporter chaque livrable en Markdown propre, réutilisable tel quel.

## Roadmap au-delà de v1 (hors périmètre actuel)

- Connexion API OpenAI/Claude directe (bouton "Generate" qui appelle l'API sans copier-coller).
- Génération d'images réelle (Midjourney/DALL-E/Runway) branchée sur les prompts.
- Publication automatique via Make/n8n vers Instagram/TikTok/Pinterest.
- Multi-projets avec historique de versions et comparaison de sorties.

Voir `SETUP.md` Option B pour la marche à suivre technique quand ce cap sera pris.
