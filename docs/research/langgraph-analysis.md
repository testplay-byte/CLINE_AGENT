# LangGraph — Reference Analysis

**Date:** 2026-08-22
**Repo:** https://github.com/langchain-ai/langgraph (branch `main`, commit `f09cfe8ffc1eeffd68f4b628ed69c30f7cad229f`, 2026-08-20, shallow clone)
**Supplementary repo:** https://github.com/langchain-ai/langgraphjs (branch `main`, commit `f8bdf16d4fe23a79e945ea5dc6f86bbf09abb77d`, 2026-08-21, shallow clone). Cloned because the `langgraph` monorepo is now Python-only — LangGraph.js was split out into this separate repository (confirmed via README.md:33 of the Python monorepo, which links to it). All JS/TS findings below come from the langgraphjs clone.
**Verification method:** direct source inspection of shallow git clones (READ ONLY) + webfetch of docs.langchain.com pages (persistence, interrupts). Claims not verifiable from these sources are marked [UNVERIFIED]. Patterns only — no code copied.

## 1. Architecture overview (graph runtime, state/reducer model, checkpoint lifecycle)

**Graph runtime.** LangGraph models an agent system as a state machine: `StateGraph` with named nodes (units of work) and edges (static, conditional, or dynamic). Compilation produces a Pregel-inspired runtime (Python: `libs/langgraph/langgraph/pregel/`; JS: `libs/langgraph-core/src/pregel/` — algo/loop/runner/read/write/stream modules). Execution proceeds in supersteps: nodes run when the channels they read have versions newer than what they've already seen (`versions_seen` bookkeeping), fan-out is expressed as multiple edge targets or dynamic `Send` objects, and a step ends when all triggered nodes finish and their writes land. Dynamic navigation is a first-class primitive: nodes return a `Command` carrying `goto` (node names or `Send`s), `update` (state patch), and `graph` (`PARENT` to bubble navigation from a subgraph to its parent).

**State/reducer model.** State is a typed record of named channels, each with a reducer (JS: `Annotation.Root({ key: Annotation<Value, Update>({ reducer, default }) })`, `libs/langgraph-core/src/graph/annotation.ts`; default reducer is last-write-wins; accumulating reducers like `add_messages` are provided). Nodes return partial updates; the runtime merges them deterministically through the reducers. This makes concurrent writes from parallel nodes well-defined rather than racy — the key discipline separating "state graph programming" from "free-form chat loop."

**Checkpoint lifecycle.** A checkpointer persists a full state snapshot per superstep, keyed by `thread_id` (+ `checkpoint_ns` for subgraphs). The `Checkpoint` record (Python: `libs/checkpoint/langgraph/checkpoint/base/__init__.py:92`) holds: format version `v`, a unique + monotonically increasing `id`, ISO timestamp, `channel_values`, `channel_versions`, `versions_seen`, `updated_channels`. Metadata records `source` (`input` | `loop` | `update` | `fork`), `step`, and `parents`. A `CheckpointTuple` adds parent config and `pending_writes` (writes staged but not yet committed to state). The saver interface (`BaseCheckpointSaver`, same file :176) is small: get_tuple / list / put / put_writes (+ async variants) with a pluggable serializer. The JS SQLite saver (`libs/checkpoint-sqlite/src/index.ts`, `SqliteSaver`, better-sqlite3-backed) uses exactly two tables: `checkpoints (thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, type, checkpoint, metadata)` and `writes` — i.e., append-only blob history + a writes table for pending/resumed writes. Because every superstep is checkpointed and checkpoint IDs are monotonic, you get: resume-after-crash (reload latest checkpoint for the thread), time-travel (replay from any checkpoint id), and durable HITL pauses for free. Docs also describe durability modes (when in a step snapshots are taken) and a beta "delta channel" mechanism to avoid unbounded snapshot growth (metadata fields `counters_since_delta_snapshot`, `DeltaChannelHistory` — marked Beta in source).

**Interrupts / human-in-the-loop.** `interrupt(value)` (Python: `libs/langgraph/langgraph/types.py:851`; JS: `libs/langgraph-core/src/interrupt.ts`) is a single dynamic primitive: calling it raises a special `GraphInterrupt` that the runtime catches, persists state for, and surfaces to the caller (as `__interrupt__` in the result/stream). The graph then waits indefinitely. Resuming = re-invoking the graph with `Command(resume=...)` on the same `thread_id`; the resume value becomes the return value of the `interrupt()` call, and the node re-executes from its start. Documented rules: don't wrap `interrupt` in bare try/catch (it works by throwing); multiple interrupts in one node are matched to resume values strictly by index/order; side effects before an interrupt must be idempotent (the node re-runs); payloads must be JSON-serializable; parallel branches that interrupt simultaneously are resumed with a map of interrupt-id → resume value. Static breakpoints (`interruptBefore`/`interruptAfter` node lists at compile/run time) exist but docs explicitly do not recommend them for HITL. Requires a checkpointer — the pause is durable, not in-memory.

