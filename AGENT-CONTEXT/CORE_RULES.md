# CORE RULES — Non-Negotiable

> These rules apply at ALL times during development. They supersede the former `rules/` folder.
> If a rule here conflicts with anything else, **this file wins.**

---

## 1. Development Flow

Every task follows this cognitive sequence — in order:

1. **Analyze** — Understand the user's request, intentions, and context. What do they want? How do they want it done? No blind guesses.
2. **Research** — Investigate the relevant topic/code before acting. Understand what already exists, what touches what. Look before you write.
3. **Comprehend** — Confirm the whole task is understood. If anything is unclear, ask directly — no hesitation.
4. **Confirm** — For non-trivial changes, confirm your understanding with the user before building. State what you'll do in one line.
5. **No Assumptions** — Never guess. If unclear: ask the user or verify in the codebase. Assumptions are bugs you ship early.
6. **Modular Complexity** — Long/complex task? Split it across multiple files and multiple workflow steps. Keep each piece manageable, documented, and independently understandable.

> The concrete step-by-step task loop lives in `workflow.md`. This section is the **mindset**; `workflow.md` is the **procedure**.

---

## 2. Communication & Honesty

- **Ask as many questions as needed.** Clarify anything unclear directly with the user.
- **Proactively highlight** concerns, limitations, and future risks — before the user discovers them.
- **Guide the user** through problems and constraints plainly.
- **Never sugarcoat.** If a request has an issue, say so directly. Do not blindly agree. Do not follow requests that you can see are flawed without flagging the flaw first.
- **Be honest at all times.** A correct uncomfortable truth beats a polite wrong answer.
- Keep wording **short, simple, to the point**. Tell as much as needed — no more.

---

## 3. Summary After Completion

After completing a task, give the user a **short summary**:

- **Do not exaggerate.** Do not leave out key details.
- Use **proper formatting**: headings, highlights, emojis for emphasis and spacers.
- Use **multiple empty lines** for spacing where one line isn't enough.
- Lead with the **key outcome**. Then what changed. Then what's next.
- Reference file paths, not file contents (the user opens files if they want detail).
- **Test checklist**: After implementing improvements/fixes, ALWAYS provide a **test checklist** the user can follow to verify each fix. Format: grouped by category, each item as a checkbox `[ ]` with a clear description of what to test + what the expected result is. The user tests, reports back (✅/❌/⚠️), and the agent fixes any remaining issues. This closes the feedback loop and ensures nothing is missed.

---

## 4. Project Structure

- Keep the project **easy to handle and manage**. Well-documented, well-understood.
- **AGENT-CONTEXT stays updated after every task** so any future AI agent can pick up immediately.
- Build so that **editing one part** only requires understanding that part + its immediate context — not the whole project.
- **All things link together.** Document the relations (comments in code, notes in knowledge files).

### Folder Layout (canonical)

**RULE (non-negotiable):** The project is a standalone application — not a VS Code extension, not a wrapper around another project's folder. The repo root IS the project root. All code, config, and agent context live directly in the repo.

```
repo-root/                          ← CLINE_AGENT project root
├── AGENT-CONTEXT/                   # agent memory + rules (versioned in repo)
├── web/                             # Next.js web frontend
│   ├── app/                         # Next.js App Router pages
│   ├── components/                  # React UI components
│   ├── lib/                         # shared utilities, hooks, types
│   └── public/                      # static assets
├── src/                             # backend server (Node.js/TypeScript)
│   ├── core/                        # agent core logic (LLM calls, tool execution)
│   ├── api/                         # HTTP API routes / WebSocket handlers
│   ├── services/                    # business logic services
│   └── utils/                       # backend utilities
├── prisma/                          # Prisma schema + migrations (SQLite)
├── .github/workflows/               # CI/CD (GitHub Actions)
├── package.json                     # root package config
├── tsconfig.json                    # TypeScript config
└── next.config.ts                   # Next.js config
```

**Key principle:** The web frontend (`web/`) and backend server (`src/`) are separate directories with their own entry points, but share types and utilities where appropriate. AGENT-CONTEXT is for AI agent memory only — never import from it in application code.

---

## 5. Code Rules

- **Split code into multiple files** for development, maintenance, and reuse. Fewest files that make sense — not one giant file, not a file per function.
- **Document with comments**: what lives where, what the relations are. Comments explain *why*, not *what*.
- **One module = one responsibility.**
- Reuse before you write. Look a few files over before implementing.
- No unrequested abstractions (no interface with one impl, no factory for one product). **Exception:** an interface with one impl is OK when a future swap is explicitly planned (e.g. swapping LLM providers, swapping storage backends).
- Mark deliberate simplifications with a `ponytail:` comment naming the ceiling + upgrade path.
- **Agent lifecycle scaffolding is NOT boilerplate.** Session management, tool registration, context window tracking, streaming response handlers, and error recovery middleware are load-bearing. Do not delete them as "unnecessary complexity" without explicit user confirmation.

