# ACUTE-CODE - Master Specification

| Field | Value |
| --- | --- |
| Product | ACUTE-CODE - closed-source, local-first multi-agent engineering workbench |
| Version | Draft v0.1 (Phase 0) |
| Status | Pending owner approval |
| Platform | Windows 10/11 x64 desktop |
| Related ADRs | ADR-0003 (live-test provider priority), ADR-0005 (skills scope), ADR-0006 (vision routing / local inference deferral) |

Every requirement carries an ID (`FR-xxx` functional, `NFR-xxx` non-functional). Each ID is independently testable and traceable to a phase gate in section 7. This document defines contracts only; design detail lives in `docs/architecture/` and decisions in `docs/decisions/`. Nothing here authorizes implementation before Phase 0 sign-off.

## 1. Overview

> ACUTE-CODE is a workbench where the user opens a project, describes a task, and an auto-assembled team of AI agents - orchestrated by a cheap **Orchestrator** model and executed by capable worker agents - completes the task under strict human approval gates.

**Local-first (owner-confirmed):** all processing, storage, and orchestration run on-device. LLM inference goes through cloud APIs the user configures. No local model execution ships in v1.

**Status:** Draft v0.1 (Phase 0), pending owner approval.

### Terminology
- **Orchestrator** - cheap/fast planning agent that never edits files directly.
- **Worker** - capable agent executing a task on the Kanban board.
- **Session** - one orchestrated run, end to end.
- **Task** - a board item with description and acceptance checks.
- **Artifact** - file or output a session leaves behind.
- **Memory policy** - per-agent rule for recalling/writing persistent notes.
- **Skill** - user-authored markdown injected into an agent's system context.

## 2. Goals / Non-goals

### Goals
- Describe an engineering task in natural language and receive completed, reviewable work.
- Full transparency: live per-agent transcripts, live Kanban task board, complete session history.
- Safety by default: every risky action passes a modal approval gate; a user denylist overrides everything.
- Cost awareness: token and estimated-cost accounting per agent, project, provider, model, and day.
- User ownership: agent templates, skills, and memory are user-editable files backed by a local database.
- Provider freedom: native providers plus any OpenAI-compatible endpoint.

### Non-goals (v1)
Revisiting any non-goal requires an owner-approved ADR.
- Docker sandboxing (disabled, labeled placeholder in Settings only).
- Local model execution (Ollama and similar).
- Cloud sync of any kind.
- Mobile platforms.
- Multi-user teams or real-time collaboration.
- Plugin marketplace.
- Telemetry and crash reporting.

## 3. Users & Core Loop

**Primary user:** solo developer/engineer on Windows 10/11 x64 with 8 GB RAM, supplying their own provider API keys.

**Environment assumption:** consumer Windows install, no admin rights required for normal operation beyond standard installs. [ASSUMPTION]

**Core loop:**
1. Create or open a project.
2. Describe the task in the composer (optionally attach an image).
3. Orchestrator plans the work and auto-assembles a team (manual override available).
4. Worker agents collaborate over a shared message bus; progress renders live on a Kanban task board.
5. Risky actions raise modal approval prompts.
6. User watches live per-agent transcripts while agents work.
7. Session ends: per-agent transcripts and artifacts are preserved.
8. Token/cost usage is recorded to the usage dashboard.

## 4. Functional Requirements

Default tool-permission matrix shipped in Settings (user-adjustable per FR-506):

| Tool | Default level | Rationale |
| --- | --- | --- |
| File read (in workspace) | auto | no risk |
| File write/edit (in workspace) | auto | reversible via git/history |
| File write outside workspace | confirm via FR-601(b) | escapes sandbox |
| Shell command | confirm via FR-601(a) | arbitrary execution |
| Web search | confirm via FR-601(d) | network egress |
| Code execution | confirm | arbitrary execution |
| MCP server tools | confirm | third-party behavior |

