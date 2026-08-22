import { describe, expect, it } from 'vitest';
import { approvalRespondSchema, customProviderConfigSchema } from './schemas.js';

describe('approvalRespondSchema', () => {
  it('accepts a valid decision', () => {
    expect(approvalRespondSchema.parse({ decision: 'approved' })).toEqual({ decision: 'approved' });
  });

  it('rejects an unknown decision', () => {
    expect(approvalRespondSchema.safeParse({ decision: 'maybe' }).success).toBe(false);
  });

  it('rejects a missing decision', () => {
    expect(approvalRespondSchema.safeParse({}).success).toBe(false);
  });
});

describe('customProviderConfigSchema', () => {
  it('accepts name and https base url', () => {
    const input = { name: 'groq', baseUrl: 'https://api.groq.com/openai/v1' };
    expect(customProviderConfigSchema.parse(input)).toEqual(input);
  });

  it('rejects a non-url base', () => {
    expect(customProviderConfigSchema.safeParse({ name: 'groq', baseUrl: 'not-a-url' }).success).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(customProviderConfigSchema.safeParse({ name: '', baseUrl: 'https://example.com/v1' }).success).toBe(false);
  });
});