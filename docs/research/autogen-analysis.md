# AutoGen — Reference Analysis

**Metadata**

| Field | Value |
|---|---|
| Date | 2026-08-22 |
| Repo | https://github.com/microsoft/autogen |
| Branch/commit | `main` @ `027ecf0a379bcc1d09956d46d12d44a3ad9cee14` (HEAD of `main` confirmed via GitHub API at download time; latest commit dated 2026-04-06). Snapshot acquired as codeload ZIP of `main` — shallow `git clone` failed with a network/index-pack error, so no `.git` metadata in the local copy; SHA verified against the API instead. |
| Versions inspected | `autogen-core` 0.7.5, `autogen-agentchat` 0.7.5 (`pyproject.toml`); Python >= 3.10 |
| Verification method | Full source tree downloaded and read locally at `_references\autogen` (READ ONLY). Every claim below was checked against local files unless marked [UNVERIFIED]. |
| Status note | README carries a **Maintenance Mode** banner: AutoGen receives no new features and is community-managed; Microsoft Agent Framework (MAF) is the successor. Patterns remain valid study material; treat AutoGen as a frozen snapshot. |

## 1. Architecture overview (actor-style core, agent/team abstractions, message flow)

**Layered design** (README + package layout):

- **Core API** (`python/packages/autogen-core`) — message passing, event-driven agents, pluggable runtime.
- **AgentChat API** (`autogen-agentchat`) — opinionated agent/team layer built on Core; closest to classic v0.2 mental model.
- **Extensions** (`autogen-ext`) — model clients (openai, anthropic, azure, ollama, llama_cpp, semantic_kernel, replay/cache), tools, MCP workbenches.
- **Developer tools** — AutoGen Studio (no-code GUI; README explicitly warns it is *not* production-ready), agbench (benchmarks). Magentic-One ships as its own CLI package *and* as a group-chat topology inside agentchat.

**Actor-style core**:

- Agents are addressable actors identified by `AgentId(type, key)`; `RoutedAgent` dispatches messages to typed handlers; per-agent processing is strictly sequential (`SequentialRoutedAgent` adds FIFO locking).
- The `AgentRuntime` protocol exposes exactly two delivery modes: direct request/response (`send_message` to one AgentId) and publish/subscribe (`publish_message` to a `TopicId`; delivery via `TypeSubscription`/`TypePrefixSubscription` bindings topic→agent-type).
- `SingleThreadedAgentRuntime` is the in-process implementation; a gRPC-backed distributed runtime exists for cross-language work (`dotnet/src/Microsoft.AutoGen/{AgentHost,Core.Grpc,RuntimeGateway.Grpc}` + shared `protos/`; python sample `core_grpc_worker_runtime`).
- Every send/publish accepts a `CancellationToken` that propagates into in-flight work (linked to futures/tasks).
- `InterventionHandler` hooks fire on `on_send` / `on_publish` / `on_response` and may inspect, modify, or drop any message (`DropMessage` marker) — a runtime-level policy point that lives *outside* agent code.

**How teams map onto the core** (`teams/_group_chat/_base_group_chat.py`): each team embeds its own `SingleThreadedAgentRuntime`, wraps every participant in a `ChatAgentContainer` actor, registers one group-chat-manager actor, and wires all three through uniquely-suffixed topics (`group_topic_{team_id}`, `output_topic_{team_id}`). Flow: task arrives as `GroupChatStart` → manager picks next speaker via `select_speaker(thread)` → `GroupChatRequestPublish` to the chosen container → container runs its agent and publishes the response → manager evaluates termination conditions → `GroupChatTermination`. All traffic mirrors to an output queue backing `run_stream()`. Internal event vocabulary (`_events.py`): Start, AgentResponse, RequestPublish, Termination, Reset, Pause, Resume, Error.

**Task/agent abstractions**:

- `TaskRunner` protocol: `run(task?, cancellation_token?) -> TaskResult{messages, stop_reason}` and `run_stream(...)` async generator ending in TaskResult. Runners are stateful — calling `run` again continues the same conversation rather than starting fresh.
- `Team` adds `name`/`description` (for nesting/composition), `reset()`, `pause()`, `resume()`, `save_state() -> Mapping`, `load_state(state)`. Saved state covers the message thread, per-agent state (including model chat contexts) and manager counters (e.g., round/stall counts); every group chat topology implements it.
- Everything is declaratively serializable through `Component[Config]` pydantic schemas (`component_type`, `component_provider_override`), which is what powers AutoGen Studio's no-code editor.

**Topologies behind one manager interface** (`select_speaker`):

