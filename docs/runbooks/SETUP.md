# Dev environment setup — ACUTE-CODE

Windows-first setup for the ACUTE-CODE monorepo (pnpm workspace: root frontend package + `shared` + `agent-core`).

## Prerequisites

| Tool | Install | Notes |
| --- | --- | --- |
| Git | `winget install Git.Git` | required |
| Node.js >= 22 | `winget install OpenJS.NodeJS.LTS` | required; CI pins node 22 |
| pnpm 9 | `winget install pnpm.pnpm` (or `corepack enable`) | required |
| Rustup + MSVC toolchain | `winget install Rustlang.Rustup`, then VS Build Tools with the "Desktop development with C++" workload | optional locally - needed only to build/run the Tauri shell (`src-tauri/`) and better-sqlite3 native rebuilds yourself; CI covers Rust checks otherwise |
| WebView2 Runtime | preinstalled on Windows 11; else `winget install Microsoft.EdgeWebView2Runtime` | needed at app runtime, not for dev |

After installing, open a NEW terminal so PATH changes apply.

## Install

```powershell
git clone <repo-url> ACUTE-CODE
cd ACUTE-CODE
pnpm install
```

The first `pnpm install` generates `pnpm-lock.yaml`; commit it. Subsequent installs should be plain `pnpm install`.

## Verify environment

```powershell
pnpm verify
```

Runs `scripts/verify-env.ps1`, which prints a PASS/FAIL table:

```
Tool             Required Status Version
----             -------- ------ -------
git              yes      PASS   git version 2.45.0.windows.1
node >= 22       yes      PASS   v22.x.x
pnpm             yes      PASS   9.15.0
rustc (optional) no       FAIL   not found (optional; CI covers Rust builds)
cargo (optional) no       FAIL   not found (optional; CI covers Rust builds)
```

Exit code is 1 only when a required tool (git, node>=22, pnpm) is missing.

## Dev commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server for the React frontend at http://localhost:5173 (strict port) |
| `pnpm build` / `pnpm preview` | Production build / serve of the frontend |
| `pnpm --filter @acute/agent-core dev` | Sidecar dev loop (requires `agent-core/src/server.ts`, lands with the sidecar milestone) |
| `pnpm typecheck` | tsc over root, `shared`, and `agent-core` projects |
| `pnpm test` | vitest across the workspace |
| `pnpm lint` | ESLint 9 flat config over all TS/TSX |
| `pnpm audit:licenses` | License audit; rewrites `docs/compliance/dependency-licenses.md`, exits 1 on forbidden/unknown licenses |
| `pnpm verify` | Environment check table above |

## Continuous Integration

`.github/workflows/ci.yml` runs on every push/PR to `main` on `windows-latest`: pnpm 9 + Node 22 install, license audit, lint, typecheck, tests, frontend build, then `cargo check` in `src-tauri` once a `Cargo.toml` exists there (Rust toolchain cached via Swatinem/rust-cache). Local Rust setup is therefore optional until you need to run the shell yourself.

## Troubleshooting

- **Command not found after installing a tool** - PATH is stale; close and reopen the terminal (or restart VS Code).
- **PowerShell blocks `scripts/verify-env.ps1`** - allow local scripts once per user:
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
  `pnpm verify` already bypasses this via `-ExecutionPolicy Bypass`.
- **Port 5173 already in use** - the Vite server uses `strictPort`; stop the other process rather than switching ports.
- **better-sqlite3 native build errors** - install Visual Studio Build Tools (C++ workload) or rely on CI until then.
- **License audit fails on a transitive dep** - do not add workarounds; record the offender and escalate (AGENTS.md rule 6).