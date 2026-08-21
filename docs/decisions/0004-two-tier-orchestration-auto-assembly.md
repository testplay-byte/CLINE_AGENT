# ADR-0004 — Two-tier orchestration with automatic team assembly

**Status:** accepted — 2026-08-22

## Context

The owner wants a low-friction core loop: the user describes a task and the team assembles itself. Cost efficiency favors a cheap coordinator delegating to powerful executors.

## Options considered

- Fixed pipeline (always Planner -> Coder -> Reviewer...) — simple but brittle; wastes capacity on unsuitable tasks.
- Manual team assembly only — high friction; contradicts the owner's desired core loop.
- Two-tier auto-assembling orchestration with manual override — chosen.

## Decision

Adopt a **two-tier model**:

1. An **Orchestrator role** (cheap/fast model) plans, dispatches, routes context (file paths, locations, results), and **auto-assembles worker teams** from the task description.
2. **Worker agents** (powerful model; user-editable role templates: Planner/Researcher/Coder/Reviewer/Tester) execute the work.
3. The user can override team composition manually.
4. **Hard cap: 5 concurrent agents**, with queueing beyond the cap.
5. Default: a single model for every agent unless routing is configured.

## Consequences

- The orchestration engine needs an assembly/planning step before the run loop (task analysis -> team proposal -> dispatch).
- Cost control improves: coordination tokens come from the cheap tier.
- Future-proofing for custom communication topologies remains an explicit design goal — inter-agent messaging is built as a message-bus abstraction, not hardcoded hub-and-spoke calls.
- Auto-assembly quality becomes a tuning target; assemblies must stay visible and overridable.