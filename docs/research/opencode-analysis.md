# OpenCode — Reference Analysis

**Metadata**
- Date: 2026-08-22
- Canonical repo URL: https://github.com/anomalyco/opencode
  - Discrepancy note: the brief flagged `anomalyco/opencode` as possibly wrong and pointed to `sst/opencode`. Reality is the inverse: `https://github.com/sst/opencode` now resolves to (redirects into) **anomalyco/opencode** — the project was transferred from the SST org to the anomalyco org. The brief's URL is canonical and was used.
- Branch analyzed: `dev` (default branch; confirmed in repo AGENTS.md and GitHub UI). Snapshot version: app packages at 1.18.21, root `packageManager: bun@1.3.14`, Effect `4.0.0-beta.83`. Exact commit hash unavailable — see Open questions.
- Verification method: primary source snapshot downloaded as ZIP from codeload.github.com (`refs/heads/dev`, ~84 MB) after a shallow `git clone` timed out on this machine; studied locally at `_references\opencode-dev\`. Repo identity and README cross-checked via webfetch of both GitHub URLs.

---

## 1. Architecture overview (client-server split, process model, how clients connect)

OpenCode is a single TypeScript application with a strict client-server split. One binary, three run modes:

1. **TUI mode (default).** The server runs in-process alongside a TypeScript terminal UI (`@opencode-ai/tui`, built on the OpenTUI/SolidJS terminal framework) executed as an in-process worker thread. The CLI entry (`packages/opencode/src/cli/cmd/tui.ts`) proxies standard `fetch` calls and a global event subscription over RPC to that worker, so the TUI consumes exactly the same HTTP API a remote client would.
2. **Headless server mode.** `opencode serve` (`packages/opencode/src/cli/cmd/serve.ts`) starts only the HTTP server: "starts a headless opencode server". Clients attach over the network (`attach.ts` command, optional mDNS advertisement via `server/mdns.ts`). Port resolution: explicit port, else prefer 4096, else any free port. Instances are loaded per-request using an `x-opencode-directory` header rather than ambient startup state. Optional bearer-style auth via `OPENCODE_SERVER_PASSWORD` (warns loudly when unset).
3. **Embedded mode ("Embedded OpenCode").** Per CONTEXT.md: a scoped in-process host that executes the same assembled HTTP router through an in-memory `HttpClient`; "Networked and Embedded OpenCode use the same OpenCode Client ... only the HttpClient transport differs."

**Server core** (`packages/opencode/src/server/server.ts`): an Effect v4 typed HTTP API (`HttpApi`/`HttpApiGroup`/`HttpApiEndpoint` from `effect/unstable/httpapi`) served over a plain Node `http.Server`, with graceful shutdown, forced socket close on stop, CORS module, WebSocket tracker (WebSockets are gated/experimental; SSE is the primary stream transport), and OpenAPI generated from the public API.

**API surface**: endpoint groups declared under `packages/opencode/src/server/routes/instance/httpapi/groups/`: session, message-level ops inside session group, permission, provider, model, file/fs, config, agent, command, skill, mcp, pty, question, tui, workspace, project, event, global, control-plane, experimental. Example REST shapes (session group): `GET /session`, `GET /session/status`, `GET|POST|PATCH|DELETE /session/:sessionID`, `/session/:id/message` (list + POST prompt), `/session/:id/prompt_async`, `/command`, `/shell`, `/fork`, `/abort`, `/revert`, `/unrevert`, `/summarize`, `/todo`, `/diff`, `/session/:id/permissions/:permissionID` (reply to a permission ask), plus per-part message CRUD. Typed errors are declared per-endpoint (e.g. `SessionNotFoundError`, `SessionBusyError`). OpenAPI + SDKs are code-generated from this single declaration.

**Eventing — two deliberately different streams** (CONTEXT.md is explicit):
- `sessions.events({ sessionID, after })`: durable, replayable SSE stream per session; replays committed events after an aggregate sequence cursor and continues live. Resume = keep last sequence, reconnect with `after`.
- `/event` subscribe: instance-wide live-only broadcast (no replay guarantee); consumers recover by refreshing authoritative state and resubscribing. Neither stream auto-reconnects by design; reconnection policy lives above the generated client.
- A process-global in-memory bus (`src/bus/global.ts`, EventEmitter with ascending event IDs) feeds these streams; V2 adds durable event tables (see migrations `20260323234822_events.ts`, `20260604172448_event_sourced_session_input.ts`).

**Session lifecycle/state** (V2 runtime, documented in root `CONTEXT.md` + `AGENTS.md`): prompts are durably admitted as inbox rows before execution; a serialized runner promotes them into visible messages at safe provider-turn boundaries; steers vs queued inputs have distinct delivery semantics; interruption is idempotent; compaction opens a new "Context Epoch" with an immutable baseline system prompt reused verbatim across restarts (provider-cache friendly); oversized tool output is bounded in history with full text spilled to managed temp files.

## 2. Tech stack

- **Language/runtime:** 100% TypeScript on Bun (bun workspaces + turbo, `bun.lock`, `Bun.file()`, `bun:sqlite`). No Go remains in the dev branch.
- **Core framework:** Effect v4 beta (`effect@4.0.0-beta.83`) — services as Layers, typed errors, Schema for all wire/domain types, HttpApi for routing/validation/OpenAPI.
- **Persistence:** Drizzle ORM over SQLite. Dual drivers: `bun:sqlite` (`core/database/sqlite.bun.ts`, WAL configurable) and Node sqlite (`sqlite.node.ts`). DB file: `<global data dir>/opencode.db` (channel-suffixed for non-stable channels) — `packages/core/src/database/database.ts:53`. Rich migration history in `packages/core/src/database/migration/`.
- **AI providers:** Vercel AI SDK (`ai`, `@ai-sdk/provider` v3 language-model interface). Provider registry (`packages/opencode/src/provider/provider.ts`) lazily imports ~25 `@ai-sdk/*` packages plus OpenRouter/GitLab/Venice/Copilot providers from a `BUNDLED_PROVIDERS` map; model catalog fetched from **models.dev**; custom providers supported via config `{ npm: <package>, options: { baseURL, apiKey, headers, body } }` and an `openai-compatible` lowerer path; per-provider request transforms, SSE read-timeout wrapping, Azure/Vertex/Bedrock special-casing.
- **Clients/UI:** TUI = `@opencode-ai/tui` workspace package on OpenTUI (`@opentui/core|solid|keymap`) running as worker thread; Web/desktop app = SolidJS + Vite (`packages/app`); desktop shell = **Electron** (`packages/desktop`, electron-vite/electron-builder) — not Tauri.
- **SDK layering** (root AGENTS.md): `schema` (leaf wire types) → `core`/`protocol` → `server`; clients may depend only on Schema+Protocol, never Core/Server. Generated artifacts: legacy JS SDK (`packages/sdk/js`), new Promise + Effect clients (`packages/client`, zero-Effect root export + `/effect` subpath), composed embedded host (`packages/sdk-next`). Regenerated via `bun run generate`; never hand-edited.
- **Plugin system:** hook-based TS plugins (`plugin(input) => hooks`), user-installed from npm or local paths; built-in auth plugins (Codex, Copilot, GitLab, Cloudflare, Azure...) register through the same loader; plugins receive an opencode client instance.

## 3. License

**MIT License** — repo-root `LICENSE`, "Copyright (c) 2025 opencode". Standard MIT text, no additional terms. (Sub-packages repeat `MIT` in their package.json.) Pattern reuse is permissible for ACUTE-CODE including commercially; only verbatim code copying is unnecessary given our PATTERNS-ONLY rule anyway.

## 4. Top 2–3 patterns worth adopting for ACUTE-CODE — what/why/how-it-maps

### 4.1 Single-source-of-truth typed API + generated clients
- **What:** Every REST endpoint, query/body schema, success/error type, and SSE content-type is declared once in the server's HttpApi groups; OpenAPI doc and all client SDKs are generated artifacts with a hard dependency rule (clients import Schema/Protocol types only).
- **Why it matters to us:** ACUTE-CODE's React frontend ↔ Node sidecar contract is exactly this boundary. Adopting "declare once, generate the rest" eliminates drift between sidecar routes and frontend types as our agent/session/tool APIs grow, and the dependency-direction rule keeps the GUI decoupled from sidecar internals.
- **How it maps:** In our sidecar, define Zod schemas + route metadata once (e.g. tRPC-free plain REST via Fastify+zod-to-openapi, or Effect-adjacent alternatives without adopting Effect itself), commit generated TS client + openapi.json, and enforce in lint that frontend imports come only from the generated contract package — never from sidecar internals. Mirror their error discipline: every endpoint declares its domain errors explicitly (typed, documented), not ad-hoc status codes.

### 4.2 Two-tier event streaming: durable replayable session stream + live-only broadcast
- **What:** Per-session SSE with an opaque sequence cursor and guaranteed replay after disconnect (`after` parameter), versus an instance-wide live-only feed with explicit heartbeat/lifecycle events and documented refresh-and-resubscribe recovery. Reconnection policy deliberately lives in the client, not the transport.
- **Why:** Multi-agent orchestration GUIs live and die by event reliability. Our Tauri shell's WebSocket to the sidecar will drop (laptop sleep, dev reloads); cursor-based replay means the dashboard can resume agent transcripts token-exactly without refetching everything, while cheap global activity (usage ticks, orchestration state) uses the lossy channel.
- **How it maps:** Give each ACUTE-CODE session/agent run a monotonic event sequence persisted in SQLite alongside messages; expose `GET /sessions/:id/events?after=<seq>` as SSE (or WS with resume frame); publish a separate unacknowledged broadcast channel for global telemetry; write the reconnect-with-cursor logic once in the frontend store. Adopt their explicit stance: no silent auto-reconnect magic inside the transport; fail loudly, resubscribe deliberately.

### 4.3 Permission gate as first-class protocol object with ruleset evaluation
- **What:** `Permission.Request { id, sessionID, permission, patterns[], metadata, always, tool }`; wildcard rulesets evaluated last-match-wins into `allow | deny | ask`; `ask` publishes an event and blocks tool execution on a promise until the client replies (including corrected-input replies); `always` accumulates session-approved rules; pending asks fail-closed when the server shuts down; the permission retains the issuing turn's effective agent policy even if the user switches agents mid-flight.
- **Why:** This is precisely ACUTE-CODE's "approval gates as ONLY safety layer." Their design proves the pattern works as pure protocol: the tool loop awaits an external decision with no privileged in-process bypass, decisions are auditable events, and per-pattern granularity (not just per-tool) lets templates express e.g. "allow git status, ask git push."
- **How it maps:** Model our approval gates as DB-backed request records with states (pending/approved/denied/corrected/expired), evaluate template-defined permission levels (read/write/execute/network) against wildcard patterns before tool dispatch, block the tool promise on a reply API call, emit gate requests on the session event stream so the GUI renders them like any other message part, and support "always allow this pattern for this template" persistence.

*Honorable mention (multi-provider lens):* their provider registry validates our stack choices — models.dev-style external catalog for pricing/context limits, lazy dynamic import per provider SDK, uniform custom-provider escape hatch (`npm` package + `baseURL`/headers overrides + body defaults) which is exactly how our OpenRouter/Groq/NVIDIA presets and custom OpenAI-compatible entries should resolve. Steal the shape, not the code.

## 5. What to avoid and why

- **Effect-TS everywhere (v4 *beta*, no less):** the entire server is written in Effect generators/layers/schemas. Powerful but a massive learning-curve and hiring tax, and they are living through a major-version beta migration. ACUTE-CODE should take the architectural ideas (typed contracts, layered services) in plain TypeScript, not the framework.
- **Bun-runtime coupling:** `bun:sqlite`, `Bun.file`, bun-specific loaders pervade core. Our sidecar targets Node.js; use `better-sqlite3`/`node:sqlite` equivalents.
- **Legacy storage mid-migration:** OpenCode historically stored every entity as individual JSON files under a key-path directory layout and is still carrying migrations off it (`storage.ts` migrations, `normalize_storage_paths`, dual-read shims). Validates doing what we already planned: SQLite-first (WAL + Drizzle) from day one, no file-store era to migrate out of.
- **Electron desktop shell:** heavy runtime and a second packaging pipeline. We chose Tauri 2; nothing in their desktop layer transfers except the lesson that the web app talks only to the localhost server (good).
- **Infra-tangled subsystems:** share/sync/control-plane/console/enterprise/stats, mDNS discovery, cloud auth plugins — tied to their hosted infra and multi-user story; out of scope for a local-first single-user workbench.
- **Unsecured-by-default networking:** `serve` warns when no password is set; default port preference 4096. For us: bind 127.0.0.1 only, generate an ephemeral token per sidecar launch, never listen on LAN unless explicitly enabled.
- **Experimental-surface churn:** V2 session inbox/event-sourcing redesign, `sdk-next` vs legacy `sdk` coexistence, experimental WebSockets flag, `experimental.*` config namespace. Lesson: keep our public sidecar API small and stable; experiment behind flags, not in the contract.
- **Terminal-specific machinery:** OpenTUI/Solid-rendered terminal widgets, PTY ticket flow, worker-RPC fetch proxying — irrelevant to a GUI client; consume their concepts (streaming parts, permission prompts as message parts) not their rendering.

## 6. Sources consulted

Local snapshot `C:\Users\khurr\Desktop\KILO\_references\opencode-dev\` (branch `dev`, ZIP from codeload.github.com, downloaded 2026-08-22):
- Root: `README.md`, `LICENSE`, `AGENTS.md`, `CONTEXT.md`, `package.json`
- `packages/opencode/src/server/server.ts` — listener, port fallback, mDNS, shutdown
- `packages/opencode/src/cli/cmd/serve.ts`, `tui.ts` — headless mode; TUI-as-worker + RPC-proxied fetch/events
- `packages/opencode/src/server/routes/instance/httpapi/groups/session.ts`, `event.ts` (+ `AGENTS.md` route patterns) — REST surface, SSE declarations
- `packages/opencode/src/permission/index.ts` — ruleset evaluation, ask/reply Deferred gating
- `packages/opencode/src/provider/provider.ts` — BUNDLED_PROVIDERS map, models.dev catalog, baseURL/custom handling
- `packages/opencode/src/storage/storage.ts` — legacy JSON-file store + migrations
- `packages/core/src/database/` — `database.ts` (db path), `sqlite.bun.ts`/`sqlite.node.ts` (drivers, WAL flag), `migration/` (~38 migrations incl. events, session_input inbox, context epoch)
- `packages/core/src/v1/config/provider*.ts` — custom provider config shape (npm/baseURL/apiKey/headers)
- `packages/opencode/src/plugin/index.ts` — plugin hooks + built-in auth plugins
- `packages/schema/src/` listing — wire-type coverage (server-event, session-*, permission-v1, pty, ...)
- `packages/app/package.json`, `packages/desktop/package.json` — SolidJS web app; Electron shell
- Web verification: github.com/anomalyco/opencode (canonical, 200k stars, branch `dev`), github.com/sst/opencode (resolves to same repo)

## 7. Open questions

1. **Exact revision unpinned:** the codeload ZIP carries no `.git`, so the precise commit hash behind the analyzed tree is unknown (only branch `dev`, app version 1.18.21, date 2026-08-22). If byte-exact provenance ever matters, re-fetch a tagged release instead of `dev`.
2. **Where does `@opencode-ai/tui` source live?** It is imported as a `workspace:*` dependency but no such package exists in the snapshot's `packages/`. Possibly a separate repo post-transfer or excluded from the archive — [UNVERIFIED] either way.
3. **V1 vs V2 API transition end-state:** legacy generated JS SDK (`packages/sdk`) + `openapi.json` coexist with the new Protocol/IR-based clients (`client`, `sdk-next`); CONTEXT.md still lists open naming questions (`session` vs `sessions`). Which surface is the long-term contract is unsettled upstream — we should not anchor our own naming to theirs.
4. **Windows path normalization:** they canonicalize stored absolute paths to forward slashes and convert on read (`database/path.ts`). Worth watching their released Windows builds for edge cases before deciding whether ACUTE-CODE adopts the same convention in SQLite rows.
5. **Durable-event retention policy:** V2 persists session events for replay; no evidence in the snapshot of pruning/compaction of that table. If we copy the replayable-stream design, we must define our own retention/garbage-collection story up front.
