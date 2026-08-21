# ADR-0006 — Local-first definition and vision-model routing

**Status:** accepted — 2026-08-22

## Context

The brief says "local-first" without defining it, and the owner wants image analysis handled well. The term risks being misread as "runs local models", which the brief excludes (Ollama deferred).

## Options considered

- Interpret local-first as local model execution — contradicts the brief's deferral of Ollama.
- Exclude images from v1 — fails the owner's explicit multimodal wish.
- Define local-first precisely as local processing/storage/orchestration with cloud inference, and route images to vision-capable models — chosen.

## Decision

1. **Local-first means:** ALL processing, storage, and orchestration run on the user's device; LLM inference happens via cloud APIs the user configures. **No local model execution in v1** (Ollama deferred per brief) and no local-inference code paths built.
2. **Multimodal/vision:** the message composer supports image attachment. Attached images route either:
   - to the conversation model, if it is vision-capable; or
   - to a **user-configured dedicated vision model**, which processes the image and returns results to the requesting agent.

## Consequences

- The provider layer must expose a **per-agent vision-model override** and a vision-capability flag per model.
- Keeping no Ollama/local-inference code paths keeps the sidecar lean; revisiting requires a new ADR.
- Image payloads go only to provider endpoints the user configured — worth stating explicitly in Settings UI copy.