### FR-1xx - Project Workspace Manager
Agents operate on exactly one active project at a time; everything below scopes to it.
- **FR-101** The user can create a project bound to a filesystem folder, and open/recent-project selection works from the Dashboard.
- **FR-102** The project workspace shows a navigable file-tree browser of the active project folder.
- **FR-103** Project files open in an integrated editor pane for viewing and editing.
- **FR-104** Git status, diff view, and commit are available in-app and execute through the shell tool under approval rules (FR-601).
- **FR-105** During a session, all agents are constrained to the currently active project.
- **FR-106** Agent file-tool access is workspace-scoped by default; any access outside the active workspace triggers approval (FR-601).

### FR-2xx - Agent Registry
The registry is the single source of truth for who can be assembled into a team.
- **FR-201** Full CRUD on agent definitions via the Agent Registry screen.
- **FR-202** Duplicate any existing agent as the starting point for a new one.
- **FR-203** Agent schema is exactly `{ id, name, role, systemPrompt, provider, model, allowedTools, memoryPolicy, maxTurns, temperature }`; the editor validates types and ranges (temperature 0-2, maxTurns >= 1).
- **FR-204** Definitions are stored versioned in SQLite and import/export as editable YAML or JSON; each edit creates a new version and prior versions remain inspectable/restorable.
- **FR-205** Out-of-box templates exist for Planner, Researcher, Coder, Reviewer, Tester; they are seeded data that users can edit or delete - not hard-coded behavior.

### FR-3xx - Orchestration
Two-tier design: a cheap/fast Orchestrator plans and coordinates; capable worker models execute. The Orchestrator never edits project files directly.
- **FR-301** The Orchestrator agent runs on a cheap/fast model distinct from worker models.
- **FR-302** The Orchestrator decomposes the task description into tasks with title, description, and acceptance checks placed on the Kanban board.
- **FR-303** The Orchestrator dispatches workers and routes context: relevant paths, file locations, and prior task results.
- **FR-304** AUTO team assembly is the default mode: team composition derives from the task description matched against registry roles.
- **FR-305** Manual override: the user can hand-pick the team and Orchestrator model before launching a session.
- **FR-306** Hard cap of 5 concurrently running agents per session; additional agents queue and start as slots free.
- **FR-307** Agents communicate over a shared message bus; all inter-agent messages are visible live in the Session view.
- **FR-308** The Kanban board reflects live task state (Queued / In Progress / Review / Done) without manual refresh.
- **FR-309** A session is exactly one orchestrated run and persists a full transcript per participating agent plus its artifacts.
- **FR-310** Resume-after-crash is best-effort: completed tasks and transcripts survive; interrupted tasks restart from their last recorded state.

### FR-4xx - Providers & Model Routing
Provider adapters are the only components that hold network credentials at runtime.
- **FR-401** Native Anthropic provider support (API-key auth).
- **FR-402** Native OpenAI provider support (API-key auth).
- **FR-403** Native Google Gemini support, including vision-capable models.
- **FR-404** Native OpenRouter support.
- **FR-405** CUSTOM provider type: name + base URL + API key for any OpenAI-compatible endpoint; the app fetches and lists its available models.
- **FR-406** Built-in presets prefill base URL for OpenRouter, Groq, and NVIDIA NIM.
- **FR-407** Multiple named API keys per provider are supported and selectable per use.
- **FR-408** Per-agent model routing: each agent can target a different provider/model combination.
- **FR-409** Default mode: a single global model applies to all agents unless overridden per agent.
- **FR-410** Live verification priority is OpenAI-compatible endpoints and OpenRouter per ADR-0003; native-provider live tests defer until keys exist and are mocked meanwhile.
- **FR-411** Local model execution is out of scope for v1 (deferred).

### FR-5xx - Tool Layer
Every tool carries a permission level (FR-506); risky invocations additionally pass the approval engine (section FR-6xx).
- **FR-501** File read, write, and edit tools, workspace-scoped by default.
- **FR-502** Shell execution tool runs on the host machine and is approval-gated on every invocation (FR-601).
- **FR-503** Web search tool performs internet queries triggered by agents or the user.
- **FR-504** Code execution tool runs short snippets and returns stdout, stderr, and exit code.
- **FR-505** MCP client support: connect to user-configured MCP servers and expose their tools to agents.
- **FR-506** Every tool has a permission level - `auto`, `confirm`, or `blocked` - configurable per tool in Settings; shipped defaults are safe (shell = confirm).

