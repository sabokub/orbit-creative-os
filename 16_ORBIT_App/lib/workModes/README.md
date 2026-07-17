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

## Agent link

The active mode's `contextPolicy.prioritizeMemoryTypes` flows into agent runs as
`boostTypes` (`/api/agents/run`, `/api/orchestrate`), which the shared context
resolver (`lib/agents/context.ts`) uses to prioritise the right memory — without
rebuilding or duplicating project context.
