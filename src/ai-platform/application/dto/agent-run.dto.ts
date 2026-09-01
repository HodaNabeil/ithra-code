import { z } from 'zod';

export const agentScopeSchema = z
  .object({
    userId: z.string().min(1),
    courseId: z.string().optional(),
    lectureId: z.string().optional(),
    threadId: z.string().optional(),
    conversationId: z.string().optional(),
  })
  .catchall(z.string().optional());

export const agentRunOptionsSchema = z.object({
  promptVersion: z.string().optional(),
  promptLabel: z.string().optional(),
  modelOverride: z.string().optional(),
  maxTokens: z.number().int().positive().optional(),
  correlationId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  locale: z.string().optional(),
  signal: z
    .custom<AbortSignal>(
      (value) => value === undefined || value instanceof AbortSignal,
    )
    .optional(),
});

export const agentRunRequestSchema = z.object({
  userId: z.string().min(1),
  input: z.string().min(1).max(5000),
  locale: z.enum(['ar', 'en']).optional(),
  scope: agentScopeSchema,
  options: agentRunOptionsSchema.optional(),
});

export type AgentRunRequestDto = z.infer<typeof agentRunRequestSchema>;
