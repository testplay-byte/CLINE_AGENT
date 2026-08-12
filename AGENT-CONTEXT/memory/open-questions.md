# Open Questions

## Format
**Q-NNN**: Question text
- **Status**: Open | Resolved | Deferred
- **Resolution**: How it was resolved (if resolved)

---

**Q-001**: What is the preferred local server technology for the backend?
- Status: Resolved
- Resolution: User approved backend server approach. Decision pending on specific tech (Bun/Hono/Express) — will be formalized as D-001.

**Q-002**: Should the web UI use the existing Cline webview design or start fresh?
- Status: Resolved
- Resolution: Start fresh with modern, beautiful, minimalistic design. User will provide UI designs based on detailed prompts from agent.

**Q-003**: How should project contexts be stored and isolated?
- Status: Open
- Notes: CORE_RULES §32 defines the principle. Implementation details will be decided during P1 (Backend Server).