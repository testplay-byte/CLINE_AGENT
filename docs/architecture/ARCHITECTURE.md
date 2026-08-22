# ACUTE-CODE — Architecture

| Field | Value |
| --- | --- |
| Product | ACUTE-CODE — local-first multi-agent engineering workbench |
| Version | v1.0 (Phase 1) |
| Status | Draft — pending owner review |
| Inputs | `docs/specs/SPEC.md` (locked stack, §6), research cross-cutting findings (`docs/research/README.md`), UI reference brief (`_references/ui/UI-BRIEF.md`) |
| Endpoint contracts | `docs/architecture/api/overview.md` |

## 1. System shape

Three cooperating processes on one Windows machine:

1. **Tauri 2 shell** (`src-tauri/`, Rust) — owns the window and process lifecycle; spawns and kills the sidecar. Never touches SQLite, API keys, or LLM traffic.
2. **React frontend** (`src/`) — the entire product UI; talks **only** to the sidecar over localhost HTTP/WebSocket.
3. **agent-core sidecar** (`agent-core/`, Node + TypeScript) — sole owner of SQLite (WAL), all LLM calls, tools, approvals, orchestration, and secret access.

`shared/` is a TypeScript types package consumed by both TS processes; clients import contract types only — declare-once API, generated/typed clients (opencode finding #1).

## 2. Tech pins (locked)

| Layer | Pin |
| --- | --- |
| Desktop shell | Tauri 2 |
| Frontend | Vite + React 18 + TypeScript · Tailwind CSS v3 + shadcn/ui patterns · Zustand (UI state) · TanStack Query (server state) |
| Sidecar server | Fastify + @fastify/websocket |
| Database | better-sqlite3 + Drizzle ORM, SQLite in WAL mode |
| LLM client | Vercel AI SDK: `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai-compatible` |
| Test / lint | vitest · ESLint 9 flat config |
| Workspaces | pnpm `["shared", "agent-core"]`; the frontend package lives at repo root and consumes `shared` via `"workspace:*"` |

Changes require an owner-approved ADR (SPEC §6).

### 2.1 Theming pins (from UI-BRIEF)

- Fonts self-hosted woff2: **Space Grotesk** (all UI text), **Geist Mono** (paths, model names, code, badges). [ASSUMPTION: bundled locally to keep local-first, no CDN fetch]
- Accent themes runtime-switchable via `[data-accent]`: **Nova `#FF6B2C`** (default), Bento `#6366F1`, Midnight `#D6FF57`, Sunset `#FF7A3D`, Mono `#111111`; light/dark first-class via `.dark` class.
- Base radius 10px (`--radius: 0.625rem`). Tokens defined once as CSS variables (the UI-BRIEF §4 set: background/card/muted/border/accent/accent-2/success/destructive) and mapped into Tailwind v3 config with `<alpha-value>` so utilities like `bg-card`, `text-muted-foreground` replace the reference bundles' inline `style={{}}` tokens.

## 3. Module map

```
ACUTE-CODE/
+-- src-tauri/                 Rust shell
|   +-- src/main.rs            window, sidecar spawn/kill via Job Object, single instance
+-- package.json               frontend workspace package (repo root): React 18 app
+-- src/
|   +-- components/
|   |   +-- ui/                shadcn/ui primitives adapted to Tailwind v3 tokens
|   |   +-- dashboard/         stat cards, SVG token bar chart, quick actions, activity list
|   |   +-- workspace/         explorer file tree, editor pane, todo panel, kanban board
|   |   +-- chat/              AgentChatPanel, message bubbles, diff cards, composer
|   |   +-- registry/          provider/model/tuning editors
|   |   +-- usage/             usage charts, session drilldown cards
|   |   +-- settings/          appearance, providers/keys, execution+denylist, memory, audit
|   +-- views/                 exactly six top-level screens (FR-1107)
|   +-- stores/                Zustand: uiStore (themeId/isDark/layout), workspaceStore, chatStore
|   +-- lib/                   typed api client (fetch + WS over shared/ types), query hooks, theme utils
+-- agent-core/                Node sidecar (pnpm workspace package)
|   +-- server.ts              Fastify app: REST routes + WS hub + /health
|   +-- providers/             AI SDK adapters, presets, vision router, telemetry sink
|   +-- agents/                agent runtime: persona assembly (prompt+skills+memory), turn loop
|   +-- orchestration/         orchestrator, team assembly, message bus, scheduler,
|   |                          checkpoints, termination conditions
|   +-- tools/                 file / shell / web-search / code-execution / MCP tools; BaseWorkspace seam
|   +-- approvals.ts           approval engine: permission levels, denylist, interrupt gates, audit writes
|   +-- storage/               Drizzle schema + migrations (WAL); repositories;
|                              secrets.ts — Windows Credential Manager bridge
+-- shared/                    DTOs, WS envelope + event types, API param/response types
```

## 4. Process model

Boot sequence:

1. Tauri shell picks a free port on `127.0.0.1`, generates a random launch token, spawns `node agent-core/dist/server.js` with env `ACUTE_PORT` + `ACUTE_TOKEN`.
2. Sidecar binds `127.0.0.1:ACUTE_PORT` only, runs pending Drizzle migrations, signals readiness (`ACUTE_READY` on stdout + `GET /health`).
3. Shell performs the health handshake; UI requests carry the same token. [ASSUMPTION: port-token hardening beyond SPEC text]
4. Webview boots in parallel; first data fetch waits on health. Boot-splash health polling is finite and exempt in spirit from NFR-004 (steady-state is fully push-driven).

Exit and crash:

- Shell terminates the sidecar on normal exit; the child is placed in a Windows **Job Object** with kill-on-close so it dies even if the shell crashes. No orphans, no residents beyond the two processes (NFR-005).

Ownership boundaries:

- The UI never queries the database nor reads the project filesystem except via sidecar APIs.
- SQLite is opened exclusively by the sidecar; WAL concurrency exists only inside that process.
- All LLM egress flows through the sidecar, so telemetry rows are complete by construction (FR-706).

## 5. Data flow

```
+--------------------------------------------------------------------------+
|                       Tauri 2 shell (Rust, src-tauri/)                   |
|    window + lifecycle; spawns sidecar with ACUTE_PORT + ACUTE_TOKEN;     |
|    Job Object kill-on-close; itself: no DB, no keys, no LLM traffic      |
+------------------------------+-------------------------------------------+
                               | spawn / monitor
                               v
+------------------------------+--+    +------------------------------------+
|  WebView: React frontend          |  agent-core sidecar (Node/Fastify) |
|  (src/, repo-root package)        |  binds 127.0.0.1:<free port>       |
|                                   |  token-gated, localhost only       |
|  REST request/response ----------|---> REST routes (api/overview.md)  |
|  WS event stream   <-------------|----+ WS hub {type,sessionId,seq,   |
|                                   |         payload}                   |
|  Zustand stores (UI state)        |                                    |
|  TanStack Query (server state)    |  Orchestrator (cheap model)        |
+-----------------------------------+    | plan/dispatch/route context   |
                                        v                               |
                                    Workers x<=5 (cap + FIFO queue)     |
                                        | bus messages (typed cause_by) |
                                        v                               |
                                    provider adapters (Vercel AI SDK) --+---> cloud LLM APIs
                                        | one usage_record per request  |
                                        v                               |
                                    tools ---> approval engine gates    |
                                        |                               |
                                        v                               |
                                    SQLite WAL (sole owner of the DB)   |
                                    Windows Credential Manager (keys)   |
                                    +------------------------------------+
```

## 6. API contract summary

Full contracts: **`docs/architecture/api/overview.md`** (authoritative; this table is an index).

| Area | Indicative endpoints | Notes |
| --- | --- | --- |
| Health / meta | `GET /health`, `GET /version` | boot handshake, schema/app version |
| Projects | `CRUD /projects` | folder binding, active project (FR-101) |
| Agents | `CRUD /agents`, duplicate, versions list/restore, import/export YAML+JSON | registry (FR-201..205) |
| Sessions | `POST/GET /sessions`, `GET /sessions/:id` | history read-only after end (FR-802) |
| Messages | `POST /sessions/:id/messages` (send), history GET | streamed back over WS (section 7) |
| Tasks board | `GET /sessions/:id/tasks`, `PATCH /tasks/:id` | columns Queued/In Progress/Review/Done (FR-308) |
| Approvals | `POST /approvals`, `POST /approvals/:id/respond`, `GET /approvals` | gates + audit-log source (FR-60x) |
| Usage | `GET /usage?groupBy=agent|project|provider|model|day&range=` | reads usage_records (FR-705) |
| Providers / settings | `/providers` CRUD, key add/select/reveal-hint, `/settings` | responses return masked hints only; raw keys never leave the sidecar (FR-1203) |
| Skills | `GET/PUT /skills`, assignment per agent | SKILL.md folders on disk (FR-901..903) |
| Memory | `GET/PUT /memory/:agentId` | markdown files + SQLite index (FR-803..805) |

## 7. WebSocket event stream

Single envelope for every push:

```json
{ "type": "agent.message.delta", "sessionId": "s_...", "seq": 42, "payload": { } }
```

Event vocabulary:

| type | payload core | emitted when |
| --- | --- | --- |
| `agent.message.delta` | messageId, agentId, chunk | streaming token / tool-call deltas |
| `agent.message.complete` | messageId, finalized content reference | message persisted |
| `task.updated` | taskId, status, acceptance checks | Kanban transitions, live (FR-308) |
| `approval.requested` | full approval object | approval gate reached (FR-602 modal) |
| `run.state.changed` | sessionId, runState | running / waiting_approval / done / failed |
| `usage.recorded` | record id + aggregate hints | each LLM request completes (FR-706) |

Seq cursor resume semantics:

- `seq` is strictly monotonic per `sessionId`; the client persists its last applied cursor.
- On reconnect the client sends a resume frame with its cursor; the hub replays buffered events after that cursor from an in-memory ring buffer, falling back to transcript replay from SQLite after a sidecar restart.
- Durable cursor-replay applies to per-session streams; global telemetry (usage) tolerates lossy delivery (opencode finding #1).

## 8. Storage schema outline (Drizzle, SQLite WAL)

| Table | Purpose / notable columns |
| --- | --- |
| `projects` | id, name, rootPath, accentColor, createdAt |
| `agents` | exact FR-203 fields (name, role, systemPrompt, provider, model, allowedTools, memoryPolicy, maxTurns, temperature); companion `agent_versions` keeps every edit inspectable/restorable (FR-204) [ASSUMPTION: companion table] |
| `sessions` | id, projectId, taskSummary, status, orchestratorModel, startedAt, endedAt |
| `messages` | sessionId, agentId, role (user/ai/thought/actions/diff), content, seq, causeBy, ts — full per-agent transcripts (FR-801) |
| `tasks` | sessionId, title, description, acceptanceChecks JSON, status, assignedAgentId |
| `approvals` | append-only audit: ts, sessionId, agentId, action, target, riskNote, decision, rememberedGrant (FR-606) |
| `usage_records` | one row per provider request: tokensIn/tokensOut, costEstimate, latencyMs, provider, model, keyAlias, agentId, sessionId, day (FR-706) |
| `memories` | disk-markdown index: agentId, filePath, charCount, tags, updatedAt |
| `skills` | SKILL.md folder index: name, path, description, assignedAgentIds |
| `settings` | key/value JSON: theme, tool-permission matrix, denylist, vision model, per-model price rates, remembered grants |
| `schema_migrations` | applied-migration ledger |
| `run_checkpoints` | LangGraph-pattern monotonic snapshots keyed by `(sessionId, threadId=taskId)`: seq, state hash, serialized state, createdAt |
| `pending_writes` | staged writes tied to the latest checkpoint: writeId, checkpointSeq, payload, appliedAt |

Checkpoint protocol (bespoke adoption of the LangGraph two-table model — LangGraph itself is **not** a dependency, research finding #4):

- Each step boundary snapshots agent/run state into `run_checkpoints` (monotonic seq per thread); side effects stage in `pending_writes` before application.
- Resume = load latest snapshot, idempotently re-apply unapplied `pending_writes` by `writeId`, continue. Approval interrupts (sections 9–10) ride the same machinery.

## 9. Orchestration design

Two tiers:

- **Orchestrator** — cheap/fast model; decomposes the brief into tasks (title, description, acceptance checks), dispatches workers, routes context (relevant paths, prior results). Never edits project files (FR-301..303).
- **Workers** — powerful models; execute board tasks under their persona, tool allowlist, and turn budget.

Auto team assembly (default; manual override FR-305):

```
task text -> match against registry roles/templates (Planner/Researcher/Coder/Reviewer/Tester seeded)
          -> pick orchestrator model + worker set (tool needs covered, duplicates pruned)
          -> create board tasks -> scheduler starts workers within 5 slots
```

Message bus (MetaGPT pattern):

- Every inter-agent message carries `causeBy` (role/task type that produced it).
- Agents declare watch lists in declarative role profiles (prompt + allowedTools + watch list as data); the bus delivers matching messages to per-agent inboxes with dedupe.
- The bus mirrors everything into `messages` + WS, so all collaboration is live-visible (FR-307).

Scheduler: hard cap of **5 concurrently running agents** per session; extras queue FIFO and start as slots free (FR-306).

Termination-condition algebra (AutoGen pattern) — composable predicates joined with AND/OR/NOT, externally triggerable (user abort, denial-with-abort):

```
terminate = allTasksDone OR turnsExceeded(maxTurns) OR stall(noProgress, N rounds)
            OR userAbort OR budgetCapReached
```

`maxTurns` per agent comes from the FR-203 schema; stall detection reuses the progress-ledger idea reviewed cheaply by the Orchestrator.

Interrupt/resume approval gates — never block a run loop on a human (AutoGen terminate-and-resume semantics):

1. Worker hits a gated tool call -> persist checkpoint containing the pending call -> emit `approval.requested` -> run loop exits cleanly (runState `waiting_approval`).
2. Decision arrives via `POST /approvals/:id/respond` -> resume from checkpoint, apply or skip the call.
3. Denial may feed the termination algebra (abort task or session).

Resume-after-crash is best effort (FR-310): completed tasks and transcripts survive; interrupted tasks restore their last checkpoint, or restart the task if none exists.

## 10. Approval engine (the ONLY safety layer)

```
tool call requested
   |
   v
resolve permission level (auto / confirm / blocked; settings matrix, FR-506)
   |
   v
denylist check --match--> REFUSE unconditionally
   |                     (denylist wins over agents, permission levels,
   no                     and remembered grants alike, FR-605)
   v
level == auto? --yes--> execute; log decision(auto) to approvals
   |
   no
   v
persist checkpoint + emit approval.requested
(modal shows action, full path/command, requesting agent, risk note — FR-602)
   |
   v
decision: approve | deny    (+ "remember per project" offered ONLY for
   |                         non-destructive categories, FR-604)
   v
respond endpoint resumes/skips the call; decision appended to approvals (FR-606)
```

Hard rules: destructive categories (every shell command, out-of-workspace writes, destructive git, non-LLM network calls) **never** offer an always-allow option (FR-603); no code path may bypass, weaken, or auto-confirm a gate (AGENTS.md rule 9). Docker sandbox remains a disabled labeled placeholder (FR-607).

## 11. Provider layer

- Native adapters: Anthropic, OpenAI, Google Gemini via AI SDK packages; OpenRouter supported natively (FR-401..404).
- CUSTOM provider type: name + base URL + API key for any OpenAI-compatible endpoint; model list fetched live (FR-405). Presets prefill base URLs for OpenRouter, Groq, NVIDIA NIM (FR-406).
- Multiple named key aliases per provider, selectable per use (FR-407); aliases map to Credential Manager entries.
- Per-request telemetry middleware wraps every generation/stream and writes one `usage_records` row on completion; cost estimated from user-editable per-model rates (FR-702/706).
- Vision-model routing hook (ADR-0006): if the receiving conversation model is not vision-capable while images are attached, the image routes to the user-configured vision model and its textual result returns to the requesting agent (FR-1002/1003).
- Live verification priority per ADR-0003: OpenAI-compatible endpoints and OpenRouter first; native adapters mocked until real keys exist (FR-410).

## 12. Memory pipeline (Hermes pattern)

- Per-agent bounded, char-capped markdown stores on disk (`MEMORY.md`-style) plus a global user-notes store; the `memories` table indexes paths, sizes, updatedAt, tags (FR-803).
- Frozen-snapshot injection: at session start each agent's memory renders once into its system prompt according to `memoryPolicy` (what to recall, when) — stable prefix keeps prompts cache-friendly (research finding #7).
- Write triggers are nudge-based: end-of-task summary nudges, explicit user instruction, threshold nudges; agent-proposed notes append under size caps.
- User-editable in-app (editor writes file + refreshes index) and directly on disk (index rescanned at session start — no filesystem watchers, preserving the no-polling posture).

## 13. Skills (ADR-0005 minimal scope)

- Format: `<skill>/SKILL.md` folders (open skills-folder spec adopted per Kilo Code finding #8): name, description, markdown body.
- Assigned per agent; injected into system context at persona assembly, after the system prompt and alongside the memory snapshot (FR-902).
- No marketplace, no agent-created skills in v1 (FR-903). Edits are picked up at next session start.

## 14. Security boundaries

- **Keys:** stored only in Windows Credential Manager (DPAPI-backed), accessed solely by `agent-core/storage/secrets.ts`. The Rust shell and UI never see raw keys; provider endpoints return alias + masked hint (last 4) only (FR-1201/1203). A redaction filter strips key-shaped strings at every log/WS serialization boundary (FR-1202). [ASSUMPTION: Credential access implemented via a small native helper or PowerShell bridge — fixed during Phase 1 build]
- **Denylist:** evaluated before any other check; wins over permission levels, remembered grants, and agent requests (FR-605).
- **Audit:** `approvals` is append-only; the Settings audit view is read-only over it (FR-606).
- **Network:** sidecar binds `127.0.0.1` only and requires the launch token; egress limited to configured LLM providers and user-triggered web searches (NFR-006); zero telemetry or crash reporting (NFR-007).
- **BaseWorkspace seam (OpenHands finding #10):** all tool filesystem/process effects resolve through a `BaseWorkspace` interface (`HostWorkspace` today). A future `DockerWorkspace` slots in later without touching tools or orchestration; Docker appears only as a disabled placeholder in v1 (FR-607).

## 15. Performance budget mapping

| Budget (SPEC §5) | Design drivers |
| --- | --- |
| Idle RAM < 700 MB (NFR-001) | Two processes total; lazy-loaded views; bounded Query caches; no agent contexts allocated until a session starts |
| 5 agents < 2.5 GB (NFR-002) | Cap-5 scheduler bounds concurrent context windows; streaming deltas consumed incrementally (no whole-response buffering); bounded checkpoint snapshots; modest WAL overhead |
| Cold start < 5 s (NFR-003) | Sidecar spawns in parallel with webview boot; incremental migrations; better-sqlite3 synchronous fast startup; handshake does not block render |
| Warm start < 2 s (NFR-003) | Compiled sidecar reused; warm OS caches; no repeated migration work |
| No polling (NFR-004) | Single WS hub pushes every update; only the finite boot-splash health check polls |
| Single resident sidecar (NFR-005) | One Fastify process; no watchers, daemons, or helper services |

## 16. UI architecture (exactly six views, FR-1107)

The reference bundles (Next.js / React 19 / Tailwind v4) are studied for layout and design tokens only; ACUTE-CODE re-implements on Vite + React 18 + Tailwind v3. Code is never copied wholesale — token values, layout geometry, and interaction patterns are.

| View | Reference pattern (UI-BRIEF §3) | Implementation home |
| --- | --- | --- |
| Dashboard | dashboard bundle: top bar (centered session search, accent picker + dark/light), Projects sidebar card (260–280px, colored letter avatars, mono paths), time-of-day greeting, 4-stat grid, weekly token bar chart + Quick Actions, Recent Activity list | `views/DashboardView` + `components/dashboard/` |
| Workspace | project-chat ProjectChatView: 48px top bar (hamburger -> model menu + theme grid, logo, Code/Experimental toggles), collapsible left sidebar (Explorer tree + To-Do progress ring), center CodeView (tabs, line numbers, syntax highlight), right AgentChatPanel 400px default / 320–800 resizable | `views/WorkspaceView` + `components/workspace/` |
| Session | AgentChatPanel: message types user / ai / thought / actions / diff (applied vs pending states), thinking indicator, suggestion banner, composer (attachments, focus hotkey, shift+enter newline); Kanban board live via `task.updated`; approval modals surface here (FR-1104) | `views/SessionView` + `components/chat/` + kanban |
| Registry | acute-agent-ui PlugBrain primitives: provider tiles (incl. CUSTOM), connection card (key input, model select), context-window AUTO/MANUAL snap points 1K–1M with page estimate, temperature slider, reasoning-level selector; model list with checkmark selection | `views/RegistryView` + `components/registry/` |
| Usage | dashboard stat cards + weekly token bars with per-project stacked tooltip + session cards with hover drilldown (tokens, API calls) + cross-project search | `views/UsageView` + `components/usage/` |
| Settings | assembled fresh from PickFlavor (mode toggle + theme cards + palette strips + live mini-preview) and tuning-card language; sections: Appearance, Providers & Keys, Execution & Denylist, Memory, Audit Log, disabled Docker placeholder (FR-1106) | `views/SettingsView` + `components/settings/` |

State architecture:

- **Zustand** owns runtime UI state: `themeId`, `isDark` (class + `data-accent` applied on `<html>`), sidebar collapse, active view.
- **TanStack Query** owns all server state (projects, sessions, tasks, usage, registry) via the shared-typed client; WS events patch or invalidate query caches — no manual refresh loops anywhere.
- Theme persistence flows through `settings` (survives restarts); theme switches are pure CSS-variable swaps, no remount.

Theming implementation: UI-BRIEF §4 variable set in `:root` / `.dark` with `[data-accent="bento|midnight|sunset|mono"]` overrides; Tailwind v3 maps semantic colors to those variables; bento/soft shadows, custom scrollbar, grain overlay, and the keyframe set ported as plain CSS utilities. The experimental freeform window layout ships behind a power-user toggle. [ASSUMPTION: kept, flagged experimental]

First-run onboarding (welcome -> flavor -> brain) is not a seventh screen; its entry points fold into Dashboard empty-states and Settings for v1. [ASSUMPTION: confirm with owner]

## 17. Traceability snapshot

Module map §3 <-> FR areas; process model §4 <-> NFR-005; WS §7 <-> NFR-004; schema §8 <-> FR-204/310/606/706; orchestration §9 <-> FR-301..310; approvals §10 <-> FR-601..607; providers §11 <-> FR-401..411 + FR-10xx; memory §12 <-> FR-803..805; skills §13 <-> FR-901..903; security §14 <-> FR-1201..1203 + NFR-006/007; performance §15 <-> NFR-001..005; UI §16 <-> FR-1101..1108. Endpoint details: `docs/architecture/api/overview.md`.
