# OpenHands - Reference Analysis

**Metadata:** Date 2026-08-22. Repo URL: https://github.com/OpenHands/OpenHands (formerly OpenDevin/OpenDevin, then All-Hands-AI/OpenHands; repo created 2024-03-13 per GitHub API, org later renamed to `OpenHands`). Move history: the original monorepo (Python backend + frontend, "V1") had its backend extracted into the sibling repo **OpenHands/software-agent-sdk** ("V2" SDK + agent-server); `OpenHands/OpenHands` is now **frontend-only** ("agent-canvas"). Branch/commit analyzed: `OpenHands/OpenHands` @ `bad1687dec93c5b3edbef837ab2dc12638964031` (main, 2026-08-21); `OpenHands/software-agent-sdk` @ `dc0c8428438dde13efa422fb456adfb542fd532d` (main, 2026-08-21). Verification method: shallow git clones read directly (files cited below); repo ownership/license/dates cross-checked via GitHub REST API (`api.github.com/repos/OpenHands/OpenHands`). All claims below cite files unless marked [UNVERIFIED]. PATTERNS ONLY - no code copied.

> Key structural finding: studying "OpenHands server architecture" today means studying TWO repos. The frontend repo contains zero agent-server code; everything about events, conversations, runtimes, and the REST/WS API lives in `software-agent-sdk`. This split is itself a finding (see Section 5).

## 1. Architecture overview (server pattern, event stream, conversations, runtime)

### Server pattern: standalone FastAPI "agent-server", UI is a pure client
- The agent server (`openhands-agent-server/openhands/agent_server/api.py`, routers in same dir) is a separate OS process speaking REST + WebSocket on localhost. The React UI holds **no agent logic**; it is a client that renders an event stream. Frontend AGENTS.md states the repo "is only the agent-canvas frontend" and that all backend calls must go through a typed generated client (`@openhands/typescript-client`), enforced by a CI test (`src/api/no-direct-agent-server-calls.test.ts`). A reverse-proxy ingress routes `/api/*` to the agent-server and `/*` to static UI (frontend `AGENTS.md`, `scripts/ingress.mjs`).
- Router-per-resource layout: `conversation_router.py`, `event_router.py`, `settings_router.py`, `bash_router.py`, `git_router.py`, `file_router.py`, `skills_router.py`, `mcp_router.py`, `server_details_router.py`, each paired with a service class (`conversation_service.py`, `event_service.py`, ...). Cross-cutting fan-out uses a small generic `PubSub[T]` subscriber registry (`pub_sub.py`) - WS connections, webhooks, and telemetry all subscribe to conversation event callbacks.
- Conversation-level single-writer discipline: `conversation_lease.py` plus documented rule that async routes must never acquire the synchronous state lock on the event loop (agent-server `AGENTS.md`, "Concurrency / async safety").
- Auth: optional shared session API key (`X-Session-API-Key` header; also accepted for WS via header or first message, `sockets.py:_resolve_websocket_session_api_key`). Secrets at rest encrypted with a cipher keyed by `OH_SECRET_KEY`; without it secrets are redacted and lost on restart (agent-server `README.md`).

### Event stream: append-only event sourcing with derived views
- Base event (`openhands-sdk/openhands/sdk/event/base.py`): frozen Pydantic model, discriminated union; fields `id` (UUID), `timestamp`, `source` (`Literal["agent","user","environment","hook"]`, `event/types.py`), and `parent_id` making events a **tree**, not just a list (`ROOT_PARENT_ID = "__root__"` sentinel).
- Core variants: `ActionEvent` (thought + tool_call + tool_name + `security_risk` + `llm_response_id` grouping key), `ObservationEvent`, `MessageEvent`, `AgentErrorEvent`, `ConversationErrorEvent`, `UserRejectObservation`, condenser events, token/streaming-delta events (`event/` package). `LLMConvertibleEvent.to_llm_message()` defines the projection from event log to LLM context; `events_to_messages()` folds parallel tool calls of one LLM response (same `llm_response_id`) back into a single assistant message (`base.py:107-199`).
- Storage: one JSON file per event, `events/event-{idx:05d}-{event_id}.json`, under a conversation dir; index rebuilt by directory scan; file-lock guarded appends; id<->index maps plus an LRU-ish cache (`conversation/event_store.py`, `persistence_const.py`). Snapshot of mutable state in `base_state.json` (`state.py`). Legacy events predating the tree get an implicit linear parent chain so old logs load unbranched (`_effective_parent_id`, `event_store.py:91-104`).
- Resume/replay: because the log is authoritative, resume = reload `base_state.json` + replay events. Agent config itself is persisted inside `ConversationState` to support resume across restarts (`state.py:86-94`).

