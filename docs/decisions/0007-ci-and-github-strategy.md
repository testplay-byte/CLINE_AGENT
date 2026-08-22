# ADR-0007 — CI and GitHub strategy

**Status:** accepted — 2026-08-22

## Context

The owner's local hardware is weak and cannot reliably run heavy builds (Tauri bundle/MSI), yet ACUTE-CODE is closed-source, so the code must stay in a private remote. The owner provided a private GitHub repository `github.com/testplay-byte/ACUTE-AGENTS` (the name differs from the product name intentionally) plus a fine-grained PAT that was shared in chat.

## Options considered

- Local-only builds/checks — no extra infra, but heavy Tauri/MSI builds are impractical on current hardware.
- Self-hosted or third-party CI — extra setup and maintenance burden for a solo project; GitHub Actions is already available on the provided private repository — chosen.

## Decision

- **GitHub Actions on `windows-latest`** runs lint + typecheck + test + license-audit + frontend-build + cargo-check on every push.
- **Heavy/release builds (Tauri bundle / MSI) run ONLY in Actions** — an owner requirement.
- The local machine performs fast checks only (lint, typecheck, unit tests).
- Git authentication goes through **Git Credential Manager**, storing the PAT in Windows Credential Manager — never in repo files (per AGENTS.md secrets rule).
- Because the PAT transited chat, **PAT rotation before release is recommended**.

## Consequences

- CI minutes are consumed on every push.
- Local full builds remain impossible until a Rust toolchain is installed — Phase 1 optional install item.
- The remote name (`ACUTE-AGENTS`, ≠ product name `ACUTE-CODE`) is documented here as intentional.
