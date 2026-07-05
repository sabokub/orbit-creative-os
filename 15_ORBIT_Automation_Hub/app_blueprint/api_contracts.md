# API Contracts

Contrats minimaux pour l'app (Option B). En v0 sans clé API branchée, ces routes gèrent uniquement la persistance locale ; l'appel modèle reste manuel (copier/coller). En v1 avec clé API, `POST /generate` appelle directement OpenAI/Claude.

## `GET /api/projects`

Retourne la liste des projets (résumé, pour le Dashboard).

Réponse : `[{ id, name, type, stage, updated_at, last_review_status }]`

## `POST /api/projects`

Crée un projet à partir d'un `Brief` soumis par `IntakeForm`.

Corps : objet `Brief` (voir `DATA_MODEL.md`).
Réponse : `{ id, stage: "brief" }`

## `GET /api/projects/:id`

Retourne l'objet `Project` complet.

## `PATCH /api/projects/:id`

Met à jour un champ du projet (édition manuelle d'un livrable, correction de brief).

Corps : `{ field: "website_output", value: {...} }`

## `POST /api/projects/:id/generate`

Remplit un master prompt (`prompts/`) avec les données du projet et retourne le prompt prêt à copier, ou appelle l'API modèle si une clé est configurée.

Corps : `{ step: "website" | "content" | "images" | "review", target?: string }`
Réponse (sans clé API) : `{ filled_prompt: string }`
Réponse (avec clé API) : `{ filled_prompt: string, generated_output: string }`

## `POST /api/projects/:id/paste-result`

Enregistre une réponse collée manuellement (mode copier-coller assisté).

Corps : `{ step: "website" | "content" | "images" | "review", output: string }`
Réponse : `{ ok: true, stage: <updated stage> }`

## `POST /api/projects/:id/review`

Lance `Review_Master_Prompt.md` sur un livrable donné.

Corps : `{ target: "website" | "content" | "image" | "brand_kit" | "creative_direction" }`
Réponse : objet `Review` (voir `DATA_MODEL.md`).

## `POST /api/projects/:id/export`

Génère un export dans le format demandé.

Corps : `{ target: string, format: "markdown" | "google-doc" | "pdf" }`
Réponse : `{ file_path: string }`

## Note sur la clé API

Aucune clé API n'est stockée dans le repo. En Option B, la clé vit dans une variable d'environnement locale (`.env`, non commité). Tant qu'elle n'est pas configurée, `/generate` fonctionne en mode "prompt prêt à copier" — l'app reste utilisable sans jamais appeler de service externe.