### Conversations: explicit execution state machine + confirmation gating
- `ConversationExecutionStatus`: IDLE / RUNNING / PAUSED / WAITING_FOR_CONFIRMATION / FINISHED / ERROR / STUCK / DELETING (`conversation/state.py:48-60`). The run loop (`impl/local_conversation.py:1902-2041`) loops `agent.step()` until FINISHED/WAITING_FOR_CONFIRMATION/pause/budget/max-iterations, with stuck-pattern detection and stop-hooks.
- **Approval gates are a first-class protocol**: in confirmation mode the first pass emits `ActionEvent`s *without executing*, sets status to `WAITING_FOR_CONFIRMATION`, and breaks; the client approves/rejects via `POST /{conversation_id}/events/respond-to-confirmation` (rejection yields `UserRejectObservation`). Policy objects `ConfirmationPolicyBase` (default `NeverConfirm`) and `SecurityAnalyzerBase` decide what requires approval; `ActionEvent.security_risk` carries the analyzer's/LLM's risk assessment (`state.py`, `conversation_router.py:429-441`, `action.py:67`).
- Rich conversation lifecycle endpoints: start, pause, interrupt (async cancellation via `CancellationToken`), delete, run, condense (context-window summarization via pluggable `CondenserBase`), fork, navigate (branch selection over the `parent_id` tree), switch_llm/profile, update secrets, set confirmation policy/analyzer (`conversation_router.py:89-699`). History reads are paginated: `GET .../events/search?limit&page_id&sort_order&timestamp_gte&timestamp_lt` returns `{items, next_page_id}` (`event_router.py:65`).

### Transport protocol: REST-first, WS-resume-with-cursor
- Client loads latest N events over REST (sort `TIMESTAMP_DESC`, limit ~50, reversed to chronological), then opens `WS /events/{id}/socket?resend_mode=since&after_timestamp=<last>`; the socket replays only events newer than the cursor, then streams live ones. `resend_mode=all` exists for full replay; legacy `resend_all=true` deprecated (`sockets.py:226-380`; frontend `use-conversation-history.ts` behavior documented in frontend `AGENTS.md`).
- Forward compatibility is explicit: OpenAPI response unions are extensible; clients must ignore unknown event `kind` discriminators (agent-server `README.md` "Event schema compatibility").

### Runtime sandbox abstraction
- The seam is `BaseWorkspace` (`openhands-sdk/openhands/sdk/workspace/base.py`): a discriminated-union ABC holding `working_dir` with context-manager lifecycle and operations like `execute_command`. Implementations: `LocalWorkspace` (in-process subprocess) in the SDK; `DockerWorkspace` / `DockerDevWorkspace` / `ApptainerWorkspace` / cloud / remote-API implementations in the separate `openhands-workspace` package.
- Crucially, `DockerWorkspace extends RemoteWorkspace`: a container running the same agent-server image, addressed over HTTP with the identical workspace interface. So local vs sandboxed execution is the same contract, differing only in transport. Tools (terminal, file_editor, task_tracker, browser...) resolve against whatever workspace the conversation was constructed with; tool availability filtering goes through a registry helper (`list_usable_tools()` with per-tool `is_usable()`, root `AGENTS.md`).
- Skills/"microagents": the old `.openhands/microagents/*.md` concept evolved into the skills system (`sdk/skills/skill.py`, `trigger.py`): markdown with frontmatter, triggers `KeywordTrigger` / `PathTrigger` / `TaskTrigger`, progressive disclosure into an `<available_skills>` prompt suffix; public marketplace content lives in yet another repo (`OpenHands/extensions`), user/project skills served via `skills_router.py`.

## 2. Tech stack

