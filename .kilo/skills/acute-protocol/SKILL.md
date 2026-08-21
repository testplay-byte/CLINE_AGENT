---
name: acute-protocol
description: ACUTE-CODE operating rules: phase gates, ADR discipline, licensing, approval-gate sanctity
---

Distilled operating contract for ACUTE-CODE (full text: AGENTS.md):

- **Spec before code.** Nothing is built that SPEC.md does not specify; implementation starts only after SPEC approval.
- **Phase gates.** Each phase ends with report + demo + owner approval. No gate, no next phase.
- **Approval gates are sacred.** Human-in-the-loop approvals are the ONLY safety layer in v1. Never bypass, weaken, or auto-approve them.
- **ADR discipline.** Non-trivial decision => `docs/decisions/NNN-slug.md`. Sequential numbers, never reused; supersessions update both files' status lines.
- **Assumptions.** Unconfirmed input => tag `[ASSUMPTION]` inline; tags surface in the next phase report.
- **No scope creep.** Extras go to the deferred/backlog section of the current plan, never silently into the build.
- **Licensing.** Allowed: MIT, Apache-2.0, BSD, ISC, MPL-2.0. Forbidden: GPL, LGPL, AGPL (transitives included). The repo ships no LICENSE file (proprietary, closed-source).
- **Secrets.** Never in repo, logs, demos, or fixtures; stored via Windows Credential Manager / DPAPI only.
- **Questions.** Batched, max 10, each labeled BLOCKING or NON-BLOCKING; NON-BLOCKING travels with a tagged default.
- **Sub-agents.** Defined in `.kilo/agent/`; every dispatch ends with What it did / Artifacts produced / Open questions. Failed work is re-dispatched, never silently patched. The Scribe runs every phase.
- **Self-test mandate.** The orchestrator self-tests every phase itself in addition to the owner demo.
- **Local-first.** Processing/storage/orchestration local on Windows; inference via user-configured cloud APIs; no local models in v1 (ADR-0006).