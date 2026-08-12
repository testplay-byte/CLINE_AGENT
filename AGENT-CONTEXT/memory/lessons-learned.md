# Lessons Learned

## Format
- [TAG] Lesson description (source: <task/source>, <date>)
## Tags: MISTAKE, CORRECTION, INSIGHT, PATTERN

---

- [MISTAKE] Did not send NTFY notification after completing Task ID 2 (foundation setup). CORE_RULES §11 and §34 explicitly require this. Must ALWAYS send a completion notification — no exceptions. (source: self, 2025-07-25)

- [CORRECTION] User clarified NTFY topic is `cline-agent-chat-808` (not `TASKISDONE`). Also clarified two notification types: 🟨 for status, 🟦 for communication. Always use double notification (preview + actual). (source: user, 2025-07-25)

- [INSIGHT] User wants ALL files pushed to GitHub (including AGENT-CONTEXT, knowledge-base, cline-source). GitHub is the backup/safeguard against sandbox clearing. Push regularly, not just at session end. (source: user, 2025-07-25)

- [INSIGHT] Login/Auth is NOT needed. Just a simple frontend password screen (for show). No backend authentication. (source: user, 2025-07-25)

- [INSIGHT] Mobile companion app is a future feature — separate lightweight UI that mirrors PC status over internet (possibly via Cloudflare). NOT a full mobile app. Keep in mind for architecture but don't build now. (source: user, 2025-07-25)