> See `skills/ponytail.md` for the full lazy-senior-dev decision ladder.

---

## 6. Documentation Rules

- **Verify before writing.** Confirm the change is real, understood, and actually needed before documenting it.
- **If the project changes, the docs reflect it** — same session, not "later".
- Do not over-document file structure. Document what's non-obvious.
- No generic advice. Specific, actionable rules only.

---

## 7. Architecture

- **Highly modular.** Multiple things → multiple modules.
- **UI and backend logic are separate.** A page's UI components and its data-fetching/logic live in different files/modules. The UI either calls an API endpoint or receives data via hooks — it never contains data-fetching logic directly (except lightweight client-side state).
- **Frontend (web/)** renders data, handles user input only. Next.js pages/components call server actions or API routes for data operations. No direct database access from the frontend.
- **Backend (src/)** handles LLM communication, tool execution, file system operations, and session management. Exposes clean API endpoints to the frontend.
- They communicate via **defined contracts** (REST API routes, WebSocket messages, shared TypeScript types). UI can be customized without touching backend logic.
- **Shared types** go in a common location (e.g. `shared/types/` or `web/lib/types/`) and are imported by both frontend and backend. This ensures type safety across the boundary.
- **Streaming responses**: The LLM streams tokens to the backend, which forwards them to the frontend via WebSocket or Server-Sent Events. The frontend renders tokens incrementally. This is the core UX loop — keep it fast and reliable.

> Concept diagrams + module graph live in `knowledge/architecture.md`. This section is the **rule**; that file is the **design**.

---

## 8. GitHub Actions & Branching

- **Always use GitHub Actions** for builds and releases. Never build release artifacts locally.
- **Create a branch** for each feature/fix: `feature/<name>`, `fix/<name>`, `docs/<name>`.
- **Merge to `main` only after** the feature is verified working and satisfactory. Not before.
- Commit messages: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- Never force-push to `main`.

### Build Rules
- **NEVER** build release artifacts (installers, bundles) locally. GitHub Actions only.
- **Local development** (running the dev server for testing) is fine — that's `npm run dev` or `next dev`. What's forbidden is building production/packaged outputs locally.
- **How to find build errors WITHOUT building locally:**
  1. Read the code carefully, line by line, checking every import, type, and API call.
  2. Use TypeScript's compiler directly (`npx tsc --noEmit`) for fast type-checking without a full build.
  3. Use sub-agents (Explore type) to review the code for errors — they can read files and compare against reference code.
  4. Push to CI and read the failure annotations from the GitHub API (`/repos/{owner}/{repo}/check-runs/{id}/annotations`).
  5. Iterate: fix → push → read CI annotations → fix again. This is the ONLY loop for release builds.

---

## 9. Self-Learning

- **When the user corrects you, or you catch your own mistake** → log it immediately in `AGENT-CONTEXT/memory/lessons-learned.md`.
- Format: `- [TAG] lesson (source: <task-id or "self">, <date>)`
- Tags: `MISTAKE` (you did wrong), `CORRECTION` (user fixed you), `INSIGHT` (you realized), `PATTERN` (recurring).
- **Dedup**: grep existing entries for the keyword before adding. Don't log the same lesson twice.
- **Review**: at task start, grep `lessons-learned.md` for tags matching the current task type.
- **Stale**: mark `~~strikethrough~~` with `→ superseded by <ref>` when a newer lesson contradicts.
- If a lesson is a recurring pattern → also add a **one-line rule** to the relevant section of this file.

---

## 10. Patterns to Avoid

- ❌ **Dependencies between skills.** Each skill in `skills/` is standalone. One skill must not require another to run.
- ❌ **Complex build systems or test frameworks.** Maintain simplicity. One runnable self-check for non-trivial logic is enough. No frameworks unless explicitly requested.
- ❌ **Generic advice.** Every rule must be specific and actionable. "Write clean code" = useless. "Function ≤ 30 lines or split" = useful.
- ❌ **Over-documenting file structure.** Document what's non-obvious. Don't narrate every folder.
- ❌ **Boilerplate "for later".** Later can scaffold for itself.
- ❌ **Deletion disguised as addition.** Don't add prose that defends a simplification — delete the prose.

---

## 11. Task Notification

