# ADR-0009 — Edit and git policy defaults

**Status:** accepted — 2026-08-22

## Context

Aider research raised two policy questions: (1) whether fuzzy-applied file edits should be silently accepted, and (2) whether agent-made commits should run the repository's pre-commit hooks. The owner approved the stated defaults.

## Options considered

- Hide fuzzy-applied edits unless confidence is high — cleaner diffs, but hides exactly the edits most likely to be wrong; undermines review trust.
- Always surface fuzzy-applied edits in approval diffs — chosen.
- Run repository pre-commit hooks on agent commits — respects user config but risks slow/broken hooks blocking or corrupting automated flows.
- Bypass pre-commit hooks for agent commits, documented — chosen.

## Decision

- Fuzzy-applied file edits **ALWAYS appear in approval diffs**; the Reviewer flags low-confidence applies.
- Agent-made commits **bypass repository pre-commit hooks** — this is documented behavior, not a defect.
- Destructive git operations remain gated by the approval engine regardless (approval-gate sanctity, AGENTS.md rule 9).

## Consequences

- Reviewers must actively flag low-confidence applies; diff noise increases slightly in exchange for full visibility.
- Users relying on pre-commit hooks lose that protection for agent-made commits; the bypass is a documented product behavior.
- The approval gate remains the sole safety layer for destructive git operations in v1.
