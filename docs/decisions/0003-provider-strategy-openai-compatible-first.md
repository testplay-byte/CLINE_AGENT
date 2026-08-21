# ADR-0003 — Provider strategy: OpenAI-compatible first

**Status:** accepted — 2026-08-22

## Context

The owner holds **no Anthropic/OpenAI keys**. Live testing will use OpenAI-compatible keys (OpenRouter, Groq, NVIDIA NIM mentioned). The spec still requires four native adapters plus a custom OpenAI-compatible adapter.

## Options considered

- Build only the OpenAI-compatible adapter now, natives later — fastest demo, but leaves spec gaps.
- Build all adapters and verify everything live — impossible without keys for the natives.
- Build all adapters; prioritize live verification of OpenAI-compatible paths — chosen.

## Decision

1. Implement all four native adapters (**Anthropic, OpenAI, Gemini, OpenRouter**) plus the **custom OpenAI-compatible adapter** per spec.
2. LIVE verification priority: **custom OpenAI-compatible adapter + OpenRouter preset first**, then **Groq** and **NVIDIA NIM** as presets.
3. Native Anthropic/OpenAI/Gemini adapters are verified via SDK conformance suites plus mocked/recorded-fixture tests until the owner supplies real keys.
4. Default model routing: **one model for all agents**; per-agent model routing available when configured.

## Consequences

- The Phase 2 exit demo runs on an OpenAI-compatible endpoint.
- Native-adapter live tests are deferred and tracked as a known limitation until keys exist.
- Fixture-recording infrastructure is needed in the provider layer from the start.