Verified from manifests:
- **Agent side (software-agent-sdk)**: Python 3.12+/3.13 target, uv-managed monorepo (single `uv.lock`, four publishable packages: `openhands-sdk`, `openhands-tools`, `openhands-workspace`, `openhands-agent-server`), FastAPI + Starlette WebSockets, Pydantic v2 (frozen models, discriminated unions, SecretStr), LiteLLM for provider transport, pytest/pyright/ruff/pre-commit, PyInstaller single-binary builds, Docker images per arch. File-based persistence (JSON per event; fcntl/msvcrt locking). Optional PostHog telemetry behind explicit consent.
- **UI side (OpenHands/OpenHands "agent-canvas")**: React 19, TypeScript, Vite, React Router 7, Zustand stores, TanStack Query, i18next (15 locales), HeroUI + Tailwind 4, xterm.js, Monaco, Playwright E2E incl. a mock-LLM full-stack suite, MSW mocks; publishable as an npm embeddable library; Electron desktop packaging (with bundled Node runtime); strict pinned deps.
- Note for ACUTE-CODE relevance: their stack is heavier than ours (Python runtime fetched via `uvx` at first launch - 30-90s cold start documented in their own Electron notes).

## 3. License (exact name + source file)

- **MIT License.**
- Source files: `_references/openhands/LICENSE` ("The MIT License (MIT), Copyright (c) 2025 OpenHands contributors"); `_references/software-agent-sdk/LICENSE` ("MIT License, Copyright (c) 2026 OpenHands contributors"). GitHub API reports `spdx_id: MIT` for both repos.

## 4. Top patterns worth adopting for ACUTE-CODE (what / why / how it maps)

### 4.1 Append-only event stream as the sole source of truth, with named projections
- **What**: Persist every agent/user/tool/system occurrence as an immutable, typed event (uuid, ISO timestamp, source enum, optional parent_id) appended to an ordered log; define projections (event->LLM message folding by response-id; event->UI card) as pure functions over the log. Mutable bits (run status, agent config) live in a tiny snapshot record alongside the log.
- **Why**: Transcripts, crash recovery, resume-after-restart, and audit come free; the UI never invents state; schema evolution stays tractable (they add new event kinds without migrating the log, using discriminator openness + permanent deprecation handlers).
- **Maps to**: our SQLite/Drizzle sessions table becomes `session_events(id, session_id, seq, ts, source, kind, parent_id, payload_json)` append-only; Kanban/task-board mutations and approval decisions become events too. Replay = SELECT ORDER BY seq. Our Vercel AI SDK message list is a projection, not storage.

### 4.2 REST-first history + cursor-resumed WebSocket
- **What**: Serve transcript pages over REST (`?limit&page_id&sort_order=desc&timestamp_gte`) returning `{items, next_page_id}`; open the live channel with `resend_mode='since'&after_timestamp=<latest loaded>` so reconnects never duplicate or gap; treat unknown event kinds as ignorable.
- **Why**: Decouples render speed from transcript size (an 8 GB machine chokes on loading 10k-event transcripts), makes crash recovery trivial (client re-syncs from cursor), and keeps the WS dumb (fan-out only, via pub/sub subscribers).
- **Maps to**: sidecar contracts `GET /api/sessions/:id/events/search` + `WS /api/sessions/:id/events/socket?since=<seq|ts>`; Tauri webview loads last 50 cards, paginates upward on scroll; orchestrator and UI share one event bus inside the Node sidecar.

### 4.3 Approval gates modeled as execution-status + policy objects, not ad-hoc checks
- **What**: A dedicated status (`WAITING_FOR_CONFIRMATION`) that the run loop treats as a hard break; approve/reject delivered as first-class events (`UserRejectObservation`); pluggable `ConfirmationPolicy` decides *what* needs approval and an analyzer stamps `security_risk` onto action events.
- **Why**: Since ACUTE-CODE has approval gates as its ONLY safety layer pre-Docker, they must be structural (loop-breaking, persisted, auditable) rather than scattered if-statements; persisting the pending action in the event log means a crash mid-gate resumes into a still-pending gate.
- **Maps to**: our tool-layer permission levels feed a policy object evaluated before tool execution; pending approvals are events; the two-tier orchestrator (cap 5) pauses the sub-agent conversation, not the whole app.

### 4.4 (bonus) Workspace/runtime interface seam
- **What**: One abstract "runtime/workspace" contract (working dir + execute/file ops + lifecycle) implemented locally now, remotely/sandboxed later; the Docker implementation literally speaks the same API through an HTTP remote variant.
- **Why**: Their design proves you can defer Docker without rework IF the seam exists from day one and tools depend only on the seam.
- **Maps to**: define `AgentRuntime` (exec, readFile/writeFile, dispose) in the sidecar now with a LocalRuntime; DockerRuntime slots in later; tools take a runtime, never `child_process` directly.

## 5. What to avoid and why

