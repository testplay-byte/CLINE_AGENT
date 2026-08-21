# MetaGPT — Reference Analysis

Metadata:
- Date: 2026-08-22
- Repo: https://github.com/FoundationAgents/MetaGPT (verified live via HTTP fetch and git). Move history: originally `github.com/geekan/MetaGPT`; now under the `FoundationAgents` org (old URLs redirect; README still contains stale `geekan/MetaGPT` install links, confirming the move). Exact move date not determined [UNVERIFIED].
- Branch/commit: `main` @ `11cdf466d042aece04fc6cfd13b28e1a70341b1f` (2026-01-21, "Merge pull request #1897 from Ruyuan37/windows_terminal_adaptation"); ~6,367 commits, 69.9k stars at time of access.
- Verification method: shallow partial clone (`git clone --depth 1 --filter=blob:none` + sparse checkout of `metagpt/`, `docs/`, `examples/`, README, LICENSE) into `_references/metagpt`; all claims below from direct reads of local files unless marked [UNVERIFIED]. Full-clone timed out twice (slow transfer), so blob-filtered clone was used — same commit as `ls-remote` main head.

## 1. Architecture overview (role/agent classes, environment, message pool, subscription flow)

**Role = system prompt + allowed actions + watch list.** `metagpt/roles/role.py` defines `Role`, a pydantic model with: identity fields (`name`, `profile`, `goal`, `constraints`, `desc`), an `actions` list, and a `RoleContext` holding per-role runtime state: private inbound `msg_buffer`, `memory`, `working_memory`, current `state`/`todo`, a `watch: set[str]`, and a react mode (`REACT` | `BY_ORDER` | `PLAN_AND_ACT`) with `max_react_loop`. The system prompt is composed mechanically from a template: "You are a {profile}, named {name}, your goal is {goal}. the constraint is {constraints}." plus a one-line environment description naming the other roles. A role's lifecycle is `run()` = `_observe()` -> `react()` (`_think` -> `_act`) -> `publish_message()`. `_observe()` pops its private buffer, keeps only messages whose producer type is in `watch` (or addressed to it), and de-duplicates against its own memory. `_think()` selects the next action: trivial if one action; otherwise an LLM call returns a state index (STATE_TEMPLATE asks for a bare number); BY_ORDER just walks actions in sequence.

**Messages carry their own routing metadata.** `metagpt/schema.py::Message`: `content`, `role`, `cause_by` (string name of the Action class that produced it), `sent_from`, `send_to` (set of role addresses; default ALL), plus optional structured payload `instruct_content`. Routing info lives on the message, not in a central table (their RFC 116/113 design).

**Environment = address book + fan-out + shared history.** `metagpt/environment/base_env.py::Environment` holds `roles`, `member_addrs` (role -> set of addresses), and a full `history` Memory "for debug". `publish_message(msg)` copies the message into each matching role's private buffer (`put_message`) and warns on "no recipients"; there is no broker thread. `run(k=1)` executes one synchronous round: `asyncio.gather` over all non-idle roles' `run()`.

**Message pool / memory.** No central pool object: `metagpt/memory/memory.py::Memory` is a list of messages plus an index keyed by `cause_by`; `important_memory = memory.get_by_actions(watch)` reconstructs each role's relevant context from what it observed. Dedupe is by message equality.

**Subscription flow / newer TeamLeader layer.** Two generations coexist:
- Classic fixed-SOP roles subscribe by action type, e.g. ProductManager watches `[UserRequirement, PrepareDocuments]`, Architect watches `{WritePRD}`, ProjectManager watches `[WriteDesign]`, Engineer watches `[WriteTasks, SummarizeCode, WriteCode, WriteCodeReview, FixBug, WriteCodePlanAndChange]`, QaEngineer watches `[SummarizeCode, WriteTest, RunCode, DebugError]`.
- Newer default (`Team(use_mgx=True)`) uses `MGXEnv` (`environment/mgx/mgx_env.py`): every regular message is force-routed through a TeamLeader ("Mike", `roles/di/team_leader.py`, a `RoleZero` whose only registered tool is `publish_team_message`) which decides delegation/recipients; direct @role chats bypass TL; `ask_human`/`reply_to_human` tools implement human-in-the-loop. `RoleZero` (`roles/di/role_zero.py`) is the dynamic "think and act with tools" agent generation (tool registry, BM25 tool recommendation); classic SOP behavior survives behind a `use_fixed_sop` flag.