### FR-6xx - Approval Engine (the safety layer)
The approval engine is the ONLY safety layer in v1 (AGENTS.md rule 9). Exhaustive trigger list; anything not listed does not prompt unless the tool permission level says so.
- **FR-601** Approval triggers: (a) every shell command; (b) every file write outside the active workspace; (c) destructive git operations - `reset --hard`, force push, branch delete; (d) every outbound network call other than configured LLM providers.
- **FR-602** Each approval modal shows: the action, the full target path or command, the requesting agent, and a plain-language risk note.
- **FR-603** Destructive categories never offer an "always allow" option.
- **FR-604** Non-destructive actions may offer a per-project "remember this decision"; remembered grants are revocable in Settings.
- **FR-605** A user-configurable command denylist lives in Settings; denylisted commands are refused unconditionally - the denylist wins over agents, tool permissions, and remembered grants alike.
- **FR-606** Every approval decision is logged to SQLite with timestamp, agent, action, and decision; Settings provides an audit-log view.
- **FR-607** Docker sandbox appears only as a disabled, labeled placeholder in Settings.

### FR-7xx - Usage & Cost Dashboard
- **FR-701** Record tokens in and out for every LLM request.
- **FR-702** Estimate cost per request from per-model price rates maintained in-app.
- **FR-703** Count requests per aggregation dimension.
- **FR-704** Views cover the current session plus historical totals.
- **FR-705** Breakdowns filter and group by agent, project, provider, model, and day.
- **FR-706** Data source: one telemetry row per provider-layer request, written when the request completes.

### FR-8xx - Sessions, History & Memory
Everything an agent says or does is inspectable forever; nothing is ephemeral.
- **FR-801** Persist full per-session, per-agent transcripts (messages, tool calls, results) plus artifacts; both remain viewable after the session ends.
- **FR-802** Session history browser lists past sessions with project, date, and task summary; reopening shows them read-only.
- **FR-803** Persistent per-agent memory consists of markdown notes stored on disk with a SQLite index.
- **FR-804** Memory notes are user-editable both in-app and directly on disk.
- **FR-805** Memory injection follows each agent's `memoryPolicy` (what to recall and when), inspired by the Hermes-Agent pattern.

### FR-9xx - Skills (minimal, ADR-0005)
- **FR-901** Skills are user-editable markdown files on disk.
- **FR-902** Skills are assignable per agent and injected into that agent's system context.
- **FR-903** No marketplace and no agent-created skills in v1.

### FR-10xx - Multimodal (ADR-0006)
- **FR-1001** Composer accepts image attachments alongside task text.
- **FR-1002** If the receiving conversation model is vision-capable, images pass through directly.
- **FR-1003** Otherwise the image routes to a user-configured dedicated vision model whose textual result returns to the requesting agent.

### FR-11xx - UI Screens (exactly six)
The product surface is deliberately small; every feature must fit one of these screens.
- **FR-1101** Dashboard: recent projects and sessions, quick-start entry points.
- **FR-1102** Project workspace: file tree, editor hookup, git panel, agent console.
- **FR-1103** Agent registry screen: list, editor, template gallery.
- **FR-1104** Session view: Kanban board plus live transcripts; approval prompts surface here.
- **FR-1105** Usage dashboard rendering FR-7xx data.
- **FR-1106** Settings: theme; providers and keys; execution and denylist; memory; audit log.
- **FR-1107** Exactly six top-level screens ship in v1 - no others.
- **FR-1108** Theming via CSS variables supporting light/dark modes and an accent color.

### FR-12xx - Secrets & Config
- **FR-1201** API keys are stored only in Windows Credential Manager (DPAPI-backed storage).
- **FR-1202** Keys never appear in logs, the repository, transcripts, or error messages; redaction applies at serialization boundaries.
- **FR-1203** The UI displays keys masked by default with an explicit reveal action.

## 5. Non-Functional Requirements

All budgets apply on hardware meeting section 3 and are measured once per phase after the app boots.

