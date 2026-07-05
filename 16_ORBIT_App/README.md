# ORBIT Automation Hub — App

Mini-interface Next.js pour piloter le flow ORBIT (brief → stratégie → créa → site → contenu → images → review → export), conforme au blueprint `15_ORBIT_Automation_Hub/app_blueprint/`.

## Ce que c'est

- App Next.js 14 (App Router) + TypeScript + Tailwind.
- Stockage partagé via une base Redis (Upstash), accessible depuis n'importe quel appareil connecté au même déploiement — PC, tablette, mobile.
- Génération en mode "copier-coller assisté" : l'app remplit les master prompts avec les données du projet, tu les copies dans ChatGPT/Claude, tu colles la réponse, l'app la range dans le projet.
- 100% responsive.

## Architecture

- `app/api/projects/` — routes API (GET/POST liste, GET/PUT/DELETE par projet).
- `lib/db.ts` — accès Redis (server-only, jamais exposé au navigateur).
- `lib/storage.ts` — client léger qui appelle ces routes API depuis les pages.
- Aucune clé API IA n'est stockée côté serveur : la génération reste manuelle (copier/coller).

## Base de données — Redis (Upstash)

### En production (Vercel)

1. Dans le dashboard Vercel, ouvre le projet une fois importé.
2. Onglet **Storage** → **Create Database** → **Upstash Redis** (marketplace intégration officielle, gratuite pour ce volume d'usage).
3. Vercel injecte automatiquement les variables d'environnement nécessaires (`KV_REST_API_URL` / `KV_REST_API_TOKEN` ou `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` selon l'intégration choisie) sur le projet déployé.
4. Redéploie si besoin (Vercel redéploie automatiquement après l'ajout d'une variable d'environnement).

Sans cette étape, l'app affiche un message clair ("Aucune base connectée...") au lieu de planter.

### En local

```bash
npm install
vercel env pull .env.local   # récupère les identifiants Redis liés au projet Vercel
npm run dev
```

Sans `.env.local`, l'app démarre mais toutes les routes `/api/projects` renvoient une erreur explicite — utile pour développer l'UI sans dépendre d'une base tout de suite.

## Pages

- `/` — Dashboard, liste des projets.
- `/projects/new` — Nouveau projet (brief).
- `/projects/[id]` — Workspace : brief, sorties générées, reviews, exports.
- `/projects/[id]/run?step=...` — Workflow Runner : prompt rempli + zone pour coller la réponse.
- `/projects/[id]/library` — Historique des sorties et exports.

## Déploiement sur Vercel

### Option 1 — via l'interface Vercel

1. Connecte le repo GitHub `sabokub/orbit-creative-os` à Vercel (New Project → Import Git Repository).
2. Dans les settings du projet Vercel, définis le **Root Directory** sur `16_ORBIT_App`.
3. Framework Preset : Next.js (détecté automatiquement).
4. Ajoute la base Redis (voir section ci-dessus) avant ou juste après le premier déploiement.
5. Déploie.

### Option 2 — via la CLI Vercel

```bash
cd 16_ORBIT_App
npx vercel --prod
```

## Limites de cette v1

- Un seul espace de données partagé (pas de comptes utilisateurs séparés) : adapté à un usage interne mono-opérateur, pas à plusieurs clients isolés.
- Pas d'appel direct à une API IA : la génération reste manuelle. Voir `../15_ORBIT_Automation_Hub/SETUP.md` pour brancher une clé API plus tard.
- L'export Google Doc / PDF n'est pas automatisé : le bouton "Exporter" télécharge un `.md`, à coller dans Google Docs ou convertir en PDF (voir `../15_ORBIT_Automation_Hub/EXPORT_FORMATS.md`).
