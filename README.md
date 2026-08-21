# ACUTE-CODE

ACUTE-CODE is a closed-source, local-first Windows desktop multi-agent engineering workbench: a Tauri 2 shell hosting a React 18 + TypeScript UI and a Node.js/TypeScript sidecar that exclusively owns SQLite (WAL mode). The user describes an engineering task; a cheap Orchestrator LLM automatically assembles and coordinates up to five concurrent worker agents from a user-editable registry (Planner/Researcher/Coder/Reviewer/Tester templates), driving a permissioned tool layer (file, shell, web, code execution, MCP client) against cloud providers — Anthropic, OpenAI, Gemini and OpenRouter natively, plus any custom OpenAI-compatible endpoint (OpenRouter/Groq/NVIDIA NIM presets). Human-in-the-loop approval gates are the only safety layer in v1; everything except model inference stays on the user's device.

**Proprietary — all rights reserved. Closed-source; no license granted.**

## Status

**Phase 0 — Discovery & Spec** (reference research + master specification; no implementation code exists yet).

## Documentation map

| Path | Contents |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Operating contract for any AI session working in this repo |
| [`docs/specs/SPEC.md`](docs/specs/SPEC.md) | Master product specification |
| [`docs/specs/user-stories/`](docs/specs/user-stories/) | User stories — one file per feature area |
| [`docs/architecture/ARCHITECTURE.md`](docs/architecture/ARCHITECTURE.md) | Module map, data flow, sidecar contracts |
| [`docs/architecture/api/`](docs/architecture/api/) | Sidecar REST/WebSocket endpoint docs |
| [`docs/decisions/`](docs/decisions/) | Architecture Decision Records (ADRs) |
| [`docs/research/`](docs/research/) | Reference-project analysis memos + index |
| [`docs/compliance/dependency-licenses.md`](docs/compliance/dependency-licenses.md) | Dependency license audit policy |
| [`docs/runbooks/`](docs/runbooks/) | Setup guide, phase plans, demo scripts |
| [`.kilo/agent/`](.kilo/agent/) | Kilo sub-agent definitions |
| [`.kilo/command/`](.kilo/command/) | Kilo commands (`adr`, `phase-report`, `research`) |
| [`.kilo/skills/`](.kilo/skills/) | Kilo skills (operating rules, memo format, ADR style) |