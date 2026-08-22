import type { LanguageModel } from 'ai';
import { createChatModel } from './openai-compatible.js';

export type ProviderId = 'anthropic' | 'openai' | 'google' | 'openrouter' | 'custom';

export interface AdapterOptions {
  baseURL?: string;
  apiKey?: string;
}

export type AdapterFactory = (modelId: string, options: AdapterOptions) => LanguageModel;

function unsupported(providerId: string): AdapterFactory {
  return () => {
    throw new Error(
      `native ${providerId} adapter lands once live keys exist (ADR-0003); ` +
        'use an OpenAI-compatible endpoint meanwhile',
    );
  };
}

/** ProviderId -> adapter factory. OpenRouter + CUSTOM ride the compatible path. */
export const REGISTRY: Record<ProviderId, AdapterFactory> = {
  anthropic: unsupported('anthropic'),
  openai: unsupported('openai'),
  google: unsupported('google'),
  openrouter: (modelId, options) =>
    createChatModel(
      { baseURL: options.baseURL ?? 'https://openrouter.ai/api/v1', apiKey: options.apiKey, name: 'openrouter' },
      modelId,
    ),
  custom: (modelId, options) => {
    if (!options.baseURL) throw new Error('CUSTOM provider requires a base URL');
    return createChatModel({ baseURL: options.baseURL, apiKey: options.apiKey, name: 'custom' }, modelId);
  },
};

export function createProviderAdapter(
  provider: ProviderId,
  modelId: string,
  options: AdapterOptions = {},
): LanguageModel {
  return REGISTRY[provider](modelId, options);
}