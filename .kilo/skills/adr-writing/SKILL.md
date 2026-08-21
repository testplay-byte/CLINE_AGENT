---
name: adr-writing
description: How to write ACUTE-CODE ADRs
---

Writing Architecture Decision Records for ACUTE-CODE.

## Template & structure

- Use the field structure from `docs/decisions/TEMPLATE.md`: Status (proposed/accepted/superseded + date), Context, Options considered, Decision, Consequences — always including the negative consequences we accept.
- Filename: `docs/decisions/NNN-short-lowercase-title.md`.

## Numbering

- Sequential `NNN`: highest existing number plus one. Numbers are **never reused**, even if an ADR is rejected or abandoned — record the outcome in Status instead of deleting.
- Superseding: the new ADR notes which number it replaces; the old ADR's Status becomes `superseded by ADR-NNN (<date>)`.

## Assumptions

- Any input not confirmed by the owner is tagged `[ASSUMPTION]` inline in Context/Decision. The Scribe consolidates these into the next phase report.

## When an ADR is required

- **Required:** choices between real alternatives that shape architecture, data, security, process, tooling, scope, naming, or distribution — anything future readers would ask "why is it like this?" about.
- **Not required:** routine doc edits, typo fixes, mechanical refactors that change no decisions, filling placeholders whose decision already lives in an ADR or SPEC.

Prefer many small ADRs over few sprawling ones; write the ADR with (not after) the change it governs.