**SOP artifact chain.** Fixed pipeline PM -> Architect -> ProjectManager -> Engineer(s) -> QA produces typed artifacts persisted to a repo layout (`const.py`): `docs/prd`, `docs/system_design`, `docs/task`, `docs/code_plan_and_change`, `tests/`, `docs/code_summary`. Messages reference file paths/names rather than embedding full file content (RFC 135); SOP roles run with `enable_memory=False` because state lives in the repo files, not chat history.

**Structured outputs & gates.** `actions/action_node.py` composes pydantic node trees rendered into prompts as "format example" + typed node instructions inside a TAG wrapper, then extracts/repairs LLM output; built-in `ReviewMode`/`ReviseMode` = HUMAN or AUTO review/revise loops around each action.

**Team orchestration & budget.** `team.py::Team`: `hire(roles)` into env; `invest($)` sets `cost_manager.max_budget`; `run(n_round)` loops rounds, checks balance (raises `NoMoneyException`), stops when all roles idle; whole team serializes/deserializes to JSON for pause/resume. External triggers use `subscription.py::SubscriptionRunner` (async trigger generator -> `role.run(msg)` -> callback), e.g. watching GitHub issues.

## 2. Tech stack

Python 3.9-3.12; pydantic v2 models everywhere (roles, messages, config, actions are all BaseModel subclasses); asyncio concurrency (no threads/queues beyond asyncio primitives); pluggable LLM providers (`provider/`: OpenAI/Azure/Ollama/Groq/etc.) behind one `BaseLLM`; typer CLI; workspace state persisted as JSON snapshots + a real git repository per project (`GitRepository`/`ProjectRepo`); optional extras: `rag/`, `document_store/`, gymnasium spaces for game environments (Minecraft/Werewolf/StanfordTown), Node/pnpm only needed by some examples. No SQL database anywhere.

## 3. License (exact name + source file)

Exact license text (file `LICENSE`, repo root, commit `11cdf466d042aece04fc6cfd13b28e1a70341b1f`): "The MIT License" — "Copyright (c) 2024 Chenglin Wu". Standard MIT grant. GitHub badge confirms MIT.
Compatibility implications for ACUTE-CODE: MIT is permissive, NOT copyleft (contrary to our earlier suspicion — recorded here exactly as found). Pattern adoption carries no license obligation; even verbatim code reuse would only require preserving the copyright notice, which we avoid anyway under our patterns-only rule. No contamination risk for our closed-source product. Vendored third-party bits (e.g., `mineflayer` examples) carry their own MIT LICENSE files.

## 4. Top 2–3 patterns worth adopting for ACUTE-CODE — what/why/how-it-maps

1. **Declarative role profile: prompt + allowed actions/tools + watch list** (`Role._watch`, PREFIX_TEMPLATE).
   What: a role is data — identity text, a capability list, and a subscription filter — interpreted by one generic engine loop (observe/think/act/publish).
   Why: makes roles user-editable and orchestrator-assemblable without code changes; matches our Planner/Researcher/Coder/Reviewer/Tester templates.
   How it maps: our role template record in SQLite = {systemPrompt fragments: profile/goal/constraints, allowedTools/skills[], watch[]}; sidecar runs one generic worker executor per template; cheap Orchestrator auto-assembly becomes "pick templates, instantiate with task context".

2. **Typed publish/subscribe bus routed by producer-artifact type (`cause_by`) with per-agent buffers + dedupe** (`Environment.publish_message`, `Memory.get_by_actions(watch)`).
   What: senders publish once; recipients declare interest in message *types* (and optionally named recipients); each agent owns an inbox and its own memory index; environment retains global history for debugging.
   Why: decouples topology from wiring — adding/removing workers never changes other agents' code; the watch list doubles as context selection, keeping prompts small.
   How it maps: sidecar SQLite `messages` table columns (causeBy, sentFrom, sendTo, kind/type); per-agent cursor gives the private-inbox semantics; WS pushes filtered notifications; UI message log = env.history equivalent. Our two-tier Orchestrator can route like MGXEnv's TeamLeader (intercept, delegate, broadcast) but deterministically.