- **After completing every task**, send a notification via `ntfy.sh`:
  ```bash
  curl -fsSL -H "Title: CLINE_AGENT" -d "<short result, one line>" https://ntfy.sh/TASKISDONE
  ```
- Topic: `TASKISDONE` (user-specified).
- ⚠️ **Note**: ntfy.sh topics are public. Anyone who guesses `TASKISDONE` can read/spoof messages. Don't put secrets in the message body. If this becomes a problem, switch to a long random topic stored in a GitHub secret.

---

## 12. Skill Management

- Skills live in `skills/`. Each is a standalone markdown file.
- **To add a skill**: (1) understand it fully, (2) verify it's reliable + useful, (3) sub-agent review if non-trivial, (4) write it with concrete examples (no generic philosophy), (5) add to `skills/README.md` index.
- **To create a new skill yourself**: must have a solid reason + solid backing. Use sub-agents to verify. If unsure, don't add it.
- Skills are **reference material**, not dependencies. The agent reads them on demand.

---

## 13. User Uses Speech-to-Text

- The user often dictates messages via speech-to-text. Transcription errors happen (misheard words, dropped words, odd phrasing).
- **If a request feels off or ambiguous**: try to correct obvious transcription errors from context. If still unclear → **stop and highlight it with the user** before proceeding. Do not move in the wrong direction on a misheard instruction.
- Common tells: homophones ("their/there"), numbers spelled out, slightly wrong technical terms. Use project context to disambiguate.
- When in doubt: ask. A 10-second clarification beats an hour of wrong work.

---

## 14. Sub-Agent Delegation Scope

- The main agent delegates specialized work to **sub-agents** (analysis, documentation, code creation).
- **Sub-agents working on web UI work ONLY inside `web/`.** They must NOT touch `AGENT-CONTEXT/` — no random documentation, no rule edits, no memory updates.
- **Sub-agents working on backend code work ONLY inside `src/`.** Same restriction — no `AGENT-CONTEXT/` modifications.
- Sub-agents do: page creation, component creation, code analysis, code documentation (inside their assigned zone only).
- The **main agent** is responsible for all `AGENT-CONTEXT/` updates (progress, decisions, lessons, rules) after sub-agent work completes.
- When launching a sub-agent: tell it explicitly which zone to work in and that it must NOT modify `AGENT-CONTEXT/`.

---

## 15. Session-End Backup (Push to GitHub) + Sandbox Recovery

- ⚠️ **This environment can clear out randomly.** Work not pushed to GitHub can be lost.
- **Every session MUST end with all changes committed and pushed to GitHub.** No exceptions.
- Before declaring a session done: `git status` must be clean, `git push` must be done.
- If the environment was cleared and re-cloned at session start: read `AGENT-CONTEXT/memory/progress.md` first to know where things stand, then continue.
- This rule exists because the environment is ephemeral; GitHub is the source of truth.

### Sandbox Recovery (if the environment feels off)

- **If anything feels off** — missing files, broken imports that were previously fine, stale state, weird build errors that shouldn't exist, or the working tree doesn't match what `progress.md` says — **STOP and re-clone the repo from GitHub.** Don't try to patch over a corrupted environment.
- **How to re-clone:**
  1. Move the current (suspect) working dir aside: `mv /home/z/my-project /home/z/my-project.suspect`
  2. Clone fresh: `git clone https://github.com/testplay-byte/CLINE_AGENT.git /home/z/my-project`
  3. Verify `AGENT-CONTEXT/memory/progress.md` exists + matches the last known state.
  4. If the suspect dir had uncommitted work, diff it against the fresh clone + manually port any salvageable changes.
- **Why re-clone instead of patch:** The sandbox can silently delete or corrupt files. Debugging a corrupted environment wastes hours. A fresh clone takes 30 seconds and guarantees a known-good state. GitHub is the source of truth — trust it over the local filesystem.
- **Prevention:** Push frequently (not just at session end). If you complete a major fix, push it immediately. Don't accumulate uncommitted work.

---

## 16. Web UI Design Language

- The app's design language is defined in **`web/DESIGN.md`**.
- It is **strictly followed** on all pages, all components, all parts of the UI. No deviations.
- The UI should feel like a professional desktop application — clean, responsive, and focused on the agent interaction workflow.
- To modify the design language: edit `web/DESIGN.md`, get user confirmation for non-trivial changes, keep it flexible for future improvement.
- See `knowledge/ui-design.md` for the full UI approach (purpose, component library, animation guidelines, responsive strategy).

---

## 17. Naming Consistency