### Performance
- **NFR-001** Idle RAM usage < 700 MB.
- **NFR-002** With 5 agents running concurrently, total RAM usage < 2.5 GB.
- **NFR-003** Cold start < 5 s; warm start < 2 s.

### Runtime behavior
- **NFR-004** No high-frequency polling; UI updates arrive event-driven (push over WebSocket).
- **NFR-005** No resident processes beyond the app itself and its single sidecar.

### Security & privacy
- **NFR-006** All user data stays on device; network egress occurs only to configured LLM providers and user-triggered web searches.
- **NFR-007** No telemetry and no crash reporting of any kind.

### Licensing & distribution
- **NFR-008** Dependency licenses restricted to MIT, Apache-2.0, BSD, ISC, MPL-2.0; GPL, LGPL, AGPL forbidden including transitively; a CI license-audit job fails the build on any violation.
- **NFR-009** Phases 1-5 ship via dev launcher and portable folder; the MSI installer is the Phase 6 exit gate and must install and run on a clean Windows 11 machine within NFR-001..003 budgets.

## 6. Architecture Constraints (locked)

| Layer | Choice |
| --- | --- |
| Desktop shell | Tauri 2 |
| Frontend | React 18 + TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| Sidecar | Node.js + TypeScript; sole database owner; localhost REST + WebSocket; auto-started/stopped by the shell |
| LLM client | Vercel AI SDK |
| Database | SQLite in WAL mode via Drizzle ORM |

Contract notes: the sidecar is the only component permitted to touch SQLite; the frontend never queries the database directly and reaches the sidecar only over localhost REST/WebSocket; all LLM traffic flows through the sidecar so telemetry rows (FR-706) are complete by construction.

Any change to this table requires an owner-approved ADR before implementation begins.

## 7. Phased Delivery & Acceptance

| Phase | Exit gate (acceptance) |
| --- | --- |
| 0 | This specification approved by the owner. |
| 1 | Architecture docs + skeleton repo; CI green: lint, typecheck, test, build, license audit (NFR-008). |
| 2 | App boots; sidecar auto-starts/stops; migrations run; Anthropic and OpenAI adapters wired; agent CRUD UI works; single-agent chat round-trips live against an OpenAI-compatible endpoint (per ADR-0003, FR-405/410). |
| 3 | Two multi-agent runs watched live in the UI: (a) 3-agent Planner -> Coder -> Reviewer coding task; (b) 2-agent research-and-summarize (FR-30x). |
| 4 | Tool-layer demo: an agent writes a script and executes it; the approval modal fires; an audit-log entry is recorded (FR-50x, FR-601/602/606). |
| 5 | Usage dashboard matches a real executed session; settings screens complete; theming applied; image attachment works (FR-7xx, FR-10xx, FR-11xx). |
| 6 | MSI installs and runs on a clean Windows 11 machine within performance budgets (NFR-009). |


**Definition of done for every phase:** self-test executed with evidence (AGENTS.md section d), owner-facing demo, phase report, explicit owner sign-off before the next phase starts.

Traceability summary: FR-1xx/2xx -> Phase 1-2; FR-3xx -> Phase 3; FR-5xx/6xx -> Phase 4; FR-7xx/10xx/11xx -> Phase 5; NFR-009 -> Phase 6. Each phase re-verifies NFR-001..003 once the app boots.

## 8. Open Items (pending owner input)

1. Private GitHub repository URL and access token.
2. UI design direction - required before Phase 1 architecture finalization.
3. Native-provider API keys (Anthropic/OpenAI/Gemini/OpenRouter) - live tests deferred until provided; mocked adapters used meanwhile per FR-410.
4. Rust toolchain local install timing (needed before the Phase 1 build).

### 8.1 Tagged assumptions in this draft
- Standard user-grade Windows install suffices; no special admin requirements. (section 3)
- Per-model price rates are maintained as in-app data the user can adjust. (FR-702)
- Remembered approval grants are revocable from Settings. (FR-604)
- Kanban column set Queued/In Progress/Review/Done is fixed for v1. (FR-308)

---

End of specification. Changes to locked stack (section 6) or safety behavior (FR-6xx) require a new owner-approved revision of this document or an ADR.