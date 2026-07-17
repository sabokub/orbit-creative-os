# Work Modes — contextual views over one Orbit

Modes are **views, not silos**. Build, Création, Contenu, Client, Pilotage all
share the same memory, Studio Brain, agent registry, orchestrator, tasks,
progress journal and persisted data. A mode only changes emphasis: navigation,
priority widgets, quick actions, highlighted agents, filters, and the context
policy sent to agents. Data created in one mode is available in every other.

## Modules

| File | Responsibility |
| --- | --- |
| `contracts.ts` | Zod for `WorkMode`, `WorkModeConfig`, navigation/widget/action/agent-priority/context-policy. |
| `config.ts` | The 5 mode configs (validated at load). Nav hrefs reference existing pages — modes never delete pages. |
| `resolveContext.ts` | `resolveWorkModeContext` — returns context boosts for a mode+agent. No context duplication; only reprioritisation. |

## Global state

`contexts/WorkModeContext.tsx` — `WorkModeProvider` + `useWorkMode()`. Single
source of truth, persisted to `localStorage` (`orbit:work-mode`), default
`build`. Mounted once in `app/layout.tsx`.

- `components/WorkModeSelector.tsx` — instant switcher in the nav (no reload).
- `NavBar` renders the active mode's `navigationItems` (desktop + mobile).
- `components/WorkModeBanner.tsx` — mode-aware home dashboard section.

## Pilot cards & ActiveFocus (`focus/`, `pilot/`)

Each mode has ONE detailed steering card (`components/ModePilotCard.tsx`),
rendered first on the dashboard. Level 1 (objective, weighted progress, single
immediate priority, next action, primary blocker, nearest deadline,
"Continuer") always precedes Level 2 (mode-specific charts) — top-to-bottom on
mobile, no horizontal carousel.

- `focus/`: `ActiveFocus` contracts + store (port/Redis/in-memory) + service
  enforcing **one active focus per mode** (replacing archives the previous).
- `pilot/`: shared `ModeInputs` → per-mode `calculators.ts` (weighted, not naive:
  impact×urgency, launch-critical ×1.5, done-but-untested credited < 1, rejected
  excluded, approved > draft), `priority.ts` (`resolveCurrentPriority`, rule-based
  single priority), `blockers.ts` (primary + real cross-mode blockers),
  `build.ts` (assembles `ModePilotData`), `server.ts` (gathers from Studio Brain
  + memory + progress; filters to the focus project for client/creation → no
  cross-project leak).
- Financials are never invented — "Données insuffisantes" when data is missing.
- Focus mode (`useWorkMode().focusMode`, persisted per mode) hides secondary nav
  and charts, keeping only the card essentials.

Routes: `GET /api/work-modes/[mode]/pilot`, `GET|POST|PATCH
/api/work-modes/[mode]/focus`, `POST /api/work-modes/[mode]/focus/complete`,
`GET /api/work-modes/[mode]/priority`.

## Agent link

The active mode's `contextPolicy.prioritizeMemoryTypes` flows into agent runs as
`boostTypes` (`/api/agents/run`, `/api/orchestrate`), which the shared context
resolver (`lib/agents/context.ts`) uses to prioritise the right memory — without
rebuilding or duplicating project context.