- Keep naming schemes **consistent** across the project so searching is fast and reliable.
- **Files**: `kebab-case` for markdown/data files (`lessons-learned.md`, `open-questions.md`). `PascalCase` for React components (`ChatPanel.tsx`, `ToolExecutor.ts`). `camelCase` for utilities, hooks, and non-component files (`useSession.ts`, `formatMessage.ts`).
- **Folders**: `kebab-case` for general folders (`components`, `utils`, `api-routes`). `PascalCase` for React component folders only when they mirror the component name (e.g. `ChatPanel/ChatPanel.tsx`). Uppercase for top-level project zones (`AGENT-CONTEXT/`, `web/`, `src/`, `prisma/`).
- **TypeScript/JavaScript identifiers**: `camelCase` for variables, functions, methods. `PascalCase` for classes, types, interfaces, enums, React components. `UPPER_SNAKE_CASE` for constants.
- **API routes**: `kebab-case` for URL paths (`/api/model-configs`, `/api/sessions`).
- **Database tables/columns**: `snake_case` (Prisma/SQLite convention). Prisma model names in `PascalCase`.
- **Decisions**: `D-NNN` (zero-padded, sequential). **Questions**: `Q-NNN`. **Tasks**: `Task NN`.
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- If you need to rename something: update **all** references. Grep before and after.
- When creating a new file/folder/module: check existing naming patterns first. Match them.

---

## 18. Take As Much Time As Needed

- **Quality over speed.** Take as much time as a task needs to be done properly.
- Do not rush through steps to "finish faster." A rushed job creates rework.
- If a task is taking longer than expected: that's OK. Communicate progress to the user.
- **Do not skip steps** in the workflow (Understand → Verify → Implement → Verify → Move On) to save time.
- Sub-agent reviews, verification, documentation — all take time. They are not optional.
- "Done fast but wrong" is worse than "done slow but right."
- The only deadline is: **push to GitHub at session end** (§15). Everything else is quality-bound.

---

## 19. Web UI Work Uses Full-Stack-Dev Agent

- Whenever a **change is required on the web UI** (`web/`), delegate it to a **`full-stack-developer` sub-agent** when the change is non-trivial.
- The full-stack-dev agent handles: building pages, adding components, updating styling, wiring data, fixing build issues — all inside `web/` (and shared types if needed).
- The main agent defines the task, gives the sub-agent the DESIGN.md context, verifies the result, then updates `AGENT-CONTEXT/` (the sub-agent never touches AGENT-CONTEXT).
- For simple, well-scoped changes (fixing a typo, adjusting a color), the main agent can handle them directly.

---

## 20. Filtered Console Logging

- **Proper console logging for everything.** Every significant action, state change, error, and API call must be logged with enough context to understand what happened and where.
- **Filtered**: Use log levels (DEBUG / INFO / WARN / ERROR). Use namespaced prefixes per module (`[agent:core]`, `[agent:tool]`, `[api:session]`, `[web:chat]`, etc.). The developer can filter by namespace + level.
- **Toggleable**: Logging verbosity can be controlled via environment variable (`LOG_LEVEL=debug|info|warn|error`) and/or runtime toggle in Settings. Production defaults to `warn`.
- **What to log**:
  - ✅ INFO: session start/end, user actions, feature start/end, LLM request/response initiated.
  - ✅ DEBUG: API queries, cache hits/misses, state transitions, WebSocket events, tool execution steps.
  - ✅ WARN: recoverable errors (retry, fallback), deprecated API usage, rate limit approaching.
  - ✅ ERROR: exceptions, failed API calls, database errors, with stack traces.
- **What NOT to log**: user API keys, LLM prompt contents in full, full request/response bodies (log URLs + status codes + truncated summaries only).
- **Implementation**: Use a central `Logger` utility that respects the level + namespace + toggle. Never call `console.log()` directly in production code — always go through `Logger`.
- **Performance**: When logging is OFF for a level, the Logger is a no-op (zero overhead). Use lazy message construction (pass a function, not a string) for expensive log messages.
- **Frontend logging**: Use `console.log`/`console.warn`/`console.error` in the browser during development. In production, frontend logs are sent to the backend via an API endpoint or filtered by `LOG_LEVEL`.
- **Backend logging**: Use structured logging (JSON or pino-style) for the server process. Logs go to stdout (for Docker/systemd capture) + optionally to a log file.

---

## 21. Documentation Folder Organization (STRICT)

> Where documentation lives. Read this before writing ANY doc. Getting this wrong mixes upstream reference analysis with project docs — a real source of confusion.

### Three documentation zones — NEVER mix them:

