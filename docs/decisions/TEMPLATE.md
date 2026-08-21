# ADR-NNN — <short title>

**Status:** proposed | accepted | superseded by ADR-MMMM — <YYYY-MM-DD>

## Context

What problem forces a decision now? Include constraints, inputs from the owner/brief, and any `[ASSUMPTION]` tags inline.

## Options considered

Realistic alternatives, including "do nothing". One short bullet set or paragraph each, with trade-offs.

## Decision

The choice made, stated plainly and completely enough to act on without re-reading the Context.

## Consequences

What becomes easier/harder, what we commit to — **including the negative consequences** we explicitly accept. List assumptions made (`[ASSUMPTION]`) so they surface in the next phase report.

---

## Usage rules (not part of an ADR body)

- **File naming:** `NNN-short-lowercase-title.md` in this directory. Numbers are **sequential** (next after the highest existing) and **never reused**, even if an ADR is abandoned — record the outcome in Status instead of deleting the file.
- **Superseding:** the new ADR states which number it replaces, and the old ADR's Status line becomes `superseded by ADR-NNN (<date>)`.
- **Assumptions:** tag every unconfirmed assumption `[ASSUMPTION]` inline; the Scribe consolidates them into the next phase report for owner confirmation.
- **When required:** every non-trivial decision (see `.kilo/skills/adr-writing/SKILL.md`). Trivial formatting/doc fixes do not need one.
- Create new ADRs with the `adr` command (`.kilo/command/adr.md`).