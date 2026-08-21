# Kilo Code - Reference Analysis

**Metadata**

- Date: 2026-08-22
- Repo: https://github.com/Kilo-Org/kilocode
- Branch/commit analyzed: `main` @ `ff74e2ea3fcd3a8fd43caf9751bbeaa3e30cead8` (merge of PR #11611, dated 2026-08-21)
- Verification method: shallow clone (`git clone --depth 1`) to `_references/kilocode`; all claims below read directly from source and in-repo docs unless marked [UNVERIFIED]. Patterns only; no code copied.

## 1. Architecture overview (incl. lineage deltas vs Roo/Cline)

Kilo Code has **pivoted off the Cline → Roo Code codebase lineage**. The current repo is a monorepo whose core is a fork of **opencode** (`packages/opencode`, published as `@kilocode/cli`; README FAQ and root `AGENTS.md` both state this). Every product is a thin client over one headless backend:

- **Core CLI/backend** (`packages/opencode/`): agent runtime, tools, sessions, MCP, LSP, config, Hono HTTP server with SSE + generated OpenAPI. Clients spawn or connect to a `kilo serve` process.
- **VS Code extension** (`packages/kilo-vscode/`): bundles the CLI binary, spawns `kilo serve --port 0`, reads the assigned port from stdout, auths with a random password passed via env var; sidebar chat plus **Agent Manager**.
- **JetBrains plugin** (`packages/kilo-jetbrains/`), **TUI** (SolidJS + OpenTUI), auto-generated TS SDK (`@kilocode/sdk`) shared by all clients.

Lineage deltas - what Kilo adds over the Roo/Cline base it grew from:

- **Rewritten core**: legacy Roo-style modes (`custom_modes.yaml`, `.kilocodemodes`, `roleDefinition`, tool `groups`) are auto-migrated on startup to the new "agent" format (`src/kilocode/docs/migration.md`). Default legacy slugs map to new built-ins (`code`→`build`, `architect`→`plan`).
- **Orchestrator mode deprecated**: the dedicated Roo-style orchestrator is scheduled for removal; any full-tool-access agent now delegates via the `task` tool ("Orchestrator mode ... redundant", migration.md). Subagents run as child sessions with isolated context and return a summary to the parent.
- **Agent Manager**: multi-session parallel orchestration inside VS Code - multiple independent sessions, each optionally isolated in its own git worktree, up to 4 parallel worktrees launched with the same prompt for A/B comparison, per-worktree setup script, state in `.kilo/agent-manager.json`. All sessions share ONE `kilo serve` backend; worktree scoping is done by passing a directory context, not by spawning per-worktree processes.
- **Skills system**: implements the open Agent Skills spec (agentskills.io) with discovery, trust tiers, remote URL loading (see §4.3).
- **Marketplace**: catalog maintained in a separate GitHub repo (`Kilo-Org/kilo-marketplace`); items are Agents/Skills/MCP servers shipped as plain config files installed at project (`.kilo/`) or global (`~/.config/kilo/`) scope, then discovered by the normal config system. No proprietary runtime coupling.
- **Provider gateway** (`packages/kilo-gateway/`): 500+ models via OpenRouter-based routing, account auth (device flow), balance/teams API; models registry from models.dev cached locally.
- **Organization-managed agents**: agents sourced from the org override built-ins for members and cannot be locally removed.
- **Cost propagation** (`src/kilocode/session/cost-propagation.ts`): each finished subagent propagates its cost into the parent assistant message (per-parent serialized read-modify-write), so parent totals already include descendant sessions recursively - direct feed for a usage dashboard.
- **Memory bank deprecated** in favor of AGENTS.md; per-directory AGENTS.md files are dynamically injected as `<system-reminder>` when the agent reads files in that subtree. A newer `kilo-memory` package adds project memory capture/recall/digest/redact.
- **Autonomous CI mode**: `kilo run --auto` disables all permission prompts.

## 2. Tech stack

- TypeScript everywhere; Bun workspaces + Turborepo monorepo.
- **Effect-TS** as the core runtime discipline in `packages/opencode` (services, layers, schemas); Zod/TypeBox-style schema validation at boundaries; namespace-module organization.
- Hono HTTP server, SSE events, OpenAPI spec generation feeding the auto-generated SDK clients.
- Vercel AI SDK as provider abstraction layer; model metadata from models.dev.
- UI: SolidJS (not React) for TUI (`@opentui/solid`) and webviews; shared component lib `@kilocode/kilo-ui` built on `@kobalte/core`; esbuild bundling; JetBrains plugin in JVM/Gradle alongside.
- Storage: filesystem JSON under `~/.local/share/kilo/storage/` for core session state (documented "Filesystem-based JSON, not a database"); Drizzle/SQLite packages exist in-tree (`effect-drizzle-sqlite`) but are not the documented primary session store [UNVERIFIED how widely SQLite is used].
- Telemetry: PostHog + OpenTelemetry; i18n across ~16 languages; docs site Next.js + Markdoc (`packages/kilo-docs`).

## 3. License (exact name + source file)

**MIT License** - file `LICENSE` at repo root: "Copyright (c) 2026 Kilo Code / Copyright (c) 2025 opencode". Permissive; commercial use allowed. Note the dual copyright reflecting the opencode fork.

## 4. Top patterns worth adopting for ACUTE-CODE

### 4.1 Unified permission rule engine (maps to our approval gates / auto-confirm-blocked)

- **What**: One engine covers everything. Three actions only - `allow` / `ask` / `deny`. Rules attach per permission key (tool type: `read`, `edit`, `bash`, `task`, `skill`, `webfetch`, MCP namespaced `{server}_{tool}`, ...) as ordered glob-pattern maps evaluated **last-match-wins** (`"*": "ask"` then `"git *": "allow"`). Layers merge field-wise: global defaults ← user config ← project config ← agent-specific overrides. Hard floors survive broad allows: `.env` reads always prompt even under `read: allow` (`.env.example` exempt); `external_directory` prompts; a `doom_loop` key gates continuing after repeated failures.
- **Why**: This is exactly ACUTE-CODE's auto/confirm/blocked triad, already battle-tested against edge cases we would rediscover painfully: bash strings parse into multiple commands and *one deny rejects the whole call*; saved runtime approvals append rules to the same config (single source of truth); subagent launch is itself a permission (`task` key) so delegation is approvable and allowlistable.
- **How it maps**: Implement one evaluator in the sidecar owning SQLite; every tool call and gate check resolves through it. Store rulesets per agent template and per project; render the same three actions in the approval-gate UI. Add our own "floor" concept for sensitive paths that `allow` can never bypass. Keep glob semantics simple and document last-match-wins.

### 4.2 Agent templates = markdown persona + declarative caps (validates our agent registry fields)

- **What**: An agent is a `.md` file with YAML frontmatter (or an equivalent config-file entry). Fields observed in the `Agent.Info` schema and docs: `description` (shown in picker AND used by parents to route delegation), `prompt` (markdown body = system prompt), `mode: primary | subagent | all` (user-selectable vs invokable-only vs both), `permission` ruleset (incl. `task` glob allowlists restricting which subagents it may spawn), `model` pin (`provider/model-id`), `temperature`/`top_p`/`variant`, `steps` (hard cap on agentic iterations before forcing text-only response - runaway/cost guard), `hidden`, `disable`, cosmetic `color`. Precedence merges field-wise from built-in < global < project < `.kilo/` files < env var; overriding a built-in replaces only the fields you set. Filename = name; nested dirs create namespaces (`backend/sql`).
- **Why**: Confirms ACUTE-CODE's planned registry shape with production-grade field choices we hadn't pinned down: `mode` cleanly separates Orchestrator-selectable personas from worker-only ones; `description` doubles as the delegation-routing contract; `steps` gives per-template budget control; `permission.task` globs give an orchestrator an explicit worker allowlist instead of "can spawn anything".
- **How it maps**: Our user-editable agent templates become markdown+frontmatter files discovered from global/project dirs with field-wise merge. For our two-tier orchestration: mark the Orchestrator `primary`, workers `subagent`, enforce cap-5 concurrency ourselves (Kilo does NOT bound breadth - see §7), use `permission.task: {"*": "deny", "<worker>": "allow"}` per orchestrator template, and adopt `steps` as a second budget dimension next to token caps. Adopt their child-session invariants too: subagent result returns as one summary message; resumable child ids must be validated as children of the current parent (they explicitly reject cross-session resume).

### 4.3 Minimal skills format with trust tiers + remote manifest (v1 folder format that grows into a marketplace without rework)

- **What**: Skill = folder with `SKILL.md` (YAML frontmatter: required `name` ≤64 chars kebab-case matching the dir name, `description` ≤1024 chars; optional `license`, `compatibility`, `metadata`; optional bundled `scripts/ references/ assets/`). Discovery at session start reads ONLY frontmatter into the system prompt; the body loads on demand when the model decides the description matches (explicit "use skill X" always works). Locations: `~/.kilo/skills/` (global) and `.kilo/skills/` (project wins on name clash), plus compatibility dirs (`.claude/skills/`, `.agents/skills/`). Growth path already built: `skills.paths` extra dirs and `skills.urls` remote URLs serving an `index.json` manifest `{name, version, files[]}` with versioned atomic cache replacement (keep old copy if any download fails). Trust tiers: embedded shell commands (`` !`cmd` `` placeholders) execute ONLY for trusted sources (global dirs, compiled-in skills, globally-configured absolute paths) and even then behind one bundled approval prompt listing every command; project and remote skills never execute them; kill-switch env var; output never re-scanned. Built-in skills compile into the binary and register first so user skills shadow them by name.
- **Why**: This is the minimal-enough-for-v1 shape ACUTE-CODE wants, with the marketplace evolution pre-designed: because items are plain folders plus a versioned manifest protocol, the later marketplace is just distribution over the same discovery contract - no format rework. The trust-tier model solves the obvious security hole before it exists.
- **How it maps**: v1 = SKILL.md folders + frontmatter-only discovery + on-demand load through a single `skill` tool gated by the §4.1 engine. Define the remote `index.json` manifest contract NOW (name/version/files) even if v1 ships local-only. Copy their stance: project-sourced skills never run embedded commands without explicit trust grants; never re-scan command output.

Honorable mention: **cost propagation to parent messages** - roll each worker's spend into its parent task record so the usage dashboard shows true per-task totals including subagent descendants (serialize concurrent updates per parent).

## 5. What to avoid and why

- **Editor coupling**: Kilo lived this lesson - its Roo-derived extension-first architecture was replaced by a headless backend with thin clients; JetBrains parity and multi-project Agent Manager migrations show the ongoing tax. ACUTE-CODE's Tauri shell + sidecar already follows the better shape; keep ALL agent logic out of the UI layer.
- **Effect-TS-style framework gravity in core**: the repo carries extensive internal guard scripts, ratchets, annotation checks, and style laws just to keep the Effect/fork complexity manageable. Fine at Kilo's team size; for us it is dependency and cognitive overhead with no user-visible payoff - prefer plain TypeScript modules in the sidecar.
- **Feature sprawl**: cloud agents, always-on agent hosting, Slack/mobile/Linear integrations, autocomplete, speech-to-text, screenshot testing infrastructure... The platform ambition constantly leaks into the core repo. Guard ACUTE-CODE's v1 scope (templates, orchestration, approvals, skills, MCP, dashboard) aggressively.
- **Fork-of-a-fork maintenance debt**: `kilocode_change` markers, mirror-file conventions, upstream merge choreography, zdiff3 conflict policy - the entire fork-management apparatus exists because they forked opencode while still carrying Roo-era concepts. Closed-source ACUTE-CODE should own its core rather than track an upstream.
- **Dedicated Orchestrator mode**: deprecated upstream precisely because a special-mode orchestrator adds a mode switch users must remember. Bake delegation into base capability; keep our distinction as *policy* (cap-5, allowlists) not as a special persona the user must activate.
- **Unbounded subagent breadth**: Kilo relies on prompt guidance ("launch multiple agents concurrently whenever possible") with no hard parallelism cap in the CLI core; background subagents sit behind an experimental flag. We deliberately differ with a hard cap of 5 - implement ours in the sidecar scheduler, not in prompts.
- **Bespoke memory rituals**: the memory bank feature was deprecated in favor of standard AGENTS.md files. Do not invent a proprietary memory-file ceremony; support standard instruction files plus optional indexed recall later.

## 6. Sources consulted

All under `_references/kilocode/` @ `ff74e2e`:

- `README.md`, `LICENSE`, `CONTEXT.md`, root `AGENTS.md`
- `AGENTS.md` in `packages/opencode/` and `packages/kilo-vscode/` (architecture, products, storage, fork rules)
- Docs (`packages/kilo-docs/pages/`): `customize/custom-modes.md`, `customize/custom-subagents.md`, `customize/agent-permissions.md`, `customize/skills.md`, `customize/marketplace.md`, `customize/agents-md.md`, `code-with-ai/agents/orchestrator-mode.md`, `getting-started/settings/auto-approving-actions.md`
- Source: `packages/opencode/src/tool/task.ts` + `task.txt`, `src/agent/agent.ts`, `src/kilocode/docs/migration.md`, `src/kilocode/skills/builtin.ts`, `src/kilocode/session/cost-propagation.ts`, `src/mcp/catalog.ts`, `src/kilocode/mcp/apps.ts`
- Package metadata: `packages/kilo-memory/package.json`, `packages/` directory survey
- Referenced external repos NOT fetched: `Kilo-Org/kilo-marketplace`, upstream opencode

## 7. Open questions

1. Is there ANY breadth limit on concurrent subagents in the CLI core? Found none (docs actively encourage unbounded parallel launches); Agent Manager caps parallel worktrees at 4. Our cap-5 remains a deliberate divergence. [UNVERIFIED beyond files read]
2. How much SQLite/Drizzle is actually used in production paths given core storage is documented as filesystem JSON (`effect-drizzle-sqlite` package exists)? Not traced.
3. Marketplace catalog schema lives in the separate `kilo-marketplace` repo (not cloned) - item card fields, prerequisites, review process unknown.
4. Provider profiles: named-provider-profile switching is largely a LEGACY extension concept; the new platform maps it to plain `provider` config + gateway accounts (migration marked Phase 2). Exact current UX unresolved.
5. Organization-managed agent sync appears to require a Kilo cloud account - implications for our local-first constraint unexamined.
6. `kilo-memory` capture/recall quality, storage layout, and whether it ships enabled by default - not deeply reviewed.
