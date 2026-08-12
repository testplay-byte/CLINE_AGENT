# CLINE_AGENT — Master Project Plan

## Overview
Convert cline/cline from a VS Code extension into a standalone, cross-platform AI coding agent application with a beautiful web interface.

## Key Principles
1. **Independent app** — NOT a VS Code extension
2. **Web + Local Server** — Backend runs locally, UI is a web app
3. **Windows-first** — Primary target, expand later
4. **Beautiful animated UI** — Modern, responsive, customizable
5. **Multi-model management** — Store and switch between multiple LLM configs
6. **Multi-project support** — Separate contexts per project
7. **GitHub Actions builds** — No local heavy builds
8. **Upstream-aware** — Track and selectively port changes from cline/cline

## Phases (Detailed in screens-plan.md)

### P0 — Foundation (Current)
- Project structure, architecture decisions, tooling setup
- Core rules, workflow, agent context
- GitHub repo setup and CI/CD scaffolding

### P1 — Backend Server
- Local HTTP/WebSocket server
- Project management API
- Session/context storage
- File management system
- Settings and configuration API

### P2 — Web Frontend (Screen by Screen)
- Authentication/Onboarding screen
- Dashboard/Home screen
- Project management screen
- Chat/Agent interaction screen
- File manager screen
- Settings screen
- Model management screen

### P3 — Agent Core Integration
- Port Cline's agent runtime to standalone
- LLM provider integration
- Tool system (file ops, shell, web)
- MCP support
- Context management and compaction

### P4 — Model Management System
- Multi-model storage
- Quick-switch between models
- API key management
- Provider presets

### P5 — Polish & Deploy
- Animations and transitions
- Responsive design
- Backup/restore functionality
- CI/CD for builds

### P6 — Future Features
- Memory agent system
- Advanced communication features
- Cross-platform support expansion