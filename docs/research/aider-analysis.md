# Aider - Reference Analysis

**Metadata**

- Date: 2026-08-22
- Repo URL: https://github.com/Aider-AI/aider
- Branch/commit analyzed: `main` @ `5dc9490bb35f9729ef2c95d00a19ccd30c26339c` (commit dated 2026-05-22), shallow clone at `C:\Users\khurr\Desktop\KILO\_references\aider`
- Verification method: direct read-only inspection of cloned source (aider/, aider/coders/, aider/website/docs/) and README; all file:line claims below were read in the clone. Benchmark numbers are project-reported and marked accordingly. No code copied; patterns only.
- Purpose: reference analysis for ACUTE-CODE Phase 0 — git-integrated code-editing quality patterns for our Coder agents (Tauri 2 + React + Node/TS sidecar + Vercel AI SDK). Aider is Python/CLI, so this is a *patterns* study only.

## 1. Architecture overview

Single-process Python CLI application ("AI pair programming in your terminal"). Core layers:

- **Coder core** (`aider/coders/base_coder.py`, ~2,485 lines): one god-class `Coder` owning the chat loop, context assembly, edit application, git commit orchestration, lint/test hooks, caching, cost accounting, and TUI interaction via an injected `io.InputOutput`. Per-turn pipeline in `send_message()` (base_coder.py:1419): format messages → token check → warm cache → streaming LLM call with exponential-backoff retries → parse edits from the reply (`apply_updates`, base_coder.py:2296) → apply edits → auto-commit change set → lint edited files (+ second commit) → offer shell commands → optional test run. Failures become `reflected_message`s fed back to the model inside a bounded loop (`run_one`, max 3 reflections, base_coder.py:924–944).
- **Edit formats as subclasses** (`aider/coders/*`): each format is a small subclass overriding `get_edits()` (parse LLM text into edit ops) and `apply_edits()` (apply them): whole-file (`wholefile_coder.py`, edit_format `"whole"`), search/replace blocks (`editblock_coder.py`, `"diff"`, git-conflict-marker style), unified diffs (`udiff_coder.py`, `"udiff"`), plus variants: `diff-fenced` (Gemini), function-call forms, streamlined `editor-*` formats, and a newer OpenAI-`apply_patch`-style patch coder (`patch_coder.py`) that tracks "fuzz" during application. Format selection is per-model, hardcoded in `aider/models.py` (~line 439+): modern models get `"diff"`, GPT-4-Turbo era gets `"udiff"` (to fight lazy coding), weak/unknown models fall back to `"whole"`.
- **Git layer** (`aider/repo.py`, `GitRepo` over GitPython): repo discovery up the tree, tracked-file listing, `.aiderignore` filtering, diffing, committing, attribution.
- **Repo map** (`aider/repomap.py`): tree-sitter def/ref tag extraction (via `grep-ast` / `tree-sitter-language-pack`, SQLite-backed tags cache with dict fallback), weighted referencer→definer graph in networkx, personalized PageRank, then token-budgeted rendering of top-ranked files/symbol signatures.
- **Quality hooks**: `aider/linter.py` (per-language lint commands or built-in tree-sitter-based basic lint + flake8 for Python; output rendered with TreeContext snippets around error lines) and `--test-cmd` execution after edits.
- **Two-model economics** (`models.py`): main model, cheap `weak_model` (commit messages, chat summaries), optional `editor_model` + `editor_edit_format` used by architect mode.
- **Architect pattern** (`coders/architect_coder.py`): a strong "planner" model produces a plain-text change plan; on confirmation a second throwaway Editor Coder instance converts it to concrete edits with a narrow prompt (repo map disabled, shell suggestions off).
- **Prompt-cache management** (`coders/chat_chunks.py` + `warm_cache`, base_coder.py:1340): stable chunk ordering (system → examples → readonly files → repo map → done messages → editable files → current turn → reminder); Anthropic-style ephemeral `cache_control` markers on chunk boundaries; a daemon thread pings the API (`max_tokens=1`) every ~5 min (default 295s, env-tunable) up to N pings to prevent cache expiry.
- CLI/TUI (`io.py`, `commands.py`, `main.py`) is interleaved throughout rather than separated.

## 2. Tech stack

