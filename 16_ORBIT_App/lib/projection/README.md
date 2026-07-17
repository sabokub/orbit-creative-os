# Projection Layer — approved memory → Studio Brain

Turns an **approved** agent output into real, actionable Studio Brain state
(tasks, content, decisions) — never a parallel system. Memory stays the
source of provenance/versions/history; Studio Brain stays the source of
active operational state (`lib/studioBrain.ts`, untouched primitives:
`createItem`/`updateItem`/`createDecision`/`resolveDecision`).

## Guarantee

Only `status === "approved"` memory entries are ever projected (`engine.ts`
precondition). Draft/reviewed/rejected entries compute zero mutations.

## Pipeline

```
approved MemoryEntry
  → computeMutations()       pure, rule-based, per-agent (rules/*.ts)
  → annotateMutations()      reads current Studio Brain + links → create/update/skip/conflict
  → apply()                  writes via lib/studioBrain.ts, saves StudioBrainLink, journals via SyncService
```

## Modules

| File | Responsibility |
| --- | --- |
| `contracts.ts` | Zod for every projection contract (mutation, preview, result, conflict, link, policy). |
| `lineage.ts` | Walks a memory entry's `supersedes` chain to a stable root id. |
| `rules/` | One pure function per agent → `ProjectionMutation[]` (see table below). |
| `engine.ts` | `computeMutations` — pure compute, enforces the approved-only precondition. |
| `annotate.ts` | Reads links/items/decisions to turn raw mutations into accurate create/update/skip/conflict. |
| `stores.ts` + `redisStores.ts` + `inMemoryStores.ts` | `LinkStore`/`ConflictStore`/`ProjectionLogStore` ports + impls. |
| `service.ts` | `ProjectionService` — the only place that writes to Studio Brain from a projection. |
| `server.ts` | Redis wiring. |

## Idempotence & versioning

A mutation's `id` and `deduplicationKey` are **deterministic** (derived from
project + agent + target type + lineage root + item index) — preview and
apply always agree, and re-running a projection updates the SAME Studio Brain
item instead of duplicating it. A `StudioBrainLink` (keyed by that dedup key)
is the single row per logical target; re-projecting a new version of the same
agent output updates it in place, no supersede bookkeeping needed at the
Studio Brain level (history lives in memory's own versioning).

## Conflicts

Never silently overwritten:
- a linked task/content item that's already `done` → conflict (never reopen finished work).
- a linked, **resolved** decision whose content differs from the new version → conflict.

Resolution: `keep` (leave Studio Brain untouched), `replace`/`merge` (create a
NEW decision — Studio Brain decisions aren't editable in place — and re-point
the link; the conflict record permanently keeps old value + new value + both
provenances, regardless of resolution).

## Per-agent projection rules (v1 scope)

| Agent | Auto-safe | Needs confirmation |
| --- | --- | --- |
| Orbit Brain | `missingInfo[]` → clarification tasks; `decisionsMade[]` → auto-resolved decisions | `risks[]` → decisions |
| Brand Strategist | `keyMessages[]` → tasks | positioning/promise/value → ONE decision |
| Creative Director | `visualConcepts[]` → tasks | creative direction → ONE decision |
| Website Architect | `pages[]` → launch-critical tasks | sitemap → ONE decision |
| Content Strategist | `contentIdeas[]` + `calendar[]` → content items | — |
| Prompt Intelligence | `prompts[]` → tasks | — |
| Orbit Critic | `priorityFixes[]` → tasks (adds a recommendation, never overwrites the approved deliverable) | `verdict === "reject"` → ONE decision |

Not automated in this version (documented limitation, not silently dropped):
`objective`/`active-focus` projection — ActiveFocus already has its own
single-per-mode UI flow; auto-creating one risks fighting the user's manual
choice. `constraints`/`objectives`/`opportunities` stay in agent memory only
(read via context, not duplicated as Studio Brain rows).

## Routes

- `POST /api/projects/[id]/projections/preview` — read-only.
- `POST /api/projects/[id]/projections/apply` — `mode: "confirm" | "auto-safe"`.
- `GET /api/projects/[id]/projections` — applied history.
- `GET /api/projects/[id]/projection-conflicts`
- `POST /api/projects/[id]/projection-conflicts/[conflictId]/resolve`

## UI

`/projects/[id]/orbit` — each approved agent gets "Voir les changements
proposés" (preview inline), "Appliquer à Studio Brain" (confirm-all),
"Appliquer les changements sûrs" (auto-safe). Open conflicts render at the
bottom with old/new value, provenance, and Keep/Replace/Merge.

## Tests

`projection.test.ts` — pure-layer tests (precondition, rules, annotate
create/update/conflict, lineage stability, no cross-project leak) plus a
**real write-path suite** using the same Redis-mock convention as
`lib/studioBrain.unblock.test.ts` (shared in-memory Map behind
`@upstash/redis`), exercising the actual `lib/studioBrain.ts` primitives:
preview→apply, auto-safe filtering, idempotent re-apply, version-updates-
same-item, conflict creation + resolution, content creation, pilot-card
recompute after a projection, and a full mocked pipeline (`runAgent` →
approve → preview → apply → task visible in Studio Brain → journal entry).