| Zone | Path | What goes here |
|------|------|----------------|
| **Upstream reference** | `REFERENCES/` (if present) | Analysis of the upstream cline/cline repo. Read-only reference. NOTHING about CLINE_AGENT-specific changes goes here. |
| **Project docs** | `docs/` | Architecture plans, research, design decisions for CLINE_AGENT. Technical documentation, ADRs, API specs, setup guides. |
| **Agent knowledge** | `AGENT-CONTEXT/knowledge/` | Quick-reference summaries the agent reads on demand. NOT detailed research — that goes in `docs/`. The knowledge files link to the detailed docs. |

### Rules
1. **Upstream reference analysis stays in `REFERENCES/`** (if it exists). It describes the upstream cline/cline project. Never put CLINE_AGENT-specific plans here.
2. **CLINE_AGENT architecture/research/design goes in `docs/`.** This is the project's technical documentation.
3. **Agent-facing summaries go in `AGENT-CONTEXT/knowledge/`.** Short, cross-reference the detailed docs.
4. **The app's design language** lives at `web/DESIGN.md` (one file, canonical).
5. **Before writing a doc**: ask "is this about the upstream project, CLINE_AGENT, or agent memory?" → put it in the right zone.
6. **When in doubt**: ask the user. Don't guess the location.

### Verification
- After writing a doc, verify its location matches the table above.
- If you find a doc in the wrong zone: move it + update all cross-references (grep for the old path).

---

## 22. UI / UX Quality — Smooth Animations & Professional Feel

> The user values a polished, professional web application with smooth interactions. This is a quality bar, not an afterthought.

### Animation Requirements
- **Scrolling**: smooth scroll effects where appropriate. Never janky.
- **Page/route transitions**: animated page switches (fade, slide) where appropriate. Never instant cuts between major views.
- **Button clicks**: MUST give user feedback — hover states, active states (scale-down on press), color transitions. Never a dead tap.
- **Loading states**: smooth skeletons / shimmer, not jarring spinners where possible. For LLM streaming, show typing indicators and incremental text.
- **State changes**: animate UI state changes (expand/collapse, appear/disappear, panel open/close) — never pop in/out.

### Design Aesthetic
- **Clean, professional, focused.** The app is a coding agent — the UI should prioritize readability and workflow efficiency. Every element earns its place.
- **Follow `web/DESIGN.md` strictly.** It captures the project's design choices.
- **The design language is a living document.** When the user mentions UI improvements, update `web/DESIGN.md` AND propagate to the code.

### Performance
- **60fps target.** Animations must not drop frames. Use CSS transitions/animations, Framer Motion, or `requestAnimationFrame` correctly. Prefer CSS transitions for simple state changes; Framer Motion for complex orchestrated animations.
- **No heavy work on the main thread** during animation. Offload to Web Workers for heavy computation.
- **Test on target hardware** (Windows desktop browsers, especially Chromium-based).

### Implementation
- Use **Framer Motion** for complex animations (layout animations, exit animations, shared layout transitions).
- Use **CSS transitions** for simple hover/focus/active states and color/opacity changes.
- Use **Tailwind CSS** transition utilities (`transition-all`, `duration-200`, `ease-in-out`) where Framer Motion is overkill.
- Respect `prefers-reduced-motion` media query — disable or simplify animations for users who prefer reduced motion.

---

## 23. Live Data Verification

> When the user makes a change, it must be verified AND reflected live on screen. No "change + manual refresh."

### Rules
1. **Every user action has immediate visual feedback.** If the user sends a message, the UI updates instantly (optimistic update or streaming response), then confirms with the backend.
2. **Data changes propagate live.** Use React state (`useState`, `useReducer`) and server state (`SWR`, `React Query`, or custom hooks with WebSocket/SSE). The UI re-renders automatically when state changes. Never poll when a reactive option exists.
3. **Verify changes persisted.** After a write (e.g. saving a model config), verify it landed (read-back or server confirmation). If it failed, roll back the optimistic update + show an error.
4. **No silent failures.** If a save fails, the user MUST know. Toast/snackbar with the error + retry option.
5. **Cross-component consistency.** If the user changes a setting in a settings panel, all components using that setting must reflect it without a page reload (shared state via context, store, or event bus).

### Implementation
- Server state: use `SWR` or `React Query` for data fetching with automatic revalidation.
- Client state: use React Context or a lightweight store (Zustand) for global UI state.
- Optimistic updates: update the local state immediately, then confirm with the server. Roll back on failure.
- Streaming: LLM responses stream via WebSocket/SSE and render token-by-token. The streaming state must be managed cleanly (loading → streaming → done/error).

---

## 24. Database Documentation — Always Up to Date

> The database stores sessions, model configs, and project context. Its structure must be documented and kept in sync with the code at all times.