**Subgraphs.** A compiled graph can be used as a node in another graph ("agent as node"). Subgraphs get their own checkpoint namespace under the parent's; `Command(graph=PARENT)` lets a subgraph navigate the parent. Interrupts inside subgraphs resume from the start of both the subgraph node and the parent node that invoked it (per docs).

**Multi-agent patterns.** `langgraph-supervisor` (JS, `libs/langgraph-supervisor/src/supervisor.ts`) builds a StateGraph with a supervisor LLM node that routes work to worker agents (each a prebuilt ReAct agent) via dynamically generated hand-off tools, optionally with hand-off back-messages; `langgraph-swarm` implements direct agent-to-agent hand-off. Reference notebooks exist in the Python monorepo (`examples/multi_agent/hierarchical_agent_teams.ipynb`, `multi-agent-collaboration.ipynb`; `examples/human_in_the_loop/wait-user-input.ipynb`).

## 2. Tech stack

- **Python monorepo** (`langchain-ai/langgraph`): pure-Python core (`libs/langgraph`) with channels/pregel/graph/stream packages; `libs/checkpoint` = base checkpointer interfaces + in-memory saver + serde (JSON-plus/msgpack, optional encryption) + Store (cross-thread KV) + cache; `libs/checkpoint-sqlite` / `checkpoint-postgres` savers; `libs/prebuilt` (ReAct agent factory, ToolNode, interrupt helpers); `libs/cli`, `sdk-py`. Docs in-repo are a stub redirect to docs.langchain.com.
- **JS/TS repo** (`langchain-ai/langgraphjs`): TypeScript, Node >= 20, dual ESM/CJS. Published as `langgraph` (facade) re-exporting `@langchain/langgraph` v1.x (confirmed in `libs/langgraph/src/index.ts` — a v1 repackaging). Core lives in `libs/langgraph-core`; checkpointer base is `@langchain/langgraph-checkpoint`; SQLite saver `@langchain/langgraph-checkpoint-sqlite` (dependency: `better-sqlite3`); Postgres/Mongo/Redis savers; `langgraph-supervisor`, `langgraph-swarm`; React/Angular/Svelte/Vue SDKs for consuming LangGraph Agent Server streams.
- **Critical dependency fact:** both the JS core and the checkpointer base declare `@langchain/core` as a *peer dependency* (`^1.1.44` / `^1.1.48`), plus `zod`. The interrupt machinery imports `@langchain/core` singletons/runnables directly. Supervisor/swarm/prebuilt are hard-typed against LangChain chat-model and tool interfaces. LangGraph.js is not usable without the LangChain core abstraction layer in your dependency tree.

## 3. License (exact name + source file)

**MIT License.**
- Python monorepo: `LICENSE` at repo root — "MIT License / Copyright (c) 2024 LangChain, Inc."
- JS repo: `LICENSE` at repo root — "MIT License / Copyright (c) 2024 LangChain"; `libs/langgraph/package.json` declares `"license": "MIT"`.
Permissive; compatible with closed-source commercial use. (Transitive note: `better-sqlite3` is MIT but is a native module — Windows build/prebuild behavior is an integration question, not a licensing one.)

## 4. Top 2–3 patterns worth adopting for ACUTE-CODE — what/why/how-it-maps

**P1. Two-table checkpoint model: append-only snapshot history + pending-writes table, keyed by (thread, namespace, monotonic id).**
- *What:* `checkpoints(thread_id, ns, checkpoint_id, parent_checkpoint_id, type, blob, metadata)` + `writes` table; metadata carries `source`/`step`/`parents`; ids monotonic for ordering.
- *Why:* it is the minimal durable substrate that simultaneously gives us resumable transcripts, restart recovery, and an audit trail — exactly our session model. Every orchestration step persists a snapshot before side effects proceed; "resume after restart" becomes "load latest checkpoint for session," not bespoke recovery code.
- *Maps to:* our sidecar already owns SQLite WAL/Drizzle. Adopt the table shape and metadata enum for a `session_checkpoints`/`pending_writes` pair alongside (not replacing) the human-readable transcript tables; the transcript stays the UI-facing log, checkpoints are the machine cursor.

**P2. The interrupt/`Command(resume)` approval primitive and its operational rules.**
- *What:* one dynamic, durable pause primitive — a node emits a JSON proposal and halts; an external actor later resumes with a decision value; parallel interrupts are resumed via an id→value map.
- *Why:* it is precisely our approval gate, already battle-tested. The value is less the exception mechanics than the invariants: side effects before the gate must be idempotent; gate payloads serializable; gate order stable within a node; fan-out (our up-to-5 workers) resumed by interrupt id, not position-in-UI.
- *Maps to:* Orchestrator/workers call `requestApproval({action, diff, risk})` → run loop persists state + emits WS event → UI gate resolves → loop resumes the exact task with `{approved, edits}`. The id-keyed resume map handles five workers awaiting approval simultaneously. Adopt the documented failure rules as our engineering checklist.

