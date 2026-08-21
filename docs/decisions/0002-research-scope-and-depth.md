# ADR-0002 — Research scope and depth

**Status:** accepted — 2026-08-22

## Context

The brief mandated six reference analyses (Cline, OpenCode, Hermes-Agent, MetaGPT, OpenHands, Kilo Code) and left room for more ("many other good ones") without defining how many — undefined scope invites drift, which the anti-drift rule forbids.

## Options considered

- Exactly the six mandated projects — safe, but misses directly relevant prior art in orchestration and tools.
- Open-ended "as many as seem useful" — violates anti-drift; unbounded Phase 0.
- Six mandated + a bounded, justified extension — chosen.

## Decision

1. Mandated six: **Cline, OpenCode, Hermes-Agent, MetaGPT, OpenHands, Kilo Code**.
2. Three additions chosen for direct relevance to our orchestration/tools layers:
   - **Microsoft AutoGen** — multi-agent group-chat patterns.
   - **LangGraph** — graph orchestration, checkpointing, human-in-the-loop interrupts (maps to our approval gates).
   - **Aider** — repository map, git-aware edit formats.
3. Depth: **deep**. Shallow-clone each repo to `..\..\_references\<name>` (outside the repo, never committed), read actual source, verify claims from the repository itself, and mark unverifiable claims `[UNVERIFIED]`.

Total scope: **9 memos**, indexed in `docs/research/README.md`.

## Consequences

- Phase 0 takes longer, but design decisions are grounded in verified evidence rather than memory.
- Additional references require a new ADR; the list is closed until reopened by owner decision.
- Shallow clones consume disk space outside the repo; `_references/` is git-ignored defensively.