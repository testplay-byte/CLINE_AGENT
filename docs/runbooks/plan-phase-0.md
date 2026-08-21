# Phase 0 plan — Discovery & Spec

**Objective:** complete reference research and draft the master specification. **No implementation code in Phase 0** — no app skeleton, no package.json, no src/.

**Status:** deliverables complete (QA + initial commit done) — sole remaining exit criterion: owner SPEC approval at the phase gate.

## Tasks

| # | Task | Owner (role) | Depends on | Status |
| --- | --- | --- | --- | --- |
| 1 | Nine research memos — Cline, OpenCode, Hermes-Agent, MetaGPT, OpenHands, Kilo Code, AutoGen, LangGraph, Aider — deep analysis per ADR-0002 | researcher (+ scribe indexing) | — | done |
| 2 | Draft SPEC.md covering all v1 features + owner amendments | planner/architect | 1 | done |
| 3 | Record ADRs 0001–0006 | architect | — | done |
| 4 | QA + commit: doc cross-checks, compliance policy in place, assumptions consolidated, deliverables committed | tester + scribe | 1–3 | done |

## Exit criteria

1. **Nine memos complete**, each with sections architecture / stack / license (verified from the actual LICENSE file) / adopt-patterns / avoid — with verified licensing throughout. **MET** — scribe QA pass 2026-08-22 verified metadata, all seven sections, and a concrete license in each memo.
2. **SPEC.md covers all v1 features** plus owner amendments (provider presets incl. custom OpenAI-compatible, vision-model routing, minimal skills, two-tier orchestration, approval gates as the only safety layer). **MET** — draft v0.1 spot-checked against the amendment list.
3. **ADRs 0001–0006 recorded** in `docs/decisions/`. **MET**.
4. **Owner approves SPEC** (gate — nothing proceeds without it). **REMAINING**.

## Notes

- Reference clones stay outside the repo at `..\..\_references\` (ADR-0002); `_references/` git-ignored defensively.
- Every `[ASSUMPTION]` accumulated during research/drafting is consolidated by the Scribe for the Phase 0 report.