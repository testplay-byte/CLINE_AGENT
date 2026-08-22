# Sidecar API — overview

| Field | Value |
| --- | --- |
| Product | ACUTE-CODE — agent-core sidecar REST + WebSocket contracts |
| Version | v1.0 (Phase 1) |
| Status | Draft — pending owner review |
| Authority | This file is the authoritative endpoint contract (ARCHITECTURE.md §6 indexes it) |
| Shapes | All request/response DTOs reference `@acute/shared` (`shared/src/types.ts`, `events.ts`, `schemas.ts`) |

## 1. Conventions

- **Base URL:** `http://127.0.0.1:<port>` — loopback only; the port is chosen free by the Tauri shell at launch (ARCHITECTURE.md §4). No other interface is bound.
- **Auth gate:** when a launch token was configured, every HTTP request must carry `x-acute-token: <token>` and the WS handshake must pass the same value (`token` query param or header). Requests without a valid token get `401`. When no token is configured the gate is off.
- **Body format:** JSON only (`application/json`) unless noted. Zod schemas in `@acute/shared` are the validation source of truth; violations return the error envelope with code `validation_failed`.
- **Error envelope:** every non-2xx response uses exactly this shape:

  ```json
  { "error": { "code": "not_found", "message": "human-readable summary", "details": { } } }
  ```

  `details` is optional and may be `{}`. Codes used: `validation_failed`, `unauthorized`, `not_found`, `conflict`, `approval_required`, `provider_error`, `internal`.
- **IDs:** prefixed strings — `p_` projects, `a_` agents, `s_` sessions, `m_` messages, `t_` tasks, `ap_` approvals, `r_` runs, `u_` usage records.
- **Phase column:** `P2` = Phase 2 core surface (ships with first booting app); `P3+` = later phases per SPEC §7.

## 2. Health & meta — P2

| Method | Path | Purpose | Request | Response | Phase |
| --- | --- | --- | --- | --- | --- |
| GET | `/health` | Boot handshake / readiness probe | — | `{ status: 'ok', migrations: 'applied' }` | P2 |
| GET | `/version` | App + schema versions | — | `{ version, schemaVersion, node }` | P2 |

## 3. Projects — P2

| Method | Path | Purpose | Request | Response | Phase |
| --- | --- | --- | --- | --- | --- |
| POST | `/projects` | Bind/register a project folder | `ProjectInput` | `Project` | P2 |
| GET | `/projects` | List all projects | — | `Project[]` | P2 |
| GET | `/projects/recent` | Most recently active projects (Dashboard list) | `?limit=` | `Project[]` | P2 |
| GET | `/projects/:id` | Single project | — | `Project` | P2 |
| PATCH | `/projects/:id` | Rename, recolor, set root path | Partial `ProjectInput` | `Project` | P2 |
| DELETE | `/projects/:id` | Unbind project (transcripts kept) | — | `204` | P2 |

## 4. Agents — P2

Registry over the FR-203 agent schema (`Agent` in `@acute/shared`). Every edit writes an `agent_versions` row (FR-204).

| Method | Path | Purpose | Request | Response | Phase |
| --- | --- | --- | --- | --- | --- |
| POST | `/agents` | Create agent from persona fields | `AgentInput` | `Agent` | P2 |
| GET | `/agents` | List registry | — | `Agent[]` | P2 |
| GET | `/agents/templates` | Seeded role templates (Planner/Researcher/Coder/Reviewer/Tester) | — | template descriptors | P2 |
| GET | `/agents/:id` | Single agent | — | `Agent` | P2 |
| PATCH | `/agents/:id` | Edit persona (versions snapshot) | Partial `AgentInput` | `Agent` | P2 |
| DELETE | `/agents/:id` | Remove from registry | — | `204` | P2 |
| POST | `/agents/:id/duplicate` | Clone as new agent | `{ name? }` | `Agent` (new id) | P2 |

Version history list/restore and YAML/JSON import/export land later: see §10.

## 5. Sessions — P2

