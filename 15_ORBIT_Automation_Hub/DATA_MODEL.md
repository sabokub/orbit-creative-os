# Data Model — ORBIT Automation Hub

Modèle de données minimal. Utilisable tel quel en JSON local (Option B) ou en colonnes Notion/Airtable (Option A).

## Project

```json
{
  "id": "24march-studio",
  "name": "24March Studio",
  "type": "interior-direction-studio",
  "stage": "brief" ,
  "created_at": "2026-07-05",
  "brief": { "$ref": "Brief" },
  "brand_kit": { "$ref": "BrandKit" },
  "creative_direction": { "$ref": "CreativeDirection" },
  "website_output": { "$ref": "WebsiteOutput" },
  "content_output": { "$ref": "ContentOutput" },
  "image_prompts": [ { "$ref": "ImagePrompt" } ],
  "reviews": [ { "$ref": "Review" } ],
  "exports": [ { "$ref": "Export" } ]
}
```

`stage` values: `brief` → `strategy` → `creative` → `website` → `content` → `images` → `review` → `exported`.

## Brief

Champs alignés sur `PROJECT_INTAKE_FORM.md` :

```json
{
  "project_name": "",
  "activity": "",
  "audience": "",
  "offer": "",
  "positioning_goal": "",
  "style_keywords": [],
  "avoid_keywords": [],
  "colors_accent": [],
  "references": [],
  "competitors": [],
  "constraints": { "budget": "", "timeline": "", "tools": "", "format": "" },
  "channels": ["instagram", "tiktok", "pinterest", "website"],
  "needed_output": [],
  "success_criteria": ""
}
```

## BrandKit

```json
{
  "positioning_statement": "",
  "promise": "",
  "message_pillars": [],
  "tone_of_voice": { "use": [], "avoid": [], "sample_phrases": [] },
  "audience_insight": ""
}
```

## CreativeDirection

```json
{
  "visual_territory": { "color_behaviour": "", "lighting": "", "composition": "", "materials": "", "styling": "" },
  "visual_dna": [],
  "reference_translation": [],
  "art_direction_rules": [],
  "red_flags": []
}
```

## WebsiteOutput

```json
{
  "sitemap": [],
  "homepage": {
    "hero": { "headline": "", "subheadline": "", "cta": "" },
    "sections": [ { "name": "", "goal": "", "copy": "", "proof": "", "cta": "" } ],
    "faq": [ { "q": "", "a": "" } ]
  },
  "seo": { "meta_title": "", "meta_description": "" },
  "ux_tone": ""
}
```

## ContentOutput

```json
{
  "pillars": [],
  "recurring_formats": [],
  "post_ideas": [ { "id": 1, "pillar": "", "idea": "" } ],
  "reel_ideas": [ { "id": 1, "hook": "", "concept": "" } ],
  "hooks": [],
  "captions_examples": [],
  "calendar_30_days": [ { "day": 1, "channel": "", "format": "", "topic": "" } ],
  "reuse_logic": "",
  "channel_goals": { "instagram": "", "tiktok": "", "pinterest": "" }
}
```

## ImagePrompt

```json
{
  "id": "",
  "use_case": "hero | section | instagram-post | pinterest-pin | moodboard",
  "prompt": "",
  "negative_constraints": [],
  "variations": []
}
```

## Review

```json
{
  "target": "website | content | image | brand_kit | creative_direction",
  "score": 0,
  "max_score": 50,
  "strengths": [],
  "issues": [],
  "risks": [],
  "recommended_fixes": [],
  "status": "Approved | Needs revision | Blocked"
}
```

## Export

```json
{
  "format": "markdown | google-doc | pdf",
  "target": "website | content | images | review | full-project",
  "file_path": "",
  "created_at": ""
}
```

## Notes d'implémentation

- Option A (no-code) : chaque objet devient une table Notion/Airtable, `$ref` devient une relation.
- Option B (mini-app) : chaque objet devient un fichier JSON dans `/data/projects/<id>/`, ou une table SQLite.
- Aucun champ n'est obligatoire à 100% : un projet peut rester au stade `brief` tant que la stratégie n'est pas validée par Orbit Critic.
