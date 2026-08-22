# AGENTS.md — ACUTE-CODE Operating Contract

This document binds any AI session — interactive or sub-agent dispatched — working in this repository. Read it fully before doing anything else.

## (a) Product identity

- **Name:** ACUTE-CODE (renamed from the brief codename "Forge"; ADR-0001).
- **Closed-source:** proprietary, all rights reserved. No LICENSE file, no license granted. Never publish or externalize any part of this repo.
- **Local-first:** ALL processing, storage, and orchestration run locally on the user's Windows device; LLM inference goes through user-configured cloud APIs. No local models in v1 (Ollama deferred per brief); no local-inference code paths (ADR-0006).
- **Locked stack:** Tauri 2 (Rust) shell · React 18 + TypeScript + Tailwind + shadcn/ui + Zustand + TanStack Query frontend · Node.js/TypeScript sidecar that exclusively owns SQLite in WAL mode via Drizzle · Vercel AI SDK. Changing the stack requires a new ADR plus owner approval.

## (b) Operating rules

1. **Spec before code.** Nothing is implemented that SPEC.md does not specify. Implementation begins only after SPEC approval at the Phase 0 gate.
2. **Phase gates require owner approval.** Each phase ends with a report and demo; the next phase starts only on explicit owner sign-off.
3. **ADR discipline.** Every non-trivial decision gets an Architecture Decision Record at `docs/decisions/NNN-short-name.md` before or with the change (see `docs/decisions/TEMPLATE.md`).
4. **Assumptions are tagged.** Anything decided without owner confirmation is tagged `[ASSUMPTION]` inline wherever it appears and listed in the next phase report.
5. **No scope creep.** Ideas beyond SPEC v1 go to the deferred/backlog section of the current phase plan (with an ADR if meaningful) — never silently into the build.
6. **Licensing rules.** Allowed dependency licenses: MIT, Apache-2.0, BSD, ISC, MPL-2.0. Forbidden: GPL, LGPL, AGPL (transitive dependencies included). See `docs/compliance/dependency-licenses.md`.
7. **Secrets never enter the repo or logs.** Provider API keys live only in Windows Credential Manager / DPAPI-protected storage. Never hard-code, print, commit, or log secrets — including in demos and test fixtures.
8. **Question protocol.** Questions to the owner are batched (max 10 per round), each labeled `BLOCKING` (work halts without it) or `NON-BLOCKING` (a default was assumed and tagged `[ASSUMPTION]`). Never drip-feed questions.
9. **Approval-gate sanctity.** The product's human-in-the-loop approval gates are the ONLY safety layer in v1. Never bypass, weaken, auto-confirm, or "temporarily" disable them.

## (c) Sub-agent protocol

An Orchestrator dispatches sub-agents defined in `.kilo/agent/`:

| Role | Purpose |
| --- | --- |
| `researcher` | Reference-project analysis + library evaluation → `docs/research/*.md` memos |
| `planner` | Phase task decomposition → `docs/runbooks/plan-phase-N.md` |
| `architect` | System/module/API design → `docs/architecture/*` + ADRs |
| `developer` | Per-module implementation to spec + unit tests + module README |
| `reviewer` | Reviews code/docs against SPEC.md + ARCHITECTURE.md |
| `tester` | Test suites + end-to-end phase demos, acceptance pass/fail |
| `scribe` | Keeps docs/, ADRs, license audit, assumption log, research index current |

Protocol rules:

- Every dispatch ends with a final report whose last three sections are **What it did**, **Artifacts produced**, **Open questions**.
- Failing or incomplete output is **re-dispatched** to the same role with corrections — never silently patched by the Orchestrator or another role.
- The **Scribe runs every phase**, unprompted.

## (d) Testing

The orchestrating session MUST self-test each phase itself — execute the checks, walk every exit criterion, produce evidence — **in addition to** the owner-facing demo. Owner demos supplement self-testing; they never replace it.

## (e) Documentation map

| Path | Contents |
| --- | --- |
| `README.md` | Product overview, status, doc map |
| `AGENTS.md` | This contract |
| `docs/specs/SPEC.md` | Master specification |
| `docs/specs/user-stories/` | One user-story file per feature area |
| `docs/architecture/ARCHITECTURE.md` | Module map, data flow, sidecar contracts |
| `docs/architecture/api/` | Sidecar REST/WS endpoint docs |
| `docs/decisions/` | ADRs (TEMPLATE.md + numbered records) |
| `docs/research/` | Reference-analysis memos + index |
| `docs/compliance/` | Dependency license audit |
| `docs/runbooks/` | SETUP, DEMO, per-phase plans |
| `.kilo/` | Kilo agents, commands, skills |

## (f) Current phase status

**Phase 2 (Core skeleton) in progress — Phase 1 CI pending push after PAT fix** (see `docs/runbooks/plan-phase-2.md`).

## (g) Communication

Owner notifications are sent via ntfy.sh topic `TASKISDONE`; every message body MUST start with the prefix 🍁🍁🍁🍁🍁🍁 followed by a short title line. Send on: phase milestones, CI results, blockers, first-runnable-test announcements.
