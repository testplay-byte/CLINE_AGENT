# Phase 2 Plan - Core Skeleton

Planner artifact (2026-08-22). Implements the SPEC Phase 2 acceptance row per AGENTS.md rule 2; live-test strategy per ADR-0003.

| Field | Value |
| --- | --- |
| Phase | 2 of 6 (SPEC section 7) |
| Objective | App boots with auto-started sidecar; SQLite migrations run; agent CRUD functional; single-agent chat round trip LIVE via OpenAI-compatible endpoint (ADR-0003) |
| Live target | OpenRouter key + model "ox Alpha"; exact model slug resolved at runtime via `GET https://openrouter.ai/api/v1/models` filtered for ox-alpha/stealth |
| Status | PLANNED - all tasks PENDING |
| Exit gate (SPEC Phase 2 row, adjusted per ADR-0003) | Boot + sidecar lifecycle + migrations + agent CRUD + live single-agent chat round trip on OpenRouter; Anthropic/OpenAI adapters wired and mock-tested |

## Objective

Turn the Phase 1 skeleton into a running product core: the Tauri shell boots the Fastify sidecar automatically, migrations apply the real schema, agents are manageable through the registry, and one user message travels user -> sidecar -> OpenRouter -> streamed tokens -> rendered reply, with usage recorded. Single-agent mode bypasses the orchestrator entirely: direct user->agent conversation.

## Task table

Status legend: PENDING - IN PROGRESS - BLOCKED - DONE.

| # | Task | Owner | Status | Done when |
| --- | --- | --- | --- | --- |
| T1 | Provider manager backend: CRUD for custom providers; key write-through to `secrets.local.md` (ADR-0011) + Windows Credential Manager; fetch-models endpoint proxying `<baseURL>/models` | developer | PENDING | Endpoints tested; key stored to both stores per ADR-0011 precedence; models list returned for preset and custom URLs |
| T2 | Sessions/messages/runs endpoints + WS streaming relay: stream `agent.message.delta` / `agent.message.complete` events from the AI SDK onto the WS hub | developer | PENDING | Event flow observable over WS with seq numbers; sessions/messages/runs persist |
| T3 | Chat completion path: single-agent mode = direct user->agent conversation (orchestrator bypass); provider adapter call; one `usage_records` row per request (FR-706 seam) | developer | PENDING | Live request to OpenRouter returns a completion; usage row written per request |
| T4 | Frontend API client + TanStack Query hooks + WS client with seq resume (gap-fill on reconnect) | developer | PENDING | Hooks drive the views; reconnect replays missed WS events by seq |
| T5 | Session view chat UI wired: composer sends, stream renders incrementally, agent selector picks the target agent | developer | PENDING | Message sent from UI streams tokens live into the transcript |
| T6 | Agents registry view functional CRUD against the API (FR-201..205 seams) | developer | PENDING | Create/edit/duplicate/delete agent reflected in DB and list view |
| T7 | Setup/onboarding flow functional (ADR-0012, FR-13xx): writes provider + key, test connection succeeds | developer | PENDING | Fresh profile completes Setup; provider + key persisted; models listed |
| T8 | Tauri shell boot verification: `pnpm tauri dev` boots the window; sidecar auto-start; health handshake; manual smoke by owner = first runnable test | tester | PENDING | Owner smoke passed; first-runnable announcement sent (AGENTS.md section g) |

## Exit criteria (mapped to SPEC Phase 2 acceptance row, adjusted per ADR-0003)

- [ ] App boots; window opens via `pnpm tauri dev`.
- [ ] Sidecar auto-starts with the shell and stops with it; health handshake OK (port + token).
- [ ] SQLite migrations run cleanly on first boot.
- [ ] Agent CRUD functional end-to-end (API + registry UI).
- [ ] Single-agent chat round trip LIVE on the OpenRouter OpenAI-compatible endpoint using the OpenRouter key; model slug "ox Alpha"/stealth resolved at runtime via `/models`.
- [ ] Anthropic and OpenAI adapters wired and mock-tested (live tests deferred per ADR-0003 / FR-410).
- [ ] One `usage_records` row per LLM request.
- [ ] Setup/onboarding completes and is re-runnable from Settings.
- [ ] Owner manual smoke = first runnable test; ntfy announcement sent.

## Known watch-items

1. better-sqlite3 Node 24 prebuilds OK on 12.4.1 - recheck on any dependency bump.
2. Fonts self-hosted (Space Grotesk + Geist Mono) - no CDN fetch at runtime (NFR-006).
3. WS token handshake parameter decision (query param vs header vs subprotocol) - settle before T2 wiring; record in `docs/architecture/api/overview.md`.
4. Model-slug resolution: cache the `/models` response; degrade gracefully if the slug lookup fails.

Deferred/backlog (no ADR-worthy decisions this phase): none beyond the watch-items above.