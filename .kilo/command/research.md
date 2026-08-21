---
description: Research a reference project and write its analysis memo
---

Subject: $ARGUMENTS

Procedure:

1. Follow the memo format and verification rules in `.kilo/skills/research-memo/SKILL.md`.
2. Locate or obtain the source: if not already present, shallow-clone to `..\..\_references\<name>` — OUTSIDE this repo, never committed (`_references/` is git-ignored).
3. Study the actual repository — source, docs, LICENSE file. Verify every claim from the repo itself; mark unverifiable claims `[UNVERIFIED]`. Never rely on memory alone; never copy code.
4. Write/update `docs/research/<subject>.md` with the standard sections (overview / architecture / stack / license / adopt-patterns / avoid / open questions).
5. Update the index table in `docs/research/README.md` (status -> complete when done).
6. If the subject is outside the agreed 9-memo scope (ADR-0002), stop and propose a new ADR instead of researching ad hoc.