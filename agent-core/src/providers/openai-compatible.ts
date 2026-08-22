import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';

export interface OpenAiCompatibleConfig {
  baseURL: string;
  apiKey?: string;
  /** Provider name baked into request metadata; defaults to the generic label. */
  name?: string;
}

/**
 * Minimal OpenAI-compatible adapter (ADR-0003 live-verification priority):
 * any endpoint exposing /chat/completions works with a base URL + key.
 */
export function createChatModel(config: OpenAiCompatibleConfig, modelId: string): LanguageModel {
  const provider = createOpenAICompatible({
    name: config.name ?? 'openai-compatible',
    baseURL: config.baseURL,
    apiKey: config.apiKey,
  });
  return provider.chatModel(modelId);
}