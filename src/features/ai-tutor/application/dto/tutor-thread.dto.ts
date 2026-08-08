import { z } from 'zod';

import type { MessageSourceDTO } from './message-source.dto';

export const getTutorThreadInputSchema = z.object({
  courseSlug: z.string().trim().min(1, 'معرف الدورة مطلوب'),
  lectureId: z.string().trim().optional(),
  lectureTitle: z.string().trim().optional(),
});

export type GetTutorThreadInputDTO = z.infer<typeof getTutorThreadInputSchema>;

export type TutorThreadMessagesDTO = {
  threadId: string | null;
  conversationId: string | null;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    status?: 'pending' | 'completed' | 'failed' | 'cancelled';
    turnId?: string;
    sources?: MessageSourceDTO[];
    createdAt: string;
  }>;
};
