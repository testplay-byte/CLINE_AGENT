---
description: Compile end-of-phase report (deliverables, acceptance checklist, demo, open questions)
---

Compile the end-of-phase report for phase `$ARGUMENTS` (default: the latest `docs/runbooks/plan-phase-N.md`).

Sources: `docs/runbooks/plan-phase-N.md` (tasks + exit criteria), SPEC.md acceptance criteria, Tester reports, Scribe consolidation (assumptions, doc/index state).

Produce the report with exactly these sections:

- **(a) Deliverables** — artifacts produced this phase with paths.
- **(b) Acceptance checklist** — every exit criterion with a REAL pass/fail backed by executed checks or Tester evidence. Unknown = FAIL/BLOCKED with reason; no optimistic defaults.
- **(c) Demo script** — a max-2-minute owner demo: exact steps + expected outcomes, drawn from `docs/runbooks/DEMO.md`.
- **(d) Open questions** — batched, max 10 total, each labeled BLOCKING or NON-BLOCKING.
- **(e) Performance vs budget** — once the app boots: idle RAM (<700MB), 5-agent RAM (<2.5GB), cold start (<5s). Before first boot: state NOT YET MEASURABLE.
- **(f) Deferred items** — with ADR references where applicable.

End by requesting the owner's phase-gate approval decision; the next phase does not start without it.