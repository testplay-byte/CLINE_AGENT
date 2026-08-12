# Upstream Tracking (cline/cline)

## Purpose
Track changes in the upstream cline/cline repository and decide which changes to port to our fork.

## Current Upstream State
- **Last checked commit**: 9b59090
- **Last check date**: (when we cloned)
- **Our fork base**: Same commit

## Change Log
| Date | Upstream Commit | Change Summary | Port? | Notes |
|------|----------------|---------------|-------|-------|
| — | — | — | — | Initial clone |

## Sync Process
1. Periodically fetch upstream changes: `git fetch origin main` in cline-source/
2. Review changelog and commit messages for significant changes
3. Assess impact on our fork
4. If porting needed: document in change log above, implement, test