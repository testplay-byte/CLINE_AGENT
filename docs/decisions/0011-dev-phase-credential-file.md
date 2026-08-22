# ADR-0011 - Dev-phase credential file (secrets.local.md)

**Status:** accepted - 2026-08-22

## Context

During dev/testing the owner explicitly relaxed the strict secrets rule for the development phase: rotating keys is trivial for him. The production path remains Windows Credential Manager; SPEC FR-12xx is unchanged for release (AGENTS.md rule 7 stays binding for release builds).

## Options considered

- Credential Manager only - production-correct, but adds friction to every fresh clone/dev machine during testing.
- Environment variables - leak easily into shells, logs, and CI output.
- Gitignored markdown file with Credential Manager fallback - chosen: zero-friction onboarding, guarded by .gitignore.

## Decision

During dev phases, secrets may ALSO live in a gitignored file `secrets.local.md` at the repo root, formatted as simple `key: value` lines (`GITHUB_TOKEN`, `OPENROUTER_API_KEY`, plus future providers).

- Code reads `secrets.local.md` FIRST, then falls back to Windows Credential Manager (target names: `git:https://github.com` and `ACUTE-CODE.<Provider>`).
- The file must NEVER be committed (`.gitignore` enforced) and must never appear in logs.

## Consequences

- Simpler dev onboarding: clone, paste keys into one gitignored file, run.
- Release checklist item added: remove the file-based reader or keep it as a documented fallback, AND rotate any key that transited chat during dev.
- Accepted risk: if `.gitignore` is bypassed or misconfigured, secrets could enter git history; the `.gitignore` entry ships together with the file-based reader.