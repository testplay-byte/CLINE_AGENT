# Dependency license compliance

**Status:** policy active; audit table empty until first scan.

CI enforces a license audit on every dependency change. A dependency may enter the build only if its license is on the allowed list. Anything ambiguous (custom license, dual-license with a forbidden option, "UNLICENSED") is treated as forbidden until resolved. Transitive dependencies are checked too, not just direct ones.

| Allowed | Forbidden |
| --- | --- |
| MIT | GPL |
| Apache-2.0 | LGPL |
| BSD | AGPL |
| ISC | |
| MPL-2.0 | |

The **first audit runs in Phase 1** alongside dev-environment setup, then on every dependency change thereafter. Findings are recorded below with package, version, license, introducing module, check date, and notes.

| Package | Version | License | Introduced by | Checked (date) | Notes |
| --- | --- | --- | --- | --- | --- |
| *(none audited yet — first audit Phase 1)* | | | | | |