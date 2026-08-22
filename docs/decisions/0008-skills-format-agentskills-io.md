# ADR-0008 — Skills format (agentskills.io-style SKILL.md)

**Status:** accepted — 2026-08-22

## Context

SPEC FR-9xx requires minimal agent skills in v1 (scope set by ADR-0005). Kilo Code research showed its open SKILL.md folder spec delivers marketplace growth without requiring rework of the consuming application.

## Options considered

- Bespoke JSON skill files — machine-friendly but author-hostile and proprietary; no ecosystem to grow into.
- agentskills.io-style markdown folder spec (frontmatter + body) — human-authorable, open standard, marketplace-compatible — chosen.
- Deferring skills entirely — contradicts FR-9xx and ADR-0005 owner intent.

## Decision

Adopt **agentskills.io-style SKILL.md folders**: frontmatter with `name`/`description` plus a markdown body. Skills are stored under the app data directory, assigned per agent in the agent registry, and injected into the agent's system context at session start. No runtime skill execution and no marketplace in v1.

## Consequences

- Only a trivial parser (YAML-ish frontmatter split + markdown passthrough) is needed.
- A future marketplace can adopt the same folder format without rework.
