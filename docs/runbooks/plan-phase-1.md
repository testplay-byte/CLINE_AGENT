# Phase 1 Plan — Skeleton & CI

| Field | Value |
| --- | --- |
| Phase | 1 of 6 (SPEC §7) |
| Objective | Runnable skeleton repo + green CI: lint, typecheck, test, build, license audit (NFR-008) |
| Status | IN PROGRESS — T1–T5 done, T6 verification underway |
| Exit gate (SPEC §7 row 1) | Architecture docs + skeleton repo; CI green: lint, typecheck, test, build, license audit |

## Objective

Stand up the full three-process skeleton on the locked stack (AGENTS.md §a) so that every later phase implements against real seams instead of paper designs:

1. pnpm workspace (`shared`, `agent-core`, root frontend package) with shared tooling.
2. `@acute/shared` contract package compiled and tested.
3. agent-core sidecar skeleton booting Fastify with health/version + WS hub, storage schema + migration runner, approvals engine, provider registry + OpenAI-compatible adapter + Credential Manager reader, orchestration reducer + termination algebra, tools registry.
4. Frontend shell: six views as placeholders, theming from CSS variables (Nova `#FF6B2C` accents, light/dark), Zustand UI store, TanStack Query provider.
5. Tauri 2 shell that spawns the sidecar with port+token and dies with it.
6. Local checks pass; lockfile committed; GitHub Actions on `windows-latest` green including `cargo check`.

## Task table

Status legend: DONE · IN PROGRESS · BLOCKED · TODO.

| # | Task | Owner | Status | Done when |
| --- | --- | --- | --- | --- |
| T1 | Workspace foundation: root configs (tsconfig, eslint flat config, vitest), pnpm workspace file, `.github` CI workflow, `scripts/verify-env.ps1`, `scripts/license-audit.mjs`, SETUP.md rewritten for contributors | developer | DONE | Root configs present; `pnpm lint/typecheck/test` runnable locally; CI workflow committed |
| T2 | Shared contract package: types, WS event types, zod schemas in `@acute/shared` incl. `schemas.test.ts` | developer | DONE | Package builds; schema tests pass; both TS processes consume it via `workspace:*` |
| T3 | Sidecar skeleton: Fastify server (health/version/WS hub), storage module at `agent-core/src/storage/` (15-table schema + migration runner), approvals engine (denylist/levels/decide + tests), provider registry + openai-compatible adapter + Credential Manager secrets reader, orchestration reducer + termination algebra + tests, tools registry | developer | DONE | Sidecar boots and answers `/health`; unit tests for approvals/orchestration/storage runner pass |
| T4 | Frontend shell: theme CSS variables per UI design system (Nova `#FF6B2C` accent, light/dark via `.dark`), six placeholder views (FR-1107), Zustand ui store, TanStack Query provider, ThemeProvider with localStorage persistence | developer | DONE | Vite dev server renders all six views; theme toggles persist across reload |
| T5 | Tauri shell minimal: `tauri.conf.json` v2, `lib.rs` spawn-sidecar-with-port (non-fatal if sidecar absent), default capabilities | developer | DONE | `cargo check` clean; desktop window opens; sidecar spawn attempted with chosen port |
| T6 | Verification & CI green: local `pnpm install/lint/typecheck/test` + license audit, commit lockfile, push, GitHub Actions `windows-latest` green incl. `cargo check` | tester | IN PROGRESS — local checks GREEN (commit 1ab352d); push was pending a PAT permissions fix, superseded by a new PAT the same day; final CI status recorded in the phase report | All five SPEC-row checks green on CI with run links recorded in the phase report |

## Exit criteria (mapped to SPEC §7 phase-1 row)

- [x] Architecture docs exist: ARCHITECTURE.md + API overview (`docs/architecture/api/overview.md`) + ADR set.
- [x] Skeleton repo compiles: shared, agent-core, root frontend, src-tauri.
- [ ] Lint green locally **and** on CI.
- [ ] Typecheck green locally **and** on CI.
- [ ] Tests green locally **and** on CI (shared schemas, approvals engine, orchestration).
- [ ] Build green (vite build; cargo check for the shell).
- [ ] License audit green — only MIT/Apache-2.0/BSD/ISC/MPL-2.0 deps (NFR-008); report in `docs/compliance/dependency-licenses.md`.
- [ ] Lockfile committed; push done; GitHub Actions run green on `windows-latest`.
- [ ] Phase report + owner-facing demo prepared (AGENTS.md §d self-test evidence attached).

Unchecked items are exactly T6 scope. Phase closes only on owner sign-off (AGENTS.md rule 2).

## Known follow-ups

Logged here per AGENTS.md rule 5 so they cannot silently leak into the build:

1. **RunState vocabulary reconciliation** — `shared` and `orchestration` modules use slightly different RunState unions; unify on one `@acute/shared` definition before P2 wiring.
2. **Windows Job Object kill-on-close** — ARCHITECTURE.md §4 requires the child sidecar to die with the shell; currently a TODO in `src-tauri` (spawn is non-fatal best-effort).
3. **Bundle icons empty** — `tauri.conf.json` icon set not yet produced; MSI packaging (Phase 6) blocks on this eventually.
4. **better-sqlite3 native prebuilds for Node 24** — watch item; pin Node LTS for CI/local parity if prebuilds lag, else source-build fallback documented in SETUP.md.
5. **Storage module path** — implementation lives at `agent-core/src/storage/` (schema, migrations, repositories, `secrets.ts` Credential Manager bridge); ARCHITECTURE.md §3 reflects this.

Deferred/backlog (no ADR-worthy decisions this phase): none beyond items above.
