import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(5000),
});

export const chatScopeSchema = z
  .object({
    userId: z.string().min(1),
    courseId: z.string().optional(),
    lectureId: z.string().optional(),
  })
  .passthrough();

export const chatOptionsSchema = z.object({
  locale: z.string().optional(),
  threadId: z.string().optional(),
  conversationId: z.string().optional(),
});

export const chatRequestSchema = z.object({
  appId: z.string().min(1),
  messages: z.array(chatMessageSchema).min(1),
  scope: chatScopeSchema,
  options: chatOptionsSchema.optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