| Method | Path | Purpose | Request | Response | Phase |
| --- | --- | --- | --- | --- | --- |
| POST | `/sessions` | Create session for a project brief | `{ projectId, taskSummary, orchestratorModel? }` | `Session` | P2 |
| GET | `/sessions` | List sessions | `?projectId=&status=` | `Session[]` | P2 |
| GET | `/sessions/:id` | Full session incl. status/run state | — | `Session` | P2 |
| DELETE | `/sessions/:id` | End + archive session | — | `204` | P2 |

Ended sessions are read-only thereafter (FR-802): message append and run starts return `conflict`.

## 6. Messages — P2

Transcript rows use `MessageRole = user | ai | thought | actions | diff` (`Message` in `@acute/shared`).

| Method | Path | Purpose | Request | Response | Phase |
| --- | --- | --- | --- | --- | --- |
| POST | `/sessions/:id/messages` | Append a message (user turn / injected note) | `MessageInput` | `Message` | P2 |
| GET | `/sessions/:id/messages` | Paginated history by monotonic `seq` cursor | `?after=<seq>&limit=` | `{ items: Message[], nextAfter: number \| null }` | P2 |

Cursor semantics: `after` is the last `seq` applied client-side; results are strictly ascending; omit `after` for page 1. Assistant streaming never arrives here — it rides the WS hub (§11).

## 7. Approvals — P2

The approval engine is the only safety layer (ARCHITECTURE.md §10); `approvals` is an append-only audit table (FR-606).

| Method | Path | Purpose | Request | Response | Phase |
| --- | --- | --- | --- | --- | --- |
| GET | `/approvals/pending` | Open gates awaiting decision | — | `ApprovalRequest[]` | P2 |
| POST | `/approvals/:id/respond` | Decide a gate; resumes/skips the checkpointed call | `{ decision: 'approved'\|'rejected', rememberScope?: 'project' }` | updated approval record | P2 |
| GET | `/approvals` | Query audit log | `?from=&to=&agentId=` | `ApprovalRequest[]` (decided entries) | P2 |

Rules encoded server-side: `rememberScope` is accepted but **ignored for destructive categories** (shell commands, out-of-workspace writes, destructive git, non-LLM network calls) — FR-603. Denylist matches were already refused upstream and never appear as pending approvals.

## 8. Providers & keys — P2 (minimal)

Native adapters (anthropic/openai/google/openrouter) plus CUSTOM OpenAI-compatible providers (FR-405). Raw keys **never** enter responses, logs, WS frames, or SQLite: key material is written once to Windows Credential Manager via `agent-core/storage/secrets.ts`; every response carries only alias + masked hint.

| Method | Path | Purpose | Request | Response | Phase |
| --- | --- | --- | --- | --- | --- |
| GET | `/providers` | Configured providers, presets, key aliases | — | `ProviderConfig[]` with masked hints, e.g. `sk-or-****52502` | P2 |
| PUT | `/providers/custom` | Add/upsert CUSTOM provider | `{ name, baseUrl }` (+ optional key payload handled below) | `CustomProviderDescriptor` | P2 |
| DELETE | `/providers/custom/:name` | Remove custom provider config | — | `204` | P2 |
| POST | `/providers/fetch-models` | Live model-list probe for any base URL | `{ baseUrl, apiKey }` | model id list | P2 |
| PUT | `/providers/:providerId/keys` | Store a named key alias | `{ alias, apiKey }` | `{ alias, hint }` masked | P2 |
| DELETE | `/providers/:providerId/keys/:alias` | Drop alias from Credential Manager | — | `204` | P3+ |

`fetch-models` uses `apiKey` transiently for that single upstream call — not persisted anywhere. Key storage responses return hints like `sk-or-****52502` (last 4 chars only), FR-1201/1203.

## 9. Settings — P2 (minimal)

Key/value store behind `settings` (FR-1106 sections grow over time).

| Method | Path | Purpose | Request | Response | Phase |
| --- | --- | --- | --- | --- | --- |
| GET | `/settings` | Current settings document | — | settings map | P2 |
| PATCH | `/settings` | Partial update: theme/accent, tool denylist, defaults (orchestrator model, memory caps) | partial settings map | merged settings map | P2 |

