# ADR-0001 — Product name, repo location, distribution model

**Status:** accepted — 2026-08-22

## Context

The project brief referred to the product by the codename "Forge". The owner has renamed the product to **ACUTE-CODE**. The repository lives at `Desktop\KILO\ACUTE-CODE` (parent `KILO` otherwise empty). On distribution, the owner prioritizes a simple run experience — a folder with a runnable `.exe` or a startable server script — over a formal installer.

## Options considered

- Keep the codename "Forge" — rejected; the owner renamed the product explicitly.
- Name it ACUTE-CODE with the repo at `Desktop\KILO\ACUTE-CODE` — matches owner intent.
- Formal installer (MSI) as the primary early distribution path — heavier than the owner wants early on.

## Decision

1. The product is named **ACUTE-CODE** everywhere: docs, branding, UI strings, process names.
2. Repository root: `C:\Users\khurr\Desktop\KILO\ACUTE-CODE`.
3. Distribution = dev launcher/start scripts plus a portable build folder. An MSI installer remains the **Phase 6 exit gate**, not earlier.

## Consequences

- All docs and branding use ACUTE-CODE; "Forge" survives only as historical context (as here).
- Packaging work is deferred but planned: portable-folder layout decisions (data paths, sidecar launch) must anticipate MSI packaging so it is not a rewrite.
- Negative: until Phase 6, running the app requires dev-level steps documented in `docs/runbooks/SETUP.md`.