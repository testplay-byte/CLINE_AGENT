# Cline - Reference Analysis

**Metadata**

- Date: 2026-08-22
- Repo URL: https://github.com/cline/cline
- Branch/commit analyzed: `main` @ `fb58e340a2139fd41858a8b046a4f52643f70b95` ("Add feature flags to the desktop app (#13289)"), clean working tree
- Verification method: local shallow git clone at `C:\Users\khurr\Desktop\KILO\_references\cline` (pre-existing, reused read-only; `git log` + clean `git status` verified). All claims below were read directly from source files at this commit unless marked [UNVERIFIED]. Patterns only - no code copied.
- Note: Cline has restructured from a single VS Code extension (`src/`) into a Bun monorepo: `sdk/packages/*` (shared SDK), `apps/vscode`, `apps/cli`, `apps/cline-hub` (daemon), `apps/examples/desktop-app` (Tauri 2). The classic extension architecture and the new SDK coexist in-tree.

## 1. Architecture overview

**Host + webview split.** The VS Code app (`apps/vscode`) keeps a strict two-process split: the extension host owns all state, tool execution, filesystem/git access, and provider calls; the webview is a React UI that only renders messages and emits user intents. Since the monorepo restructure, the host-to-webview contract has migrated from freeform `postMessage` JSON to typed gRPC-style protobuf services (`apps/vscode/proto/*.proto` compiled to a bundled `descriptor_set.pb`; services per domain: task, state, ui, checkpoints.proto, mcp.proto, models.proto, file.proto, browser.proto, etc., generated client/server code under `src/generated`). A legacy JSON protocol still exists (`src/shared/ExtensionMessage.ts`) with two hardening fields worth noting: a monotonic `seq` per process for convergent-replica merging of streaming partials, and an `epoch` fence so stale messages from a previous task/render are dropped by the webview. A `TaskProxy` shim (`apps/vscode/src/sdk/task-proxy.ts`) adapts the old Task interface onto the new SDK runtime, confirming hosts are now thin shells over shared core logic.

**Task loop.** The agentic loop moved into the layered SDK: `@cline/agents` holds the stateless loop (`agent-runtime.ts` - model streaming, tool orchestration, hooks); `@cline/core` wraps it with stateful concerns: session lifecycle/storage (`src/session`, SQLite-backed stores), runtime assembly (`src/runtime`: capabilities, config, host, orchestration, safety, tools, turn-queue), hub daemon (`src/hub`), and scheduled runs (`src/cron`). Hosts (CLI, VS Code, desktop sidecar) compose `@cline/core`.

**Plan/Act modes.** Mode is a first-class dimension threaded through prompts, asks, and schedules: `"act" | "plan" | "yolo"` (`sdk/packages/shared/src/extensions/context.ts`, `prompt/format.ts`, cron spec types; `"zen"` appears in automation schemas [UNVERIFIED meaning]). In plan mode the agent reasons/presents a plan (`ClineAsk: "plan_mode_respond"`, `ClineSay: "plan_completion_result"`) without mutating; execution is gated behind explicit mode switch. "yolo" = approvals disabled entirely (auto-approve everything, used by headless/scheduled runs).

**Ask/response approval protocol.** Every potentially unsafe action surfaces as an async ask on the message bus; the UI answers via one typed RPC (`askResponse.ts` maps `yesButtonClicked | noButtonClicked | messageResponse` plus optional text/images/files into `handleWebviewAskResponse`). The `ClineAsk` union enumerates every gateable event: `followup`, `plan_mode_respond`, `command`, `command_output`, `completion_result`, `tool`, `api_req_failed`, `resume_task`, `mistake_limit_reached`, `browser_action_launch`, `use_mcp_server`, `new_task`, `condense`, `use_subagents`, etc. Tool asks carry structured metadata (`ClineSayTool`: tool kind, path, diff, content, regex, line ranges, whether the operation lies outside the workspace) so the user can judge a diff before approving - not just a tool name. Auto-approve settings are per-action-category booleans (`readFiles`, `editFiles`, `executeSafeCommands`, `useBrowser`, `useMcp`) with a `version` counter incremented on every change to prevent races (`apps/vscode/src/shared/AutoApprovalSettings.ts`). For the Tauri desktop sidecar, approval crosses process boundaries via file-based IPC: the runtime writes `{session}.request.{toolCallId}.json` into an approval dir and polls for a matching decision file with timeout defaulting to 5 minutes (`sdk/packages/core/src/runtime/tools/tool-approval.ts`).

