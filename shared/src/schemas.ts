import { z } from 'zod';
import type { ApprovalRequest, ProviderConfig } from './types.js';

export const providerIdSchema = z.enum(['anthropic', 'openai', 'google', 'openrouter', 'custom']);

export const customProviderConfigSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
});
export type CustomProviderConfigInput = z.infer<typeof customProviderConfigSchema>;

export const providerConfigSchema = z
  .object({
    provider: providerIdSchema,
    keyAlias: z.string().optional(),
    keyHint: z.string().optional(),
    custom: customProviderConfigSchema.optional(),
  })
  .strict() satisfies z.ZodType<ProviderConfig>;
export type ProviderConfigInput = z.infer<typeof providerConfigSchema>;

export const approvalDecisionSchema = z.enum(['approved', 'rejected']);

export const approvalRespondSchema = z.object({ decision: approvalDecisionSchema });
export type ApprovalRespondInput = z.infer<typeof approvalRespondSchema>;

export const approvalRequestSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  agentId: z.string(),
  action: z.string(),
  target: z.string(),
  riskNote: z.string(),
  level: z.enum(['confirm', 'blocked', 'auto']),
  decision: approvalDecisionSchema.optional(),
  decidedAt: z.string().optional(),
}) satisfies z.ZodType<ApprovalRequest>;
export type ApprovalRequestInput = z.infer<typeof approvalRequestSchema>;