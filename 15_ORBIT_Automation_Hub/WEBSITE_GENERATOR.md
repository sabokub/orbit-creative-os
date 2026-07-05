# Website Generator — Spec fonctionnelle

S'appuie sur `02_Agents/Manuals/Website_Director_Manual.md` et `10_Prompt_Library/Website_Prompts.md`.
Prompt exécutable : `prompts/Website_Generator_Master_Prompt.md`.

## Entrée

- `Brief` (intake)
- `BrandKit` (stratégie)
- `CreativeDirection` (territoire visuel)

## Sortie garantie

1. **Positionnement web** — reformulation du positionnement pour le contexte site.
2. **Promesse hero** — une phrase, ce que le visiteur comprend en 3 secondes.
3. **Sitemap** — liste des pages, minimale.
4. **Structure homepage** — liste ordonnée de sections.
5. **Textes de section** — copywriting complet, pas des placeholders.
6. **CTA** — un CTA principal par section clé, formulé.
7. **Preuves à intégrer** — témoignages, avant/après, portfolio, chiffres.
8. **Offres à présenter** — reformulées pour le web (nom, promesse, pour qui).
9. **FAQ** — 5 à 8 questions réelles, avec réponses.
10. **Direction image hero** — description de l'image hero attendue (pas encore le prompt final).
11. **Prompts image** — un prompt par section illustrée (renvoie vers `IMAGE_PROMPT_GENERATOR.md`).
12. **Meta title / meta description** — prêts à coller dans le CMS.
13. **Ton UX writing** — règles de ton pour boutons, micro-copy, erreurs, confirmations.

## Règles de génération

- Une action principale par page (héritée de `Website_Director_Manual.md`).
- La preuve arrive avant les grandes promesses.
- Pas de section décorative sans fonction.
- Le hero doit être compréhensible sans scroller.
- La homepage doit expliquer l'activité en moins de 10 secondes de lecture.

## Structure homepage par défaut (studio de service créatif)

1. Hero — promesse + preuve visuelle immédiate
2. Ce que fait le studio (en une explication courte)
3. Pour qui (portrait audience, autoidentification)
4. Comment ça marche (process en 3-4 étapes)
5. Preuves (avant/après, portfolio, témoignages)
6. Offres (packages ou services)
7. FAQ
8. CTA final (prise de contact / booking)

## Sortie attendue (schéma)

Voir `DATA_MODEL.md` → `WebsiteOutput`.

## Exemple de référence

`examples/24March_Website_Output.md`

## Review liée

Toute sortie de ce générateur doit passer par `REVIEW_ENGINE.md` avant export, avec la grille "Site" du `Review_Master_Prompt.md`.
