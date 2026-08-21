---
description: Create a new Architecture Decision Record
---

Create a new ADR titled: $ARGUMENTS

Steps:

1. Determine the next sequential number: list `docs/decisions/`, find the highest `NNN-*`, add one. Numbers are never reused, even after abandonment.
2. Create `docs/decisions/NNN-<slug-of-$ARGUMENTS>.md` (lowercase-hyphenated slug) using the structure from `docs/decisions/TEMPLATE.md`.
3. Fill in: **Status** (start `proposed` with today's date), **Context** (the forcing problem, constraints, owner inputs, `[ASSUMPTION]` tags), **Options considered** (realistic alternatives incl. trade-offs), **Decision** (stated plainly), **Consequences** (including negative consequences and any assumptions).
4. If this ADR supersedes an older one: update the old ADR's Status line to `superseded by ADR-<this NNN> (<date>)` and reference it in this ADR's Context or Decision.
5. Confirm every unconfirmed assumption is tagged `[ASSUMPTION]` inline so the Scribe collects it for the phase report.