- Language/runtime: Python >=3.10,<3.15 (`pyproject.toml`); console entry point `aider = aider.main:main`.
- LLM access: **LiteLLM** 1.82.3 (multi-provider routing/retries) + openai client; tiktoken for counting.
- Git: **GitPython** 3.1.46.
- Repo map: **networkx** 3.4.2 (PageRank), **tree-sitter-language-pack** / grep-ast (tags across 100+ languages), SQLite (tags cache).
- Fuzzy patching: **diff-match-patch** 20241021 (used inside `search_replace.py` fallback strategies).
- UI: prompt-toolkit + rich (terminal); no GUI server in this repo (legacy `gui.py` references Streamlit [UNVERIFIED — not exercised here]).
- Misc: pathspec (gitignore semantics), posthog/mixpanel (opt-out analytics), watchfiles (IDE watch mode), tqdm.
- Packaging: setuptools + setuptools_scm; pytest test suite under `tests/`.

## 3. License (exact name + source file)

- **Apache License, Version 2.0** — full text in `LICENSE.txt` (202 lines) at repo root; also declared in `pyproject.toml` classifier "License :: OSI Approved :: Apache Software License".
- Implication for ACUTE-CODE: permissive; patterns/ideas are reusable without obligation. Copying actual code would require preserving notices — we copy nothing (patterns only).

## 4. Top patterns worth adopting for ACUTE-CODE

### 4.1 Pluggable edit-format layer with graded failure recovery + bounded reflection

- **What**: Edits arrive as a *text protocol* chosen per model capability. Application is never trust-once: parse → dry-run → apply with escalating fallbacks → if anything fails, build a structured error report and reflect it back to the model, capped at 3 retries (`max_reflections`). Concretely:
  - Search/replace blocks (`editblock_coder.py:41–125`): exact match first; retry against other in-chat files (catches wrong-path mistakes); on failure emit the failed block verbatim plus a "Did you mean to match these actual lines?" nearest-match excerpt (`find_similar_lines`) and a warning when the REPLACE text is already present (no-op detection).
  - Fuzzy ladder (`search_replace.py:547–577`): three strategies (plain search/replace, git-cherry-pick-style re-alignment, diff-match-patch line apply) × preprocessing variants (strip blank lines, relative-indent normalization), tried most-literal-first.
  - Udiffs (`udiff_coder.py:151–240`): direct hunk apply → re-align hunk against actual file content by back-diffing → partial-hunk application dropping context lines until it fits; distinct errors for no-match vs non-unique match.
  - Malformed parses increment `num_malformed_responses` and feed the exception text back as the reflection message (base_coder.py:2305–2316).
- **Why**: This is the single biggest determinant of "agent actually lands clean edits" quality. It decouples model eloquence from repository correctness and turns bad edits into self-correcting loops instead of corrupted files.
- **Mapping to ACUTE-CODE**: Implement as a TS module behind our Coder tool interface: an `EditFormat` interface (`parse(reply) -> Edit[]`, `dryRun`, `apply`) with implementations (whole-file, SEARCH/REPLACE blocks, udiff; optionally Vercel-AI-SDK tool-calls as a fourth format). Our Reviewer role consumes the structured failure report (failed block + nearest-match suggestion + already-applied detection) rather than raw stderr; Orchestrator enforces the ≤3-reflection budget per turn and escalates to human approval when exhausted. Dry-run + diff preview feeds our approval gates before any write.

### 4.2 Git safety envelope: snapshot-before-edit, atomic scoped commits, guarded undo

- **What**: A strict commit discipline around every agent edit cycle (`base_coder.py` `prepare_to_edit`/`check_for_dirty_commit`:2175, `auto_commit`:2375; `repo.py` `commit`:131):
  1. Before touching any dirty file, commit the user's pre-existing changes separately ("keeps your edits separate from aider's", docs/git.md) so `/undo` can never destroy user work.
  2. After applying an edit batch, create exactly one auto-commit containing **only the touched paths** (`git add <fnames>; git commit -- <fnames>`, repo.py:280–287) — never `-a` sweeps of unrelated dirt.
  3. Commit message generated by the cheap weak model from the diffs + conversation context, one line, Conventional Commits style, imperative, ≤72 chars (`prompts.py` commit_system; `repo.py get_commit_message`:326), with graceful multi-model fallback.
  4. Attribution: "(aider)" author/committer suffix or Co-authored-by trailer via env vars, configurable.
  5. Undo safety (`commands.py cmd_undo`:553–621): refuse unless the head commit was made by the agent this session (tracked hash list), has a single parent, none of its changed files carry new uncommitted modifications, files existed in the parent commit, and the commit hasn't been pushed to origin.
