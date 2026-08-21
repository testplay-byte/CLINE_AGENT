# ADR-0005 — Minimal agent skills in v1

**Status:** accepted — 2026-08-22

## Context

The owner asked whether agent "skills" ship in v1 and wants "some normal enough skills to start with" — neither zero skills nor a marketplace platform.

## Options considered

- No skills in v1 — simplest, but contradicts owner intent and loses cheap capability gains.
- Full skills platform (marketplace, generation, sharing) — heavy scope creep for v1.
- Minimal file-based skills assignable in the registry — chosen.

## Decision

v1 ships a **minimal skills system**:

- Skills are **user-editable markdown files on disk**.
- They are assignable to agents in the agent registry.
- Assigned skills are injected into the agent's system context per assignment.
- Out of scope in v1: skill marketplace and self-created skills (self-created/auto-generated skills noted as a future direction inspired by Hermes-Agent — see `docs/research/hermes-agent.md`).

## Consequences

- Small storage addition (skills directory) plus a registry field and an injection step in prompt assembly.
- Explicitly deferred: skill marketplace, discovery/ranking, auto-generated skills — revisit post-v1.
- Skill injection order/conflict handling becomes a small open question for SPEC drafting.