- `RoundRobinGroupChat` — fixed rotation.
- `SelectorGroupChat` — LLM speaker election each round from participant name+description roster, with programmatic overrides: `selector_func` (bypasses the model when it returns a name), `candidate_func` (narrows eligible speakers), `allow_repeated_speaker`, `max_selector_attempts` retry loop for parse failures.
- `Swarm` — control flow via explicit `HandoffMessage` targets chosen by each agent.
- `MagenticOneGroupChat` — ledger orchestrator (below).
- `GraphFlow` + `DiGraphBuilder` — explicit DAG workflows with node join/activation semantics.

**MagenticOne orchestrator** (`teams/_group_chat/_magentic_one/_magentic_one_orchestrator.py`, `_prompts.py`): outer loop builds a *task ledger* — closed-book facts gathering, then plan generation against a one-line-per-agent team roster. Inner loop each round requests a structured JSON *progress ledger*: `{is_request_satisfied, is_progress_being_made, is_in_loop, next_speaker, instruction_or_question}` (each field carrying answer + reason). Satisfied → synthesize final answer with a dedicated prompt. A stall counter increments on "no progress" or "in loop" verdicts; reaching `max_stalls` triggers re-planning (facts update + plan regeneration). Counters persist in orchestrator save/load state.

**Messages** (`messages.py`): pydantic hierarchy splitting chat content from telemetry — `BaseChatMessage(source, content, metadata)` vs `BaseAgentEvent`. Concrete chat types: `TextMessage`, `MultiModalMessage`, `StopMessage`, `HandoffMessage`, `ToolCallSummaryMessage`, `StructuredMessage[T]`. Events stream separately: `ToolCallRequestEvent`, `ToolCallExecutionEvent`, `UserInputRequestedEvent`, `ThoughtEvent`, `SelectSpeakerEvent`, `MemoryQueryEvent`, streaming chunks. This split lets `run_stream()` feed rich UIs without polluting model context.

**Termination conditions** (`base/_termination.py`, `conditions/_terminations.py`): abstract stateful predicate called with messages since last check, returns `StopMessage | None`; must be `reset()` between runs; combinable with `&` / `|` into AND/OR composites that aggregate stop reasons. Built-ins: MaxMessage, TextMention ("TERMINATE"-style), TokenUsage, Timeout, **External** (triggered imperatively from outside the run, e.g. a UI cancel button), **Handoff** (stop when control is handed to a named agent — the HITL primitive), SourceMatch, FunctionCall, StopMessage, Functional (arbitrary user predicate).

**Human-in-the-loop**: `UserProxyAgent` represents a human via an injected sync/async `input_func` (cancellable). Its own docs warn that blocking input stalls the whole team and recommend the alternative: terminate with `HandoffTermination`/`SourceMatchTermination`, persist `save_state()`, return control to the application, resume later by re-running with saved state. Samples confirm both styles: `core_async_human_in_the_loop` (await human before a tool call), `agentchat_fastapi` / `agentchat_chainlit` / `core_streaming_handoffs_fastapi` (web integration).

**Per-agent memory** (`autogen_core.memory`): `Memory` ABC over `MemoryContent{content, mime_type, metadata}` with `update_context`/`query`/`add`/`clear`; `AssistantAgent` attaches memory instances whose query results are injected into the model context per turn (surfaced as `MemoryQueryEvent`). `model_context` module provides bounded/token-limited chat-context strategies (buffered, head-and-tail).

**.NET sibling** (`dotnet/src/Microsoft.AutoGen/*`: Contracts, Core, Core.Grpc, AgentHost, AgentChat, Agents, Extensions, RuntimeGateway.Grpc) demonstrates the actor+pubsub design ported across languages via proto contracts; legacy `AutoGen.*` adapter packages coexist in the same solution.

## 2. Tech stack

- Python >= 3.10; fully async (asyncio) execution; actors run on an in-process single-threaded event loop (no threads per agent).
- pydantic v2 throughout: message types, termination configs, component configs, state serialization.
- protobuf (~5.29.3) for serialization/cross-language contracts; OpenTelemetry API for tracing; pillow for image content; jsonref for schema tooling.
- Optional distributed runtime via gRPC (dotnet AgentHost; python worker-runtime sample).
- Model access behind a provider-agnostic `ChatCompletionClient` interface; concrete clients live in `autogen-ext` (verified dirs: openai, anthropic, azure, ollama, llama_cpp, semantic_kernel, replay, cache).
- Build/tooling: hatchling monorepo under `python/packages/*`; monorepo also contains `dotnet/` (.NET solution, Microsoft.AutoGen.* NuGets) and `protos/`.
- AutoGen Studio: separate package providing web UI [stack details not inspected — UNVERIFIED].