### Rules
1. **Dedicated documentation**: All database schema documentation lives in `docs/database/`. One file per table/entity group, plus a README index.
2. **Update on every change**: Whenever a table is added, modified, or removed (including columns, indexes, constraints), the corresponding documentation file MUST be updated in the SAME commit. No "document it later."
3. **Document what + why**: Each table documents its columns (name, type, constraints, description) AND why it exists (what problem it solves, what queries it supports).
4. **Migration log**: Every Prisma migration must have a corresponding entry in `docs/database/changelog.md` — what changed, why, when.
5. **ER diagram**: Keep the entity relationship diagram in `docs/database/er-diagram.md` updated when relationships change.
6. **Verify before commit**: Before committing a DB change, verify the docs match the `schema.prisma` file. If they don't match, the commit is incomplete.

### File Structure
```
docs/database/
├── README.md              — index of all tables + entities
├── er-diagram.md          — entity relationship diagram
├── changelog.md           — migration history (version, date, what changed)
├── sessions.md            — session + conversation tables
├── model-configs.md       — LLM model configuration tables
├── projects.md            — project context + workspace tables
├── tool-logs.md           — tool execution logs tables
└── app-settings.md        — application settings tables
```

---

## 25. Project Status Tracking

> The project's status must be accurately tracked so any agent (or user) can understand where things stand.

### Rules
1. **After every significant change**: update `AGENT-CONTEXT/memory/progress.md` to reflect the new state.
2. **Feature status, upstream sync state, known issues** — all must match the actual project state.
3. **When new features are added**: update the feature list and architecture docs.
4. **When decisions are confirmed**: update `AGENT-CONTEXT/memory/decisions.md`.
5. **When DB schema changes**: update `docs/database/` per §24.
6. **When a milestone completes**: update the progress page + overview.
7. **Don't let it drift**: stale progress docs cause the next session to waste time figuring out what's actually done.

---

## 26. Documentation Verification (Continuous)

> Docs drift is silent and corrosive. A stale doc is worse than no doc — it actively misleads the next session and erodes user trust.

### Rules
1. **Same-session updates (reinforces §6):** When code, state, or decisions change, update the relevant docs in the SAME commit/session — not "later." "Later" never comes. This applies to: `progress.md`, `changelog.md`, `decisions.md`, `lessons-learned.md`, `SESSION.md`, knowledge files, and DB docs (§24).
2. **Verify at task end (the verification gate):** Before declaring a task done, do a **drift check**:
   - Re-read the docs you touched this session. Do they match what you actually built?
   - `grep` for stale references: old feature names, removed decision IDs, deleted file paths, renamed modules. Fix every hit.
   - If a doc says "X features implemented" — verify by counting/inspecting the actual code. Don't trust the doc's prior claim; re-derive it.