1. **Multi-repo sprawl with a generated typed client as the only API path.** Four+ repos (frontend, sdk, typescript-client, extensions) with CI-enforced "no direct calls" rules is right for a large OSS ecosystem but heavy for a closed-source product at our scale; keep sidecar + UI in one repo with shared TS types.
2. **Embedding a second heavyweight language runtime.** They ship Python via `uvx` downloads (30-90 s cold starts, ~50 MB pulls, PyInstaller binaries, bundled uv in Electron) - their own docs treat this as a pain point. Our Node sidecar avoids it; do not introduce Python/uv-style runtime fetching into ACUTE-CODE.
3. **Electron-scale bundling bloat.** Their notes document node_modules ballooning to ~600 MB packaged (~1 GB unpacked) requiring an afterPack surgery hook. Tauri helps, but the lesson stands: keep the sidecar's dependency closure tiny and audited.
4. **File-per-entity JSON persistence with hand-rolled locking.** Directory scans to rebuild indexes, flock caveats on NFS, fcntl-vs-msvcrt Windows branches, reserved-filename validation... SQLite (which we already chose) eliminates this entire class; use WAL mode and be done.
5. **Telemetry/consent machinery as core complexity.** Consent precedence ladders, exporter abstractions, pseudonymization salts - large surface area irrelevant to a local-first product; ship at most a minimal opt-in analytics stub or nothing.
6. **Defaulting servers to broad binds.** Their agent-server defaults to `0.0.0.0` and relies on users to restrict; a local-first Windows product should bind loopback explicitly and require a token even on localhost.
7. **Rewrite-driven schema evolution.** V1->V2 discarded the whole backend and left permanent deprecation handlers for old event shapes. Design event schemas + a versioned migrations story up front instead of planning a future rewrite.
8. [UNVERIFIED] Resource footprint under many concurrent conversations appears nontrivial (per-conversation worktrees, tmux sessions, warm pools); their stress-test suite exists precisely because of this. We could not verify concrete RSS numbers - relevant caution for running 5 concurrent agents on 8 GB.

## 6. Sources consulted

- Clone: https://github.com/OpenHands/OpenHands @ bad1687 (main, shallow): README.md, README.windows.md, LICENSE, AGENTS.md (repo map + API access rules + REST-first history docs), src/types/agent-server/core/base/event.ts, src/api/event-service/*, .openhands/
- Clone: https://github.com/OpenHands/software-agent-sdk @ dc0c842 (main, shallow):
  - README.md, LICENSE, AGENTS.md (repo memory: interrupt/cancellation chain, settings compat, races)
  - openhands-sdk/openhands/sdk/event/base.py, event/types.py, event/llm_convertible/action.py
  - openhands-sdk/openhands/sdk/conversation/state.py, event_store.py, persistence_const.py, impl/local_conversation.py (run loop)
  - openhands-sdk/openhands/sdk/workspace/base.py, workspace/local.py (interface surface)
  - openhands-sdk/openhands/sdk/skills/skill.py, skills/trigger.py
  - openhands-agent-server/openhands/agent_server/: README.md, api.py layout, conversation_router.py, event_router.py, sockets.py, pub_sub.py, conversation_lease.py, persistence/store.py, persistence/models.py
  - openhands-workspace/openhands/workspace/docker/workspace.py (+ package AGENTS.md)
- GitHub REST API: api.github.com/repos/OpenHands/OpenHands (ownership, created_at 2024-03-13, license spdx_id MIT, language TypeScript)
- Not consulted (out of scope): OpenHands/docs repo, typescript-client repo internals, extensions repo, Cloud backend code.

## 7. Open questions

1. How exactly does `conversation_lease.py` arbitrate multi-client writes (e.g., two UIs attached to one conversation)? Relevant to our cap-5 orchestrator sharing sessions between UI and orchestrator. [read briefly, not analyzed]
2. Semantics of `fork_conversation` / `navigate_conversation` against the `parent_id` event tree - would branching help ACUTE-CODE's Kanban "retry task as branch" UX? Needs a focused follow-up read.
3. Sub-agent implementation (`sub_agents_router.py`, `enable_sub_agents`, `task_tool_set`): how parent-child conversations share events/status - directly relevant to our two-tier orchestration cap. Follow-up recommended.
4. Condenser integration points: whether summarization belongs in the sidecar or as an event-stream projection in ACUTE-CODE (their LLMSummarizingCondenser runs as part of the agent step).
5. Concrete memory/CPU budget of their agent-server per conversation (stress-suite budgets exist in-repo but were not benchmarked here) - informs whether 5 concurrent agents fit 8 GB in OUR stack.
[END]
