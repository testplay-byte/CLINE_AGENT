# Research memos — reference-project analysis

> **Reference clones live OUTSIDE this repo**, at `..\..\_references\<project>` relative to the repo root. They are never committed, never moved into the tree, and studied **for patterns only** — code is never copied.

Each memo follows the format and verification rules in `.kilo/skills/research-memo/SKILL.md`: claims verified from the actual repository, unverifiable claims marked `[UNVERIFIED]`, licenses read from each project's actual LICENSE file.

Scope of the 9 planned analyses is fixed by ADR-0002; additional references require a new ADR.

| Memo | Status | Focus |
| --- | --- | --- |
| [cline-analysis.md](cline-analysis.md) | complete | VS Code autonomous coding agent — plan/act loop, human-approval checkpoints, tool-use UX |
| [opencode-analysis.md](opencode-analysis.md) | complete | Terminal-first coding agent — client/server split, provider abstraction, TUI interaction patterns |
| [hermes-agent-analysis.md](hermes-agent-analysis.md) | complete | Lightweight agent framework — self-created skills direction, tool composition, minimal core loop |
| [metagpt-analysis.md](metagpt-analysis.md) | complete | Multi-agent SOP framework — role specialization and structured artifact hand-offs between roles |
| [openhands-analysis.md](openhands-analysis.md) | complete | OpenHands (ex-OpenDevin) — event-stream runtime, agent state machine, execution environment model |
| [kilocode-analysis.md](kilocode-analysis.md) | complete | Kilo Code (Cline/Roo lineage) — mode system, orchestration deltas vs upstream, feature triage |
| [autogen-analysis.md](autogen-analysis.md) | complete | Microsoft AutoGen — multi-agent group-chat conversation patterns, tool integration, termination logic |
| [langgraph-analysis.md](langgraph-analysis.md) | complete | LangGraph — graph orchestration, checkpointing, human-in-the-loop interrupts (maps to our approval gates) |
| [aider-analysis.md](aider-analysis.md) | complete | Aider — repository map, git-aware edit formats, diff-based edit strategies |

Status values: `pending` → `in progress` → `complete`.

## Cross-cutting findings — what Phase 1 architecture should absorb

Synthesized from the nine memos' adopt-pattern sections; parentheticals cite memo + pattern.

1. **Client-server split validated twice (opencode §4.1–4.2; kilocode — an opencode fork):** one headless backend with thin clients; typed declare-once API + generated clients (clients import contract types only); SSE-first eventing with a durable, cursor-replayable per-session stream vs a live-only lossy broadcast for global telemetry; reconnection policy lives in the client.
2. **Cline's provider layer is built ON Vercel AI SDK** (models.dev catalog + vendor handlers + option rules over `wrapLanguageModel`) — direct validation of our locked stack choice; we own only the narrow codec/middleware gaps it fills.
3. **Approval gates as first-class protocol objects (template for FR-6xx schema):** opencode wildcard allow/deny/ask rulesets blocking tool execution pending a client reply; openhands structural `WAITING_FOR_CONFIRMATION` run-loop status with approve/reject events; cline typed ask union with per-tool approval metadata (diff, outside-workspace flag).
4. **LangGraph: do NOT adopt as a dependency** (`@langchain/core` peer conflict with Vercel AI SDK). Build a lean bespoke run loop adopting its two-table monotonic checkpoint model (`checkpoints` + pending `writes`) and interrupt/resume semantics (id-keyed resume map, idempotent side effects before gates).
5. **AutoGen:** adopt the composable termination-condition algebra (AND/OR predicates, externally triggerable) and terminate-and-resume HITL semantics over persisted state (never block a run on a human); MagenticOne-style progress-ledger supervision with stall detection fits our cheap Orchestrator.
6. **MetaGPT:** declarative role profiles as data (prompt + allowed actions + watch list); `cause_by`-typed message subscriptions for context selection (per-agent inboxes, dedupe); disk-backed artifact chain passing thin references, gated by HUMAN/AUTO review modes.
7. **Hermes-Agent:** bounded char-capped MEMORY.md/USER.md stores injected as frozen snapshots at session start (prompt-cache friendly); nudge-based write triggers + background review fork (+ optional write-approval gate); skills via SKILL.md progressive disclosure with lifecycle governance.
8. **Kilo Code:** markdown agent persona files with frontmatter validate our agent registry storage choice; skills follow the open agentskills.io SKILL.md folder spec — ADOPT this format for v1 skills so marketplace growth needs no rework; permission engine allow/ask/deny x glob patterns x per-agent layers with hard floors.
9. **Aider:** tree-sitter + PageRank repo map as the Orchestrator's context-routing blueprint; pluggable edit formats with capped reflection loop; transactional git envelope (commit dirty work first, scoped auto-commits, guarded undo).
10. **OpenHands:** event-sourced state (append-only event tree, context as pure projection of the log); BaseWorkspace runtime seam so Docker sandbox slots in later without rework; SQLite over file-per-event storage.

Scribe QA pass 2026-08-22: all nine memos verified — metadata block, all seven sections, and a concrete license name present in each.