- **Why**: Gives crash-safe, reviewable, reversible agent history and makes "destructive operation" checks mechanical instead of heuristic.
- **Mapping to ACUTE-CODE**: Our sidecar owns git. Adopt as the transactional unit of the Coder workflow: pre-flight snapshot commit of dirty state (or stash-equivalent), one scoped commit per approved change set with sidecar-generated conventional message (cheap model call), and an undo endpoint with the same five guards — mapping naturally onto our approval gates (approve diff → commit; reject → nothing happened; undo → revert last agent-scoped commit). The pushed-commit guard is exactly the destructive-op check we want before any reset/revert.

### 4.3 Ranked, token-budgeted repo context (repo map) for worker routing

- **What** (`repomap.py`): extract def/ref tags per file with tree-sitter (cached in SQLite keyed by file mtime); build a directed graph file→file where each reference to a symbol defined elsewhere adds a weighted edge; boost weights ×50 when the referencing file is in the active chat, ×10 for identifiers mentioned in the conversation or long multi-word names, dampen private (`_`-prefixed) and multiply-defined symbols, sqrt-scale high-frequency mentions; run personalized PageRank with personalization mass on chat/mentioned files; distribute node rank across out-edges to rank individual definitions; render the top entries as a compact signature outline within a token budget (~1k default, expanded when the chat is empty, capped against the context window minus padding).
- **Why**: Answers "which files/context matter right now" cheaply and deterministically, without embedding infrastructure, and stays fresh via incremental tag caching.
- **Mapping to ACUTE-CODE**: This is a blueprint for our Orchestrator's routing-context builder: same tag-graph/PageRank scoring in TS (or via a bundled tree-sitter binding) to decide which file locations and symbol signatures accompany each Coder/Tester worker prompt, personalized by the current task's mentioned files/identifiers, hard-budgeted in tokens. Also informs our Reviewer's blast-radius estimate (which other files reference what we're about to touch).

### Honorable mentions (secondary, adopt opportunistically)

- **Post-edit verify-and-fix loop as Tester seed**: after edits, automatically lint touched files (second scoped commit "Ran the linter") and optionally run a user-configured test command (non-zero exit + stdout/stderr = errors); errors become reflection prompts asking the model to fix (base_coder.py:1599–1623; linter.py renders TreeContext snippets around error lines, linter.py:111–116). Maps directly to our Tester role contract: command contract is "print errors, exit non-zero."
- **Prompt-cache-friendly history layout + keepalive**: immutable-prefix chunk ordering with explicit cache breakpoints between volatile sections, plus optional keepalive pings (`max_tokens=1` every ~5 min, bounded count) during long user think-time (chat_chunks.py:28–63; base_coder.py:1340–1389). Our sidecar should order system/tools/project-map/files identically per session and track cache hit/write tokens in cost accounting (their pricing math uses 1.25× write / 0.10× hit multipliers, base_coder.py:2095–2096).
- **Planner/editor split (architect mode)**: strong model proposes a plan in prose; a cheaper editor model with a narrowed prompt converts it to edits with repo map disabled (architect_coder.py:11–47), gated by a confirm. Precedent for our Orchestrator→Coder division of labor and for using different models per role.

## 5. What to avoid and why

