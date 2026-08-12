# Development Workflow

## Session Start
1. **Read CORE_RULES.md** — Understand project constraints, coding standards, and critical rules
2. **Read memory/progress.md** — Know the current project state and what's been done
3. **Read memory/lessons-learned.md** — Avoid repeating past mistakes
4. **Read memory/open-questions.md** — Check if any questions affect the current task

## Task Execution
For each task, follow this sequence:

### 1. Analyze
- Understand what is being asked
- Identify the scope and boundaries
- Determine which files/components are affected

### 2. Research
- Read relevant source files in cline-source/ if needed
- Check existing patterns in the codebase
- Look up any unfamiliar APIs or libraries

### 3. Comprehend
- Build a mental model of how the change fits into the whole
- Identify dependencies and side effects
- Understand the data flow

### 4. Confirm
- If anything is unclear, ask the user for clarification
- Confirm the approach before implementing (especially for architecture)
- Check open-questions.md for relevant pending decisions

### 5. Plan
- Write out the implementation steps
- Identify files to create/modify
- Consider edge cases and error handling

### 6. Implement
- Write the code following CORE_RULES.md standards
- Add comments for complex logic
- Keep changes focused and atomic

### 7. Verify
- Test the implementation
- Check for compilation/lint errors
- Verify the change works as expected
- Run any automated tests

### 8. Document
- Update knowledge/ files if architecture changed
- Log any new decisions in memory/decisions.md
- Record any lessons in memory/lessons-learned.md
- Update memory/progress.md

## Session End
1. **Update memory/progress.md** — Mark completed items, note what's next
2. **Commit all changes** — Stage and commit with descriptive messages
3. **Push to GitHub** — Ensure all work is saved remotely
4. **Summarize** — Provide a brief summary of what was accomplished
