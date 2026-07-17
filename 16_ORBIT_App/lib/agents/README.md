# Agent Layer — Orbit Creative OS

Shared multi-agent engine. Every agent is a **specialization of the same
engine** (`engine.ts`), defined only by a role, instructions, expected inputs,
a structured (Zod) output, validation rules, dependencies and the memory it
may read. There is one engine, one memory, one orchestrator — no per-agent AI
code, no parallel store to Studio Brain.

## Pipeline

```
Brief → Orbit Brain → Brand Strategist → Creative Director →
Website Architect → Content Strategist → Prompt Intelligence → Orbit Critic
```

## Modules

| File | Responsibility |
| --- | --- |
| `contracts.ts` | All Zod + TS contracts (roles, memory, definitions, runs, review). |
| `memory/` | `MemoryStore` port + Redis / in-memory impls + `MemoryService` (versioning, lifecycle). |
| `runs/` | `RunStore` port + Redis / in-memory impls. |
| `definitions/` | The 7 agents (role, instructions, deps, output schema). |
| `registry.ts` | Role → definition lookup. |
| `context.ts` | Central context resolution — role-scoped, size-capped, traceable. |
| `schemaHint.ts` | Derives the JSON shape hint from a Zod schema. |
| `engine.ts` | `runAgent` — the single validated model-call path. |
| `orchestrator.ts` | `orchestrate` — single / sequence / full / review. |
| `server.ts` | Production wiring (Redis stores, OpenAI JSON, brand+brief preamble). |

## Persistence

Reuses the existing Upstash Redis under `orbit-hub:` (same DB as `lib/db.ts`
and `lib/studioBrain.ts`).

- `orbit-hub:project:{id}:memory:index` → memory entry ids
- `orbit-hub:memory:{id}` → `MemoryEntry`
- `orbit-hub:project:{id}:runs:index` → run ids
- `orbit-hub:run:{id}` → `OrchestrationRun`

## Memory model

Explicit categories (not a text blob): `brief`, `intake`, `fact`,
`hypothesis`, `decision`, `preference`, `constraint`, `reference`,
`deliverable`, `feedback`, `validation`, `analysis`. Lifecycle: `draft →
reviewed → approved → rejected → superseded`. **Append-only**: a new version
supersedes the previous entry (history preserved), never mutates it. Approved
entries are prioritised in future context; rejected/superseded are never active
truth.

## API

- `POST /api/agents/run` — one agent
- `POST /api/orchestrate` — single/sequence/full/review
- `GET|POST /api/projects/[id]/memory` — read all / create / set status
- `GET /api/projects/[id]/runs` — run history
- `GET /api/projects/[id]/agents` — roster + current state
- `POST /api/projects/[id]/review` — Orbit Critic

## UI

`/projects/[id]/orbit` — run agents/pipeline, view memory & runs, approve/reject
outputs, export. Reuses existing design classes.

## Tests

`agents.test.ts` — contracts, memory CRUD + versioning, context selection +
truncation, dependency gating, single-agent run, full orchestration, re-run
without duplication, chain halt, validation/reject, error handling. The engine
takes an injected `generate`, so the whole flow is tested without a live model.
