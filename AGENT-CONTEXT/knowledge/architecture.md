# Architecture — CLINE_AGENT

## Quick Reference

## High-Level Architecture

```
┌─────────────────────────────────────────────┐
│              Web Browser (UI)               │
│  Next.js 16 + React + Tailwind CSS 4       │
│  Framer Motion, shadcn/ui                   │
└──────────────────┬──────────────────────────┘
                   │ HTTP / WebSocket
┌──────────────────▼──────────────────────────┐
│           Local Backend Server              │
│  (Bun/Node HTTP server)                     │
│  REST API + WebSocket for real-time         │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           Core Services                     │
│  ┌─────────────┐  ┌───────────────────┐     │
│  │ Agent Core   │  │ Model Manager     │     │
│  │ (from Cline) │  │ (SQLite/Prisma)   │     │
│  └─────────────┘  └───────────────────┘     │
│  ┌─────────────┐  ┌───────────────────┐     │
│  │ Tool System  │  │ Project Store     │     │
│  │ (file,shell, │  │ (SQLite/Prisma)   │     │
│  │  web, MCP)   │  │                   │     │
│  └─────────────┘  └───────────────────┘     │
└─────────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│           LLM Providers                     │
│  Anthropic, OpenAI, Google, Ollama, etc.    │
└─────────────────────────────────────────────┘
```

## Technology Stack (Planned)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 16, React, Tailwind CSS 4, shadcn/ui | Web UI |
| Animations | Framer Motion | Smooth transitions |
| Backend | TBD (see Q-001) | Local HTTP/WebSocket server |
| Database | SQLite + Prisma ORM | Lightweight, no setup |
| Agent Core | Ported from cline/cline | Core AI agent logic |
| LLM | cline/cline provider system | Multi-provider support |
| Build | GitHub Actions | CI/CD |

## Key Architectural Concepts

### 1. Separation of Concerns
- **UI Layer**: Pure frontend, communicates via API
- **Server Layer**: API, business logic, agent orchestration
- **Data Layer**: SQLite storage, file system access
- **Agent Layer**: LLM interaction, tool execution, context management

### 2. Project Isolation
- Each project has its own directory, settings, and chat history
- Projects are isolated from each other
- Shared model configs across projects

### 3. Real-time Communication
- WebSocket for live agent updates (tool use, messages, progress)
- REST API for CRUD operations

## (This document will be expanded as architecture decisions are made)