## 3. License (exact name + source file)

- **Code**: "MIT License", Copyright (c) Microsoft Corporation — repo-root file `LICENSE-CODE` (each package's `pyproject.toml` references this file explicitly).
- **Documentation/non-code content**: "Creative Commons Attribution 4.0 International" (CC-BY-4.0) — repo-root file `LICENSE`.
- Practical implication for ACUTE-CODE: MIT governs anything code-derived; CC-BY-4.0 requires attribution if doc text were reused. We adopt patterns only (no code, no verbatim docs), so neither license constrains us; crediting the source in research notes remains good practice.

## 4. Top 2–3 patterns worth adopting for ACUTE-CODE

### 4.1 Composable, externally-triggerable termination conditions

- **What**: small stateful predicate objects evaluated after every agent turn, returning an optional typed stop signal; combinable into AND/OR policies; one variant (`ExternalTermination`) is flipped imperatively from outside the run; all require explicit reset between runs and aggregate human-readable stop reasons.
- **Why**: termination policy becomes data, not scattered `if` statements; UI, budget limits, and conversational heuristics combine without touching agent logic; stop reasons give the Kanban/UI a precise "why did this end" string for free.
- **How it maps**: our per-agent max-turns field becomes one condition instance among several. Orchestrator composes per-task policies like `MaxTurns(agent.maxTurns) OR TokenBudget(task.budget) OR TextMention("APPROVAL_REQUESTED") OR External(cancelledByUser)` in the sidecar bus loop. ExternalTermination maps 1:1 to our approval-gate deny/cancel buttons and WS kill switch. Conditions are cheap plain TS objects persisted alongside task rows in SQLite so a resumed run restores its remaining budget/counters.

### 4.2 Terminate-and-resume human-in-the-loop over persisted state

- **What**: instead of blocking a run while waiting for a human, AutoGen's recommended pattern is: hit a handoff/source-matched termination → serialize full team state (`save_state`: thread, agent states, manager counters) → hand control back to the hosting app → deserialize and continue when the user responds. Enforcement points are centralized: the runtime's intervention hooks can intercept/drop any message before delivery, and `pause()`/`resume()` handle short-lived suspensions.
- **Why**: long human latencies must not pin worker loops or sockets; persisted state makes gates durable across restarts; central interception keeps policy out of every agent implementation.
- **How it maps**: this is our approval-gate architecture. When a worker emits a gate request, the sidecar parks the task in the Kanban "Awaiting Approval" column, persists run state (message thread + per-agent memory pointers + remaining termination budget) via Drizzle/SQLite WAL, and frees the concurrency slot (respecting our cap of 5 active workers). On approve/deny, the sidecar reloads state and resumes the run. An InterventionHandler-style middleware on our shared message bus (inspect/mutate/reject each bus message by sender/recipient/type) gives us audit logging and gate enforcement in exactly one place.

### 4.3 Progress-ledger supervision with stall detection (MagenticOne → our two-tier)

- **What**: the MagenticOne orchestrator keeps a task ledger (facts + plan) and, each round, asks a cheap LLM call for a structured JSON progress check — request satisfied? progress being made? stuck in a loop? who acts next and with what instruction? — plus a stall counter that forces re-planning after N stalled rounds, and periodic fact reconciliation.
- **Why**: structured self-checks catch the dominant multi-agent failure mode (polite infinite loops) far cheaper than letting capable models burn tokens until a turn cap hits. It validates the thesis behind our two-tier design: supervision is a cheaper-model job.
- **How it maps**: our cheap Orchestrator already assigns tasks to ≤5 capable workers; adopt the ledger fields as its checkpoint schema — per running task it evaluates {satisfied?, progressing?, looping?, nextWorker?, instruction?} from the shared bus transcript, increments a stall counter on negative verdicts, and on threshold re-plans (rewrite task description, reassign, or escalate to the user via a gate). Ship it as an opt-in "deep supervision" mode per task; default mode stays lightweight (round-robin checks + termination conditions). Note MagenticOne uses the same capable model family for orchestration — we generalize it by using our cheap tier, which is the differentiator worth testing.

## 5. What to avoid and why

- **The actor-runtime machinery itself** (`SingleThreadedAgentRuntime`, topic/subscription plumbing, gRPC workers, protobuf envelopes): justified for AutoGen's distributed/cross-language ambitions, but ACUTE-CODE runs one Node sidecar with REST+WS and ≤5 concurrent workers. Re-implementing actor infrastructure in TypeScript adds weight with no payoff; our existing shared message bus already provides the delivery semantics we need.
- **Per-round LLM speaker election as the default router** (SelectorGroupChat without programmatic override): one extra model call per turn, latency + cost + nondeterminism. Our two-tier model assigns workers explicitly; keep election-style routing only as an optional mode if ever needed.
- **The full topology zoo for v1** (Swarm handoff graphs, DiGraph workflows, SocietyOfMind nested-team agents, AgentTool-wrapped sub-agents): powerful but heavy; flat Orchestrator+workers covers our scope. Revisit only if real workloads demand graph-shaped pipelines.
- **Declarative Component config framework** (`ComponentBase[Config]`, provider strings, JSON round-tripping of every component): exists to serve Studio's no-code editing. Our closed desktop app has a fixed schema; zod/TS types + DB rows are simpler.
- **Coupling our roadmap to AutoGen**: it is in maintenance mode; evolution continues in Microsoft Agent Framework. Treat AutoGen strictly as a pattern source (we cannot depend on its code anyway — it is Python).
- **Blocking human-input agents inside server-side runs**: UserProxyAgent's own documentation flags this anti-pattern; see §4.2 for the adopted alternative.
- **AutoGen Studio as an architectural reference**: README states it is not production-ready and lacks auth/security hardening expected of deployed apps.

## 6. Sources consulted

All paths relative to local snapshot `C:\Users\khurr\Desktop\KILO\_references\autogen` (main @ 027ecf0a, downloaded 2026-08-22):

- `README.md` (layered architecture, maintenance-mode notice, Studio caution, legal notices)
- `LICENSE` (CC-BY-4.0), `LICENSE-CODE` (MIT)
- `python/packages/autogen-core/pyproject.toml`, `python/packages/autogen-agentchat/pyproject.toml` (v0.7.5, deps)
- `python/packages/autogen-core/src/autogen_core/`: `_agent_runtime.py` (send/publish protocol), `_intervention.py`, `_single_threaded_agent_runtime.py` (existence/embedding), `_cancellation_token.py`, `_subscription.py`/`_type_subscription.py` (names), `memory/_base_memory.py`, `model_context/*`
- `python/packages/autogen-agentchat/src/autogen_agentchat/`: `messages.py`, `base/_termination.py`, `conditions/_terminations.py`, `agents/_user_proxy_agent.py`, `base/_team.py`, `base/_task.py`, `teams/_group_chat/_base_group_chat.py`, `_events.py`, `_round_robin_group_chat.py`, `_selector_group_chat.py`, `_swarm_group_chat.py`, `_magentic_one/_magentic_one_orchestrator.py`, `_graph/_digraph_group_chat.py`
- `python/packages/autogen-ext/src/autogen_ext/models/` (provider list)
- `python/samples/`: `core_async_human_in_the_loop/README.md`, directory listing (fastapi/chainlit/streamlit HITL samples)
- `dotnet/src/Microsoft.AutoGen/` (directory listing: Contracts, Core, Core.Grpc, AgentHost, …)
- GitHub REST API `GET /repos/microsoft/autogen/commits/main` (commit SHA verification)

## 7. Open questions

1. Scope of composition: does ACUTE-CODE ever need nested teams/sub-teams (SocietyOfMind style), or is flat Orchestrator+≤5-workers sufficient for v1? Affects whether our task records need parent links beyond the current Kanban model.
2. Where do termination policies live: per-agent fields (current max-turns), per-task overrides, or workspace defaults composed at run time? AutoGen composes only at team level; we should pick one canonical composition point.
3. Should deep supervision (§4.3) reuse worker-tier model credentials or have its own cheap-model config? Cost attribution per tier matters for budgets.
4. Pause/resume across sidecar restarts: AutoGen persists conversation state but not mid-tool-call execution. What is our equivalent cut line — do we allow resuming a task whose worker died mid-edit, or always restart the task step?
5. TokenUsageTermination depends on usage metadata returned by providers; verify Vercel AI SDK exposes equivalent per-call token accounting for all providers we ship.
6. Do we want a formal cross-process message contract (AutoGen uses protos) — e.g., generated JSON Schema/zod shared between Tauri UI, sidecar, and any future out-of-proc workers — or is the sidecar's TS types enough?
7. Follow-up research: Microsoft Agent Framework (MAF) is the maintained successor and may have improved workflow/orchestration patterns worth a Phase 0 pass of its own.