3. **Cross-check claims against reality:** If progress.md says "feature X done" but the code shows it's incomplete, fix the doc (not the code) — OR fix the code and update the doc. Never leave them disagreeing.
4. **Lessons audit:** When you catch a doc-drift mistake (yours or a prior session's), log it in `lessons-learned.md` with the `[PATTERN]` tag. If drift recurs, promote a stricter rule here.
5. **Session-end checklist (add to §15 checklist):** Before push — (a) `progress.md` matches reality, (b) `changelog.md` has this session's entry, (c) `decisions.md` has any new D-NNN, (d) no stale references in any doc, (e) `lessons-learned.md` has any new lesson.
6. **Honesty about drift:** If you discover drift you can't fully fix in this session (e.g. a large doc rewrite needed), flag it explicitly to the user + note it in `progress.md` under a "Known doc debt" section. Don't silently leave it.

---

## 27. Tool Failure Recovery (Stop After 5 Tries)

> When a tool (Bash, Read, Edit, etc.) fails repeatedly, hammering it wastes context and time. The environment often self-recovers if you pause.

### Rules
1. **Stop after 5 consecutive failures** of the same tool with the same/similar error. Do NOT keep retrying — it won't help and burns context.
2. **Acknowledge the failure to the user** — tell them the tool is erroring and you're pausing. The user may need to reset the session or wait.
3. **Do NOT retry in a tight loop.** After the 5th failure, stop calling that tool entirely for the rest of the turn. Move to a different tool or describe what you would have done.
4. **The environment often self-recovers.** If the user says "continue" or sends a new message, try the tool again — it may work now.
5. **Log the failure** in `lessons-learned.md` with the `[PATTERN]` tag if it recurs across sessions (e.g. "Bash fails after long sessions — context limit or sandbox issue").
6. **If a critical action is blocked** (e.g. can't `git push`), tell the user explicitly: "I can't push to GitHub right now because Bash is failing. The changes are saved locally. Please retry in a new message or run `git push` manually."

---

## 28. Schema Freedom During Development

> The project is in active development. There are no production users yet. This gives us freedom to make schema changes without complex migration concerns — but with Prisma, migrations are cheap, so use them.

### Rules
1. **Development builds can adjust the schema freely.** You CAN add tables, add columns, change column types, restructure relationships. Use `prisma migrate dev` to generate and apply migrations. For destructive changes (drop table, drop column), use `--create-only` then edit the SQL if needed, or reset with `prisma migrate reset`.
2. **Prisma migrations are the standard.** Unlike raw SQLDelight where you write SQL by hand, Prisma generates migrations from schema changes. Always use `prisma migrate dev` — don't manually write migration SQL unless the auto-generated one needs adjustment.
3. **Reset is OK during development.** `prisma migrate reset` wipes the DB and re-applies all migrations. This is fine — there's no production data to preserve. Don't fear schema changes.
4. **SQLite constraints still apply** (e.g., no `ALTER TABLE DROP COLUMN` before SQLite 3.35.0). If a migration fails due to SQLite limitations, use `prisma migrate reset` to start clean — that's the development workflow.
5. **When publishing approaches**, the user will explicitly tell you. At that point, you MUST ensure all migrations are clean and non-destructive for existing data. Do NOT assume publishing is imminent — wait for the user's signal.
6. **This rule supersedes any "preserve existing data" guidance** in earlier decisions during active development. Once the user signals production approach, this rule is suspended + migration discipline returns.

### Why this rule exists
Active development should not be blocked by migration complexity. Prisma makes migrations easy — use them. Don't let migration fear block schema quality during development.

---

## 29. No Local Heavy Builds — Use GitHub Actions

> The local environment is for coding, testing, and iteration. Heavy builds (packaging, installers, production bundles) are done by CI.

### Rules
1. **Local = dev only.** Run `npm run dev` or `next dev` locally for testing. That's it. Do NOT run production builds, packaging, or installer creation locally.
2. **GitHub Actions = production builds.** All release artifacts (Windows installer, cross-platform bundles, etc.) are built by GitHub Actions workflows.
3. **Why:** The local environment may lack the tools, SDKs, or platform-specific build dependencies needed for packaging. CI has everything configured. Don't waste time installing build tooling locally.
4. **Type-checking is OK locally.** `npx tsc --noEmit` is fast and doesn't require build tooling. Use it freely.
5. **Linting is OK locally.** `npm run lint` or `npx next lint` is fast. Use it freely.
6. **If CI fails:** read the failure logs, fix the issue, push again. Do not try to replicate the full CI build locally.

---

## 30. Upstream Sync Tracking

> CLINE_AGENT is forked from cline/cline. Staying in sync with upstream is critical for getting bug fixes, new features, and avoiding divergence.

### Rules
1. **Track the upstream repo.** The `upstream` remote must be configured pointing to `github.com/cline/cline` (or whatever the canonical upstream is).
2. **Regular sync checks.** Before starting a new feature branch, check if there are new upstream commits to merge. Don't let the fork drift.
3. **Merge conflicts are expected.** CLINE_AGENT modifies the upstream codebase. When merging upstream, resolve conflicts carefully — preserve CLINE_AGENT's customizations while incorporating upstream changes.
4. **Document divergences.** When CLINE_AGENT intentionally diverges from upstream (removes VS Code dependency, adds standalone server, etc.), document WHY in `docs/upstream-divergence.md`. This makes future upstream merges easier.
5. **Don't blindly merge.** Review upstream changes before merging. An upstream change might conflict with CLINE_AGENT's architecture. Flag conflicts to the user.
6. **Tag sync points.** After each successful upstream merge, tag the commit with `upstream-sync-YYYY-MM-DD` and update `AGENT-CONTEXT/memory/upstream-status.md` with what was merged, what conflicts were resolved, and what was deferred.

---

## 31. Model Management

> CLINE_AGENT allows users to configure multiple LLM model providers and models. This is a core feature, not an afterthought.

### Rules
1. **Multiple model configs.** Users can store configurations for multiple LLM providers (OpenAI, Anthropic, local models via Ollama, etc.) with multiple models per provider.
2. **Config storage.** Model configurations are stored in the database (Prisma/SQLite) and can be exported/imported as JSON.
3. **No hardcoded API keys.** API keys are stored securely (encrypted at rest, OS keychain where available) — never in plaintext config files or in the repo.
4. **Active model selection.** The user can switch the active model per-session or globally. The UI must make this easy.
5. **Model config validation.** When a user adds a model config, validate it (test API call) before saving. Show clear error messages if validation fails.
6. **Default models.** Ship with sensible defaults for popular providers. The user should be able to start using the agent immediately after entering an API key.

---

## 32. Project Context Isolation

> Each project the user works on with CLINE_AGENT has its own isolated context and session storage. Projects must not bleed into each other.

### Rules
1. **Separate session storage.** Each project has its own conversation history, tool execution logs, and context window state.
2. **Separate file system context.** CLINE_AGENT operates within the project's directory. File operations are scoped to the project root (or explicitly allowed paths).
3. **No cross-project state.** A session in Project A cannot access or modify sessions in Project B. No shared global state between projects.
4. **Project switching.** The user can switch between projects. Switching preserves each project's state independently.
5. **Cleanup.** When a user deletes a project, all associated data (sessions, logs, context) must be cleaned up. No orphaned data.

---

## 33. NTFY Side-Channel Communication Protocol

> ntfy.sh is used as a side-channel for agent-to-user notifications and real-time communication during task execution.

### Configuration
- **Topic**: `cline-agent-chat-808`
- **Poll Script**: `AGENT-CONTEXT/ntfy-poll.sh`

### Two Notification Types (identified by emoji prefix in Title)

| Type | Emoji Prefix | Purpose | Response Expected? |
|------|-------------|---------|-------------------|
| **Status Update** | 🟨🟨🟨🟨🟨🟨🟨🟨 | Project/task status, completion updates | No |
| **Communication** | 🟦🟦🟦🟦🟦🟦🟦🟦 | Questions, clarifications, need input | Yes (2 min timeout) |

### Rules
1. **No secrets in ntfy messages.** Topics are public by default. Never put API keys, file contents, or personal data in the message body.
2. **Short messages only.** One line, < 200 characters. If more detail is needed, the user checks GitHub or asks the agent.
3. **Reliability over richness.** ntfy can silently drop messages or have delivery delays. It's a "best effort" channel. The agent does NOT depend on ntfy for anything critical — it's a convenience.
4. **If ntfy fails:** the agent logs the failure and moves on. The user will see the result when they check back. Do not retry ntfy more than once.
5. **🟨 Status updates** are one-way. Send the notification, continue working. No response expected.
6. **🟦 Communication** requires double notification (see §34). Must wait for response or timeout before continuing.
7. **Polling for responses**: Use `ntfy-poll.sh` with the `cline-agent-chat-808` topic and a 120-second timeout (per user's preference).

---

## 34. Notification Protocol (Double Notification)

> ALL notifications require a double-notification pattern: a preview (预告) followed immediately by the actual notification.

### Double Notification Pattern
1. **Preview notification:** A brief message telling the user a notification is coming. Sent ~2 seconds before the actual.
2. **Actual notification:** The real notification content, sent immediately after the preview.

### When to Use
- **Always** for 🟨 status updates on task completion (mandatory per §11).
- **Always** for 🟦 communication messages.
- **Optional** for quick/short tasks — but when in doubt, send it.

### 🟨 Status Update Format
```
Preview: curl -H "Title: 🟨🟨🟨🟨🟨🟨🟨🟨" -d "Notification incoming..." ntfy.sh/cline-agent-chat-808
Actual:  curl -H "Title: 🟨🟨🟨🟨🟨🟨🟨🟨 CLINE_AGENT Status" -d "<one-line result>" ntfy.sh/cline-agent-chat-808
```

### 🟦 Communication Format
```
Preview: curl -H "Title: 🟦🟦🟦🟦🟦🟦🟦🟦" -d "Question incoming, please respond..." ntfy.sh/cline-agent-chat-808
Actual:  curl -H "Title: 🟦🟦🟦🟦🟦🟦🟦🟦 CLINE_AGENT Question" -d "<your question or message>" ntfy.sh/cline-agent-chat-808
```
Then use `ntfy-poll.sh "cline-agent-chat-808" 120 ""` to wait for response (no message, just poll).

### 🟦 Response Timeout Protocol
- **Wait time**: 120 seconds (2 minutes)
- **If user responds within 120s**: Process their response, continue work accordingly
- **If timeout (no response)**:
  - **Critical question**: Ask in the main chat instead (flag it in chat)
  - **Minor question**: Make the best judgment, continue, and inform the user what you decided
  - **Always log** the timeout and your decision in the main chat

### §11 Compliance (Task Completion)
- **After completing EVERY task**, send a double 🟨 notification:
  1. Preview: `"Task completion notification incoming..."`
  2. Actual: `"<short result, one line>"`
- Topic: `cline-agent-chat-808`
- Title prefix: `🟨🟨🟨🟨🟨🟨🟨🟨 CLINE_AGENT Status`
