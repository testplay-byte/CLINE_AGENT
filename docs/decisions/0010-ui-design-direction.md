# ADR-0010 — UI design direction (UI-BRIEF)

**Status:** accepted — 2026-08-22

## Context

The owner supplied three React bundles in `_references\ui\` (Next.js / React 19 / Tailwind v4) covering Dashboard, Project workspace + Session view, and Agent registry/onboarding primitives, consolidated into `_references\ui\UI-BRIEF.md`. Our locked stack is React 18 + Vite + Tailwind v3, so bundle code cannot be used verbatim.

## Options considered

- Copy bundle components verbatim — framework/version mismatch (Next.js/React 19/Tailwind v4 vs React 18/Vite/Tailwind v3); ownership/license unclear.
- Design from scratch — discards an owner-provided, already-approved visual direction.
- Re-implement UI-BRIEF patterns on our stack via CSS variables — chosen.

## Decision

Adopt **UI-BRIEF as the design source of truth**, implemented as CSS variables in Tailwind v3 on the locked React 18 + Vite stack:

- Fonts: Space Grotesk + Geist Mono.
- Accent system: default **Nova #FF6B2C**, selectable alternatives Bento #6366F1 / Midnight #D6FF57 / Sunset #FF7A3D / Mono #111111, with light/dark hex sets per accent.
- Shape/type: 10px radius, bento hard-offset shadows, dense 10–13px type scale.
- Components are **re-implemented, NOT copied verbatim** (different framework versions).
- Experimental freeform window mode is out of scope for v1.
- The Settings screen is composed fresh from bundle patterns (no direct reference screen exists).

## Consequences

- Owner confirmed 2026-08-22: bundles are his own original design language. Direction: follow the design language faithfully; components are re-implemented on our stack, never copied verbatim (owner instruction + framework mismatch).
- Tailwind v4 idioms must be translated to v3 CSS variables during re-implementation (extra care, no copy-paste).
- Freeform window mode is explicitly deferred and must not leak into v1 scope.
