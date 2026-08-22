# ADR-0012 - First-run onboarding (Setup screen)

**Status:** accepted - 2026-08-22

## Context

Owner confirmed 2026-08-22 that onboarding IS in scope: his UI bundles include provider/theme setup screens. The earlier working assumption (launch straight into the Dashboard, configure via Settings) is dropped.

## Options considered

- No onboarding - the user must discover Settings before the app can do anything.
- Full account/workspace wizard - exceeds v1 scope.
- Minimal first-run Setup screen ending in a verified provider connection - chosen.

## Decision

A first-run Setup screen is shown when no provider is configured:

1. Welcome + theme/accent selection (persisted per FR-1108).
2. Provider connect: OpenRouter preset (base URL `https://openrouter.ai/api/v1`) or custom OpenAI-compatible provider (name + baseURL).
3. API key entry; stored per the ADR-0011 path first, then Windows Credential Manager fallback (FR-12xx).
4. Test Connection button: lists models fetched from the configured base URL so the user verifies endpoint + key before finishing.
5. Finish sets the `onboardingComplete` flag. The flow is re-runnable from Settings.

## Consequences

- SPEC gains the FR-13xx requirement group (first-run onboarding).
- Settings gains its Providers section earlier than originally planned (pulled forward from the Phase 5 settings sweep).
- A persisted `onboardingComplete` flag becomes boot-time state; its reset lives in Settings.