3. **Artifact-chain SOP: persist intermediate artifacts to disk, pass thin references in messages; gate with human-review modes** (`Document{root_path,filename,content}`, const.py repos, ActionNode ReviewMode/ReviseMode HUMAN/AUTO).
   What: pipeline steps write versioned artifacts (PRD -> design -> tasks -> code -> tests) to stable paths; bus messages carry pointers; downstream agents read artifacts on demand; every producing action optionally ends in a human review gate.
   Why: survives long runs, keeps tokens bounded, gives reviewers/testers concrete inputs, and creates natural Kanban card contents + approval-gate points.
   How it maps: artifacts as rows/blobs in SQLite (or workspace files referenced by id); Kanban cards bound to artifact types; approval gate = ReviewMode(HUMAN) before publishing the "artifact done" message; usage dashboard can meter per SOP stage.

Bonus (cheap to adopt): budget/round governance — `invest($)` max-budget + `NoMoneyException` + round cap per run maps directly to our usage dashboard spend caps and "max turns" per task.

## 5. What to avoid and why

- **LLM-chosen state machine per thinking step** (STATE_TEMPLATE asks the model to reply with a bare integer): one extra LLM call per step, brittle parsing (they patch invalid answers back to -1). Use deterministic routing; reserve LLM decisions for genuine delegation points (our Orchestrator).
- **Synchronous round-based global barrier** (`env.run` gathers all roles each `n_round`): idle roles stall the pipeline and rounds multiply cost. Prefer event-driven, continuously-running workers with a supervisor loop.
- **Unbounded history replay**: actions run against `self.rc.history` / full memories — prompt size grows with team size and rounds (the big-team token blowup). Pass watched artifacts + explicit task context instead.
- **Dual agent generations** (classic fixed-SOP vs RoleZero with `use_fixed_sop` toggles): maintenance burden and confusing semantics; keep ONE worker execution model in ACUTE-CODE.
- **String-flattened routing metadata** (MGXEnv rewrites content to "[Message] from X to Y: ..."): keep structured envelope fields in storage; render to text only at prompt-build time.
- **Porting Python-coupled machinery**: pydantic-everywhere modeling, gymnasium env spaces, game environments (Minecraft/Werewolf/StanfordTown), RAG/document-store sprawl, file-based JSON team serialization — all out of scope for a Tauri/TS desktop app; SQLite WAL already covers persistence/recovery better.

## 6. Sources consulted

- Local clone `C:\Users\khurr\Desktop\KILO\_references\metagpt` @ main `11cdf466d042aece04fc6cfd13b28e1a70341b1f`: README.md; LICENSE; metagpt/roles/role.py; metagpt/roles/{product_manager,architect,project_manager,engineer,qa_engineer}.py; metagpt/roles/di/{role_zero,team_leader}.py; metagpt/environment/base_env.py; metagpt/environment/mgx/mgx_env.py; metagpt/team.py; metagpt/software_company.py; metagpt/schema.py; metagpt/memory/memory.py; metagpt/subscription.py; metagpt/actions/action_node.py; metagpt/const.py
- GitHub repo page https://github.com/FoundationAgents/MetaGPT (HTTP fetch 2026-08-22): org/name, MIT badge, star/commit counts
- In-repo docs/ dir holds mainly translated READMEs/news/RFC-referenced roadmap; online docs (docs.deepwisdom.ai) and the ICLR 2024 paper were NOT fetched this pass

## 7. Open questions

- When/how the geekan -> FoundationAgents org move happened, and whether old deep links will keep redirecting indefinitely [UNVERIFIED].
- Relationship between this OSS repo and the closed mgx.dev product (news announces MGX launch; codebase contains MGXEnv but product internals unknown) [UNVERIFIED].
- Real-world token/cost figures for the classic 5-role SOP chain (paper benchmarks not reviewed here) [UNVERIFIED].
- Reliability of TeamLeader-style LLM routing: source comments admit TL "doesn't understand the message well in actual experiments" (commented-out bypass in mgx_env.py) — how they resolved it upstream is unclear.
- Whether PLAN_AND_ACT / Planner machinery (strategy/planner.py) is mature enough to inform our Orchestrator's task decomposition, or still experimental — not read this pass.