- **TUI/logic coupling**: `io.InputOutput.confirm_ask()` prompts are sprinkled through core flow (e.g., lint/test fix decisions base_coder.py:1604/1620, shell command gating :2456). Interactive blocking confirms don't exist in a desktop app with async approval queues — invert it: our sidecar emits pending-approval events over WS and awaits resolution. Do not port the callback-into-core shape.
- **God-class core**: `base_coder.py` (~2.5k lines) mixes orchestration, IO, git, caching, analytics, and formatting, with mutable class attributes shared across instances (base_coder.py:89–123) — a known source of cross-session leakage bugs. Keep our Coder concerns split (protocol parsing / applier / git txn / verifier) even though Aider's outcomes are good.
- **Sync threading & sleep-loop keepalive**: background Timer threads with 1-second polling loops (repomap progress, cache warming) fit a CLI, not our Node sidecar; use proper timers/schedulers and keep the design single-threaded-per-session.
- **Hardcoded per-model settings table**: `models.py` selects edit_format/reminder/weak-model via long if-chains on model name strings; new models require source edits. Prefer declarative model metadata (config-driven) compatible with Vercel AI SDK provider info.
- **Text-fenced protocols as the only channel**: Aider's formats are markdown-fenced text protocols parsed with regexes/heuristics (and lots of accumulated edge-case handling, e.g., bogus directory prefixes in wholefile, fence-width drift base_coder.py:77–85). With tool-calling-capable models, prefer structured tool calls for edits and keep fenced formats as fallback for weaker/local models — don't inherit the regex archaeology.
- **LiteLLM-centric assumptions**: retry taxonomy, exception mapping (`exceptions.py`), and provider quirks are LiteLLM-specific; not portable to the AI SDK.
- **Telemetry/analytics surface** (posthog/mixpanel, versioncheck phoning home): contrary to local-first privacy posture; omit entirely.
- **Silent fuzzy application risk**: cherry-pick/DMP fallbacks can apply edits with real divergence from intent (they track "fuzz" in patch_coder but the classic editblock path reports only on total failure). Anything beyond exact-match success must be surfaced to our Reviewer/approval UI as "fuzzy match applied — inspect diff," never silently committed.
- **Benchmark claims as requirements**: README badges (6.8M installs, 15B tokens/week, "88% singularity") and polyglot leaderboard results are project-reported marketing/benchmark data, not independently verified here [UNVERIFIED].

## 6. Sources consulted

All read-only from the clone at `_references/aider` (@ `5dc9490b`):

- `README.md` (feature claims, badges)
- `LICENSE.txt`, `pyproject.toml`, `requirements.txt`
- `aider/coders/base_coder.py` (send loop, reflections, apply_updates, auto_commit, warm_cache, lint/test hooks)
- `aider/coders/editblock_coder.py`, `search_replace.py`, `udiff_coder.py`, `wholefile_coder.py`, `patch_coder.py`, `architect_coder.py`, `chat_chunks.py`
- `aider/repo.py` (GitRepo.commit, get_commit_message, get_diffs), `aider/commands.py` (cmd_undo/cmd_diff/cmd_commit), `aider/linter.py`, `aider/repomap.py`, `aider/models.py`, `aider/prompts.py`
- `aider/website/docs/`: `more/edit-formats.md`, `repomap.md`, `git.md`, `usage/caching.md`, `usage/lint-test.md`, `usage/modes.md` (referenced), `leaderboards/index.md`
- Web (for context, not analyzed in depth): https://github.com/Aider-AI/aider

## 7. Open questions

1. How much do the fuzzy fallbacks (cherry-pick/DMP, partial hunks) silently distort edits in practice vs. failing loudly? We need a policy: does ACUTE-CODE allow fuzzy-applied edits to reach the approval diff automatically, or flag them?
2. For modern tool-calling models via Vercel AI SDK, do structured edit tool-calls outperform Aider's fenced SEARCH/REPLACE protocol enough to make tool-calls the primary format? Aider's own leaderboard tracks "correct edit format" per model, suggesting the answer is model-specific — needs empirical testing with our stack.
3. Repo-map PageRank recomputation cost per turn on large monorepos (Aider caches ranked maps and tag graphs in SQLite); what refresh cadence and cache invalidation does our TS implementation need to stay interactive?
4. Exact translation of `confirm_ask` gates into async approvals: which points in the edit→commit→lint→test pipeline may proceed unattended (with auto-commit) and which must pause for the user without breaking the sequence?
5. Are there GPL-contaminated components anywhere we might mirror structurally? (Checked direct deps: networkx BSD, diff-match-patch Apache, GitPython BSD, tree-sitter MIT — fine for pattern reuse; no code will be copied regardless.)
6. Aider commits skip pre-commit hooks by default (`--no-verify`, repo.py:278–279, docs/git.md:43). Should ACUTE-CODE agent commits run project hooks (slow, may mutate) or bypass them like Aider?
