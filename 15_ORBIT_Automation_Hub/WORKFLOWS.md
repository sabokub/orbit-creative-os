# Workflows — ORBIT Automation Hub

## Workflow principal (v1)

```
1. Project Intake        → PROJECT_INTAKE_FORM.md
2. Strategy Generation    → Brand_Strategist_Manual.md + Strategy_Prompts.md
3. Creative Direction     → Creative_Director_Manual.md + Creative_Prompts.md
4. Website Generation     → WEBSITE_GENERATOR.md + prompts/Website_Generator_Master_Prompt.md
5. Content Generation     → CONTENT_GENERATOR.md + prompts/Content_Generator_Master_Prompt.md
6. Image Prompt Generation→ IMAGE_PROMPT_GENERATOR.md + prompts/Image_Prompt_Master_Prompt.md
7. Critical Review        → REVIEW_ENGINE.md + prompts/Review_Master_Prompt.md
8. Export                 → EXPORT_FORMATS.md
```

Chaque étape prend en entrée la sortie de l'étape précédente. Rien ne saute d'étape : Orbit ne va jamais directement au visuel sans stratégie (règle héritée de `13_ChatGPT_Runtime/Use_Case_Brand_Kit.md`).

## Étape 1 — Project Intake

Entrée : rien (ou un brief brut).
Sortie : `Brief` structuré (voir `DATA_MODEL.md`).
Outil : `PROJECT_INTAKE_FORM.md`, copiable dans ChatGPT/Claude ou branché à Tally/Typeform (Option A).

## Étape 2 — Strategy Generation

Entrée : `Brief`.
Sortie : `BrandKit.positioning_statement`, `promise`, `message_pillars`, `audience_insight`.
Prompt : `10_Prompt_Library/Strategy_Prompts.md` (existant, réutilisé tel quel).
Agent : `02_Agents/Manuals/Brand_Strategist_Manual.md`.

## Étape 3 — Creative Direction

Entrée : `BrandKit`.
Sortie : `CreativeDirection`.
Prompt : `10_Prompt_Library/Creative_Prompts.md` (existant, réutilisé tel quel).
Agent : `02_Agents/Manuals/Creative_Director_Manual.md`.

## Étape 4 — Website Generation

Entrée : `Brief` + `BrandKit` + `CreativeDirection`.
Sortie : `WebsiteOutput` complet + une liste d'`ImagePrompt` (hero + sections).
Prompt : `prompts/Website_Generator_Master_Prompt.md`.
Spec : `WEBSITE_GENERATOR.md`.

## Étape 5 — Content Generation

Entrée : `Brief` + `BrandKit` + `CreativeDirection`.
Sortie : `ContentOutput` complet (piliers, 30 posts, 10 reels, 10 hooks, calendrier 30 jours).
Prompt : `prompts/Content_Generator_Master_Prompt.md`.
Spec : `CONTENT_GENERATOR.md`.

## Étape 6 — Image Prompt Generation

Entrée : `CreativeDirection` + `WebsiteOutput` (sections à illustrer) + `ContentOutput` (posts à illustrer).
Sortie : liste complète d'`ImagePrompt` (site + réseaux + variations).
Prompt : `prompts/Image_Prompt_Master_Prompt.md`.
Spec : `IMAGE_PROMPT_GENERATOR.md`.

## Étape 7 — Critical Review

Entrée : n'importe quelle sortie (`WebsiteOutput`, `ContentOutput`, `ImagePrompt`, `BrandKit`, `CreativeDirection`).
Sortie : `Review` (score /50, statut).
Prompt : `prompts/Review_Master_Prompt.md`.
Agent : `02_Agents/Manuals/Critic_Manual.md`.
Règle : si `status = Blocked`, retour à l'étape correspondante avant de continuer.

## Étape 8 — Export

Entrée : n'importe quel livrable validé (`status != Blocked`).
Sortie : `Export` en Markdown, Google Doc-ready, ou PDF-ready.
Spec : `EXPORT_FORMATS.md`.

## Premier workflow à tester

Le plus court et le plus utile pour valider la v1 :

```
Brief 24March Studio (déjà fait, voir examples/24March_Studio_Project.md)
→ Website_Generator_Master_Prompt.md
→ Review_Master_Prompt.md sur le site généré
→ Export Markdown
```

Si ce cycle court fonctionne de bout en bout, le reste du flow (contenu, images) suit le même mécanisme.

## Variante : review-only

Pour juste faire réviser un output existant (site déjà écrit, moodboard déjà fait) sans repasser par tout le flow :

```
Output existant → Review_Master_Prompt.md → Export
```

## Variante : contenu only

Pour un mois de contenu sans toucher au site :

```
Brief → Strategy (si pas déjà fait) → Content_Generator_Master_Prompt.md → Image_Prompt_Master_Prompt.md (prompts visuels des posts) → Review → Export
```