**P3. Reducer-based state with dynamic fan-out (`Send`) for the worker pool.**
- *What:* shared state = named channels with explicit reducers (append-only for messages, last-write for status fields); a supervisor node returns `Send(worker, task)` items to spawn a dynamic set of parallel worker nodes; workers return partial updates merged deterministically.
- *Why:* gives us a deterministic shared-message-bus semantics for concurrent workers (no lost updates), and the worker cap becomes a property of the fan-out function (emit at most 5 Sends) rather than scattered mutex logic.
- *Maps to:* our message bus and Kanban board state become reducer-defined channels; Orchestrator = supervisor node; each worker = subgraph-as-node so per-worker checkpoints/interrupts stay namespaced.

## 5. What to avoid and why

- **Adopting the LangChain abstraction layer.** `@langchain/core` is a hard peer dependency of every relevant JS package, and supervisor/prebuilt/interrupt code imports its model/tool/runnable types directly. Our sidecar is built on the Vercel AI SDK; bolting LangChain core under it means two competing LLM abstractions, duplicated message types, and adapter glue forever.
- **The full Pregel engine for a ≤6-node runtime.** Channels/versioning/superstep machinery, remote graphs, retry/timeout/stream subsystems, and beta delta-channel snapshotting exist to serve arbitrary-scale graphs and the hosted Agent Server. Our fixed topology (1 orchestrator + cap-5 workers) needs a small fraction of that surface; the rest is abstraction weight we would debug but never use.
- **Churn coupling.** Evidence in-repo: docs moved off the repo to a new docs domain mid-life; v1 repackaged `@langchain/langgraph` behind a new `langgraph` facade; the state-schema API has shifted (deprecated `value:` field in favor of `reducer:` in annotation types; new zod `StateSchema` alongside `Annotation.Root`); beta features carry explicit "may change" warnings. A closed product pinned to this API surface inherits a nontrivial upgrade tax.
- **Platform gravity.** Streaming SDKs, durability modes, and deployment docs assume LangGraph Agent Server / LangSmith. A local-first, closed-source workbench should not let its run loop drift toward that hosting model.
- **Blindly copying the resumable-exception control flow.** It is elegant but subtle (node re-execution on resume, index-matched interrupts). A bespoke loop can implement the same *semantics* with an explicit paused-state machine, which is easier to reason about in a debugger — keep the invariants (P2), choose our own mechanics.

## 6. Sources consulted

Clones (READ ONLY):
- `C:\Users\khurr\Desktop\KILO\_references\langgraph` — README.md; AGENTS.md (library/dependency map); LICENSE; docs/llms.txt; libs/checkpoint/langgraph/checkpoint/base/__init__.py (Checkpoint :92, CheckpointTuple :139, BaseCheckpointSaver :176, CheckpointMetadata :38); libs/langgraph/langgraph/types.py (Command :799, interrupt :851); libs/checkpoint-sqlite layout; libs/prebuilt layout (interrupt.py, tool_node.py); examples/human_in_the_loop/, examples/multi_agent/.
- `C:\Users\khurr\Desktop\KILO\_references\langgraphjs` — libs/langgraph/package.json + src/index.ts (facade, peer deps, MIT); libs/langgraph-core/src/interrupt.ts; src/graph/annotation.ts; src/graph/ layout (messages_reducer.ts, zod state schema); src/pregel/ layout; libs/checkpoint/package.json (peer dep @langchain/core); libs/checkpoint-sqlite/src/index.ts (SqliteSaver, checkpoints/writes schema) + package.json (better-sqlite3); libs/langgraph-supervisor/src/supervisor.ts + handoff.ts; libs/langgraph-swarm/src; LICENSE.

Web (fetched 2026-08-22):
- https://docs.langchain.com/oss/javascript/langgraph/persistence (checkpointer vs store, durability, thread_id semantics, checkpoint retention)
- https://docs.langchain.com/oss/javascript/langgraph/human-in-the-loop (interrupt semantics, resume rules, parallel-interrupt resume map, static breakpoints)
- https://docs.langchain.com/llms.txt (docs index; used to locate the above after the in-repo docs redirect)

## 7. Open questions

1. How exactly are resume values persisted across process restarts (the `writes` table's RESUME rows) and are they replayed deterministically on resume? Source suggests yes but we did not trace the JS loop end-to-end. [UNVERIFIED]
2. Default durability mode in the JS runtime (snapshot per superstep vs per input) and its write-amplification on long coding sessions; retention/pruning strategy for per-superstep snapshots is left to the app per docs.
3. Whether `@langchain/langgraph-checkpoint` (base checkpointer, MIT) can be used *without* `@langchain/core` in practice — package.json declares it a peer dep, but how deep the runtime type usage goes was not measured. [UNVERIFIED]
4. `better-sqlite3` native-module behavior inside our Tauri sidecar packaging on Windows (prebuilds vs node-gyp) — integration risk to validate in a spike.
5. Subgraph interrupt resume semantics (parent + child both re-execute from node start) — acceptable cost for our worker-as-subgraph design? Needs a prototype measurement.
6. Current stable version line of `@langchain/langgraph` on npm and its release cadence/deprecation policy (repo shows v1.0.x in-progress; npm-side facts not verified here). [UNVERIFIED]
