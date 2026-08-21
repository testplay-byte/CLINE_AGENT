---
name: research-memo
description: Format + verification rules for docs/research analysis memos
---

How to produce `docs/research/<subject>.md` memos.

## Memo structure

1. **Overview** — what the project is; maturity and activity level.
2. **Architecture** — components, process model, data flow, extension points.
3. **Stack** — languages, frameworks, key dependencies, storage, IPC/transport choices.
4. **License** — read from the actual LICENSE file; note dependency licenses relevant to adoption.
5. **Adopt-patterns** — patterns/mechanisms worth adopting in ACUTE-CODE, each mapped to our feature area.
6. **Avoid** — approaches/pitfalls observed and why they do not fit our constraints.
7. **Open questions** — items needing owner/architect input.

## Verification rules

- Every factual claim is verified **from the actual repository** — real source/docs, never memory or secondary summaries.
- Claims not verifiable from the repo are marked `[UNVERIFIED]` inline.
- The license is read from the project's actual LICENSE file, not recalled.
- Unconfirmed implications for our own design are tagged `[ASSUMPTION]`.

## Clone & copy rules

- Clones live at `..\..\_references\<name>` — OUTSIDE the repo; `_references/` is git-ignored and never committed.
- References are studied **for patterns only**: NEVER copy code into ACUTE-CODE.
- Keep the `docs/research/README.md` index updated (pending -> in progress -> complete). Scope changes require a new ADR (ADR-0002).