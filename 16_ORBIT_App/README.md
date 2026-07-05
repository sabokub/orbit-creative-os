# ORBIT Automation Hub — App

Mini-interface Next.js pour piloter le flow ORBIT (brief → stratégie → créa → site → contenu → images → review → export), conforme au blueprint `15_ORBIT_Automation_Hub/app_blueprint/`.

## Ce que c'est

- App Next.js 14 (App Router) + TypeScript + Tailwind.
- Aucun backend : chaque projet est stocké dans le `localStorage` du navigateur. Rien n'est envoyé à un serveur.
- Génération en mode "copier-coller assisté" : l'app remplit les master prompts avec les données du projet, tu les copies dans ChatGPT/Claude, tu colles la réponse, l'app la range dans le projet.
- 100% responsive : utilisable sur PC, tablette et mobile.

## Pages

- `/` — Dashboard, liste des projets.
- `/projects/new` — Nouveau projet (brief).
- `/projects/[id]` — Workspace : brief, sorties générées, reviews, exports.
- `/projects/[id]/run?step=...` — Workflow Runner : prompt rempli + zone pour coller la réponse.
- `/projects/[id]/library` — Historique des sorties et exports.

## Développement local

```bash
npm install
npm run dev
```

Ouvre `http://localhost:3000`.

## Déploiement sur Vercel

### Option 1 — via l'interface Vercel

1. Connecte le repo GitHub `sabokub/orbit-creative-os` à Vercel (New Project → Import Git Repository).
2. Dans les settings du projet Vercel, définis le **Root Directory** sur `16_ORBIT_App`.
3. Framework Preset : Next.js (détecté automatiquement).
4. Déploie. Aucune variable d'environnement n'est nécessaire pour la v1 (pas d'appel API externe).

### Option 2 — via la CLI Vercel

```bash
cd 16_ORBIT_App
npx vercel --prod
```

Répondre "Root directory" avec `.` si la commande est lancée depuis `16_ORBIT_App`, ou pointer vers ce dossier si lancée depuis la racine du repo.

## Limites de cette v1

- Les données vivent uniquement dans le navigateur utilisé (`localStorage`). Changer de navigateur ou d'appareil ne partage pas les projets. Pas de synchronisation multi-appareil en v1.
- Pas d'appel direct à une API IA : la génération reste manuelle (copier le prompt, coller la réponse). Voir `../15_ORBIT_Automation_Hub/SETUP.md` pour brancher une clé API plus tard.
- L'export Google Doc / PDF n'est pas automatisé : le bouton "Exporter" télécharge un `.md`, à coller dans Google Docs ou convertir en PDF (voir `../15_ORBIT_Automation_Hub/EXPORT_FORMATS.md`).