**Checkpoints.** Legacy shadow-git was replaced by a stash/ref-based hook: per agent run, the SDK records a checkpoint as a git stash (or commit) tagged `cline checkpoint session=...`, storing `{ref, createdAt, runCount, kind}` history in session metadata, with restore and diff helpers beside it (`sdk/packages/core/src/hooks/checkpoint-hooks.ts`, `core/session/checkpoint-restore.ts`, `checkpoint-diff.ts`). A custom checkpoint implementation can be injected. Compaction-aware numbering keeps checkpoint indices stable across context compaction events.

**Context management.** Two strategies: (1) auto-compact - when nearing the model's context window, summarize the conversation (a visible summarization tool call with normal cost accounting) and replace history with the summary; falls back to rule-based truncation on models without summarization support (`docs/features/auto-compact.mdx`; overflow constants and retry-once-after-compaction semantics live in `sdk/packages/agents/src/agent-runtime.ts`); (2) history range deletion - truncated ranges are recorded on messages (`conversationHistoryDeletedRange`) rather than destructively removed, so restores/edit-regenerates remain possible. `/compact` state is keyed by a stable hash of the transcript prefix (`runtime/config/agent-message-codec.ts`) so saved compaction state survives re-serialization.

**Provider routing.** `@cline/llms` is built ON the Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`, `@ai-sdk/gateway`, `@openrouter/ai-sdk-provider`, `LanguageModelV4`). Shape: a generated model catalog (`catalog/catalog.generated.ts` fed from models.dev data) + provider manifests + vendor handlers (`anthropic`, `openai`, `openai-compatible`, `google`, `bedrock`, `vertex`, `ollama`, `mistral`, `cline`, community) + a rules layer translating request intent/model facts into provider wire formats (`providers/routing/provider-option-rules.ts`, reasoning codecs, middleware like `split-tool-images`) + `wrapLanguageModel` middleware composition. Custom OpenAI-compatible endpoints are handled by `createOpenAICompatible` over a normalized, trailing-slash-trimmed `baseUrl` with Azure api-version query injection when the URL shape demands it. Their stated policy (llms AGENTS.md): models.dev catalog + AI SDK behavior are the sources of truth; no broad homegrown capability registry; only narrow, tested exceptions. `contextWindow` flows from provider settings into `maxInputTokens` for compaction math (`services/llms/provider-settings.ts`, `handler-factory.ts`).

**MCP integration.** Two generations in-tree: the VS Code `McpHub` (`apps/vscode/src/services/mcp/McpHub.ts` with OAuth manager, streamable-HTTP reconnect handler, timeouts, server enable/disable) and the newer SDK client under `core/extensions/mcp` (client, manager, OAuth, per-server policies, remote proxy, config-loader with change detection). An MCP marketplace exists (`controller/marketplace`, docs/mcp).

**Subagents (two-tier relevance).** `use_subagents` spawns parallel read-only research agents: own prompt, own context window and token budget; may read/search/list/run read-only commands; cannot edit files, browse, use MCP, or nest subagents; per-subagent token/cost tracked separately then rolled into the parent task total; launches follow the "Read project files" auto-approve permission (`docs/features/subagents.mdx`, `core/task/tools/subagent/`).

## 2. Tech stack

- Language/runtime: TypeScript end-to-end; Bun 1.3.13 as package manager/task runner, Node >= 22 runtime
- Monorepo: Bun workspaces (`sdk/packages/*`, `apps/*`); Biome lint/format; Vitest; Changesets; Husky
- LLM layer: Vercel AI SDK (`ai` v5-era `LanguageModelV4`), `@ai-sdk/openai-compatible`, `@ai-sdk/gateway`, `@openrouter/ai-sdk-provider`, patched `ollama-ai-provider-v2`
- Storage: SQLite (better-sqlite3 native dep listed) via SDK stores; session metadata JSON
- VS Code app: esbuild bundle, webview React UI, protobuf/gRPC-web style typed bridge (proto -> descriptor_set.pb)
- Desktop example app: Tauri v2 (Rust shell) + Next.js webview + Bun sidecar HTTP/WS backend (127.0.0.1:3125/3126); Tauri updater auto-update flow; login-shell PATH resolution for spawned processes
- MCP: official MCP SDK clients, streamable HTTP transport + OAuth
- Other: nanoid, axios/undici pinned, zod schemas throughout shared contracts

## 3. License

Apache License, Version 2.0 - declared in the repository root file `LICENSE` (standard Apache-2.0 text, January 2004 version). Permissive; pattern study is safe, but ACUTE-CODE policy remains patterns-only.

## 4. Top patterns worth adopting for ACUTE-CODE

**4.1 Typed ask/response gate with structured tool metadata (direct template for FR-6xx approval engine).**
What: a closed union of gateable events (`ClineAsk`-style), one response entry point (`yes/no/respond + attachments`), and rich per-tool payloads (path, unified diff, line ranges, outside-workspace flag, command string) rendered before approval. Granular auto-approve is per action category with a version counter for race-free settings updates; "yolo" mode is just the degenerate policy where every category is auto-approved.
Why: gives us exactly the approval-gates-as-only-safety-layer property we need, keeps the safety decision out of the agent loop (the loop merely awaits), and makes every approval auditable/replayable because requests and decisions are discrete typed objects.
Mapping: our sidecar owns the same role as Cline's extension host: emit `ApprovalRequest {toolCallId, toolName, input preview, diff, workspaceBoundary, riskClass}` over WS; UI answers through a single REST/WS endpoint. Our permission levels auto/confirm/blocked map onto their per-category toggles; add blocked-at-template level. Their file-based IPC variant proves the same protocol works across process boundaries if we ever need a second consumer.

**4.2 Layered provider abstraction on Vercel AI SDK with catalog + option-rules separation.**
What: `@cline/llms` separates (a) a generated model-capability catalog, (b) vendor handlers, (c) declarative provider-option rules/codec middleware that translate intent+model facts into each provider's wire format, all composed through AI SDK `wrapLanguageModel` middleware. Custom OpenAI-compatible base URLs are first-class with normalization quirks isolated in one place.
Why: it validates ACUTE-CODE's Vercel AI SDK bet at the highest-signal reference point - the leading open coding agent migrated its entire provider stack onto it. It also shows where AI SDK alone is not enough: cross-model reasoning-format codecs, image-in-tool-result splitting, cache-point placement (Bedrock), and per-model fact tables still need owning.
Mapping: adopt their three-layer split inside our provider module: generated catalog (models.dev import), thin vendor factories, named option-rules with tests including negative/degradation cases. Per-agent templates reference catalog entries, never raw provider configs; user-supplied OpenAI-compatible base URLs get the same trim/normalize/Azure-quirk treatment centrally.

**4.3 Session-state fencing + non-destructive context management.**
What: monotonic `seq` stamped on streamed messages plus an `epoch` fence dropped by the receiver; truncation recorded as `conversationHistoryDeletedRange` instead of deleting history; compaction keyed by stable prefix hash; checkpoints as cheap git stashes per run with numbered history surviving compaction.
Why: these four small mechanisms solve the exact failure class a long-running multi-agent workbench hits: duplicate/stale UI updates after reconnect or task switch, irrecoverable context loss, compaction state invalidation, and unsafe rollback. They are protocol-level fixes, cheap to implement early and painful to retrofit.
Mapping: our WS sidecar-to-UI contract gets `seq`/`epoch` from day one; our SQLite-owned transcripts keep full history with logical deletion ranges; per-agent memory compaction uses a prefix-hash key; sessions get a lightweight git-stash checkpoint before each worker run so Restore is always available even though approval gates are our only safety layer.

Honorable mention: subagent shape for our two-tier orchestrator - parallel read-only workers with separate budgets whose costs roll up into the parent, restricted toolset, nested spawning forbidden, launch itself gated by approval. This matches cap-5 worker tiers and our cost dashboard needs almost 1:1.

## 5. What to avoid and why

- **VS Code coupling / monolithic extension-host design.** Decades of VS Code-API assumptions made the extraction to CLI/desktop expensive (the whole sdk/ restructure and TaskProxy shims exist to undo it). ACUTE-CODE's sidecar-first architecture avoids this by construction - keep it that way: no host-API types in domain logic.
- **Two parallel implementations during migration.** The tree currently carries both the legacy McpHub/task classes and the new SDK equivalents, plus dual protocols (legacy JSON + proto bridge). Confusing, drift-prone, and doubles test surface. Pick one implementation per concern in ACUTE-CODE.
- **Homegrown model capability registries.** Cline explicitly warns against maintaining a broad capability registry (models.dev + AI SDK are truth). We should not hand-maintain model facts beyond narrow, tested overrides.
- **Freeform postMessage contracts.** The legacy JSON protocol needed `seq`/`epoch` patches to survive concurrency; untyped channels invite this. Use schema-generated, typed messages (their proto direction or our zod-over-WS) from day one.
- **File-polling IPC for approvals as the primary path.** Workable for a demo sidecar but adds latency (200 ms poll) and cleanup hazards (orphaned request files on crash). Fine as fallback; prefer push-based WS decisions.
- **Legacy field accretion.** AutoApprovalSettings retains dead `favorites`/`maxRequests`/legacy booleans "for backward compatibility" - noise that misleads readers. Schema-version migrations beat zombie fields.

## 6. Sources consulted

All read at commit `fb58e34` in `C:\Users\khurr\Desktop\KILO\_references\cline`:

- `README.md` (product surface: CLI, Kanban, VS Code extension, JetBrains, desktop)
- Root `package.json` (workspaces, Bun toolchain, patched deps), `sdk/packages/README.md`, `sdk/AGENTS.md`, `sdk/packages/llms/AGENTS.md`
- `LICENSE` (Apache-2.0)
- Approval/protocol: `apps/vscode/src/shared/ExtensionMessage.ts` (ClineAsk/ClineSay unions, seq/epoch), `apps/vscode/src/shared/AutoApprovalSettings.ts`, `apps/vscode/src/core/controller/task/askResponse.ts`, `sdk/packages/core/src/runtime/tools/tool-approval.ts`, `docs/features/auto-approve.mdx` (listed; granularity corroborated via settings source)
- Loop/orchestration: `sdk/packages/agents/src/agent-runtime.ts` (compaction overflow constants), `sdk/packages/core/src/runtime/*` (safety, tools, orchestration, turn-queue), `sdk/packages/shared/src/{extensions/context.ts,prompt/format.ts,cron,cron-spec-types.ts}` (act|plan|yolo), `docs/features/subagents.mdx`, `apps/vscode/src/core/task/tools/subagent/`
- Checkpoints: `sdk/packages/core/src/hooks/checkpoint-hooks.ts`, `core/session/checkpoint-{restore,diff}.ts`
- Context: `docs/features/auto-compact.mdx`, `core/runtime/config/agent-message-codec.ts`
- Providers: `sdk/packages/llms/src/providers/vendors/openai-compatible.ts`, `routing/*` (provider-option-rules, reasoning codecs), `catalog/*`, `core/services/llms/provider-settings.ts`, `handler-factory.ts`
- MCP: `apps/vscode/src/services/mcp/McpHub.ts` (+ siblings), `sdk/packages/core/src/extensions/mcp/*`
- Bridge: `apps/vscode/proto/*.proto` inventory, `apps/vscode/src/sdk/task-proxy.ts`
- Desktop analog: `apps/examples/desktop-app/README.md`, `sidecar/` layout, root AGENTS.md run notes

## 7. Open questions

1. How much of the classic per-tool approval UX (diff previews, command output streaming between ask/response pairs) already moved into the SDK runtime vs. remains VS Code-host code? The SDK `ToolApprovalRequest` payload currently carries only toolCallId/toolName/input - richer metadata (diffs, workspace-boundary flags) appears assembled host-side. Needs a follow-up pass on `runtime/tools/executors` before we freeze our FR-6xx schema.
2. Exact trigger threshold and prompt template for auto-compact (token fraction? reserved output?) - implemented in agents package internals not yet fully traced. Relevant to our per-agent memory design.
3. Meaning of the `"zen"` mode seen in automation schemas - undocumented; possibly a heads-down variant. [UNVERIFIED]
4. Whether the stash-based checkpoint mechanism handles non-git or multi-root workspaces (legacy shadow-git had special handling; new hook appears to assume a repo exists - degradation path not yet located).
5. Marketplace server-side contract (registry API shape, vetting) lives partly outside this repo; would need separate review if we mirror an MCP marketplace.
