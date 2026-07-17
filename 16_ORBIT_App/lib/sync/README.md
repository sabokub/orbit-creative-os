# Sync Layer — Orbit as source of truth

Makes Orbit the central history for ChatGPT, Claude, Claude Code and Orbit
itself. Conversations are ingested, classified and turned into structured
progress; **only confirmed decisions/validations change active project truth**
(promotion happens through the agent `MemoryService`, not here). Everything
keeps exact provenance.

## Modules

| File | Responsibility |
| --- | --- |
| `contracts.ts` | Zod for sources, `ExternalConversation`, `ProgressEntry` (central journal), `SessionReport`, `ClaudeCodeReport`, extraction, sync status. |
| `stores.ts` + `redisStores.ts` + `inMemoryStores.ts` | Conversation/Progress ports + Redis (`orbit-hub:`) and in-memory impls. |
| `ingest.ts` | Deterministic, **offline** normalization + extraction (no model, no injection surface). |
| `service.ts` | `SyncService`: import, journal, Claude Code / session report ingestion (idempotent), aggregate status. |
| `context.ts` | `buildExternalAssistantContext` — compact, size-capped context package for ChatGPT/Claude/Claude Code. |
| `server.ts` | Redis wiring + `verifyIngestSecret` (fail-closed shared-secret guard). |

## Routes

- `POST /api/conversations/import`
- `GET /api/projects/[id]/conversations`
- `GET|POST /api/projects/[id]/progress`
- `POST /api/projects/[id]/context/export`
- `POST /api/projects/[id]/conversation/analyze`
- `POST /api/integrations/claude-code/progress` (secret + Zod + dedupe)
- `GET /api/projects/[id]/sync-status`
- `POST /api/integrations/openai/messages` (functional)
- `POST /api/integrations/anthropic/messages` (prepared; 501 without `ANTHROPIC_API_KEY`)

## Claude Code → Orbit

`POST /api/integrations/claude-code/progress` with header `X-Orbit-Secret:
$ORBIT_INGEST_SECRET` and a `ClaudeCodeReport` body. Verifies the secret,
validates, refuses duplicates (`sessionId` + commit), appends a journal entry,
returns exactly what changed. Claims land as `declared` — a Claude claim is not
proof; GitHub-based verification is layered on later.

## Security

Imported content is untrusted external data — never treated as system
instructions (deterministic extraction reads it as data only). API keys are
server-only. The ingest endpoint fails closed when no secret is configured.

## Deferred (per the MVP priority list)

Live realtime sync of all external interfaces, historical export import, and
advanced GitHub verification (commit/PR/checks/deploy correlation) build on this
foundation next.