Execution/denylist matrix, vision model selection, per-model price rates, remembered-grant revocation expand this group in P4/P5.

## 10. Tasks board, runs, skills, memory, usage — P3+

| Method | Path | Purpose | Request | Response | Phase |
| --- | --- | --- | --- | --- | --- |
| GET | `/sessions/:id/tasks` | Kanban columns for a session | — | `Task[]` (FR-308) | P3+ |
| PATCH | `/tasks/:id` | Move/edit board card, assignment | partial `Task` | `Task` | P3+ |
| POST | `/sessions/:id/runs/start` | Kick off orchestration for the session brief | `{ mode?: 'auto' \| 'manual' }` | `{ runId, runState }` | P3+ |
| POST | `/runs/:runId/cancel` | User abort → termination algebra | — | `{ runState }` | P3+ |
| GET | `/skills` · PUT | Skill index / assign to agents | `SkillMeta` | `SkillMeta[]` (FR-90x) | P3+ |
| GET | `/memory/:agentId` · PUT | Read/edit bounded markdown memory + index | body text/meta | `MemoryNote[]` (FR-80x) | P3+ |
| GET | `/usage` | Usage queries over `usage_records` | `?groupBy=agent\|project\|provider\|model\|day&range=&sessionId=` | aggregates (FR-705) | P3+ |
| GET | `/agents/:id/versions` · POST restore, import/export YAML+JSON | Agent history management (FR-205) | — | version lists / `Agent` | P3+ |

Runs are also surfaced live via `run.state.changed` on the WS hub; starting/canceling a run returns immediately — progress is push-driven (NFR-004).

## 11. WebSocket — `/ws`

Single connection for all pushes; envelope type `WsEnvelope<TPayload>` from `@acute/shared/src/events.ts`:

```json
{ "type": "agent.message.delta", "sessionId": "s_...", "seq": 42, "payload": { } }
```

- **Ordering:** `seq` is strictly monotonically increasing **per sessionId**. Clients apply events in seq order; gaps mean missed frames, not reordering.
- **Resume:** on (re)connect the client sends one control frame:

  ```json
  { "type": "resume", "after": <lastAppliedSeq> }
  ```

  The hub replays buffered events after that cursor (in-memory ring buffer), falling back to transcript replay from SQLite after a sidecar restart. Per-session streams get durable replay; global telemetry events tolerate lossy delivery.
- **No token configured:** same rule as HTTP — the `x-acute-token` gate applies to the handshake when configured.

Event vocabulary (`payload` shapes from `events.ts`):

| `type` | Payload shape | Emitted when | Phase |
| --- | --- | --- | --- |
| `agent.message.delta` | `AgentMessageDeltaPayload` — `{ messageId, text }` chunk | each streamed delta | P2 |
| `agent.message.complete` | `AgentMessageCompletePayload` — finalized message ref | message persisted | P2 |
| `task.updated` | `TaskUpdatedPayload` — taskId/status/checks | Kanban transition | P3+ |
| `approval.requested` | `ApprovalRequestedPayload` = full `ApprovalRequest` | gate reached (FR-602 modal) | P2* |
| `run.state.changed` | `RunStateChangedPayload` — `{ runState }` | running/waiting_approval/done/failed | P3+ |
| `usage.recorded` | `UsageRecordedPayload` = `UsageRecord` | each LLM request completes (FR-706) | P3+ |

\* `approval.requested` fires as soon as gated tools execute; with the P2 single-agent chat surface it appears once approvals wire into real tool calls.

Control frames (`resume`) are client→server only and carry no `seq`.

## 12. Security notes for implementers

- Loopback bind + token gate are enforced in `server.ts` before any route runs; failures log without echoing presented tokens.
- The redaction filter strips key-shaped strings at every serialization boundary (HTTP, WS, logs) — FR-1202.
- No endpoint ever accepts a stored-key readback; only masked hints leave the sidecar.
