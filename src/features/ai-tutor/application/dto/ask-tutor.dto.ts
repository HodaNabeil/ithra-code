import { z } from 'zod';

import { AI_TUTOR_CONSTANTS } from '../../shared';
import type { MessageSourceDTO } from './message-source.dto';

export const askTutorInputSchema = z.object({
  question: z
    .string()
    .trim()
    .min(AI_TUTOR_CONSTANTS.MIN_MESSAGE_LENGTH, 'السؤال مطلوب')
    .max(
      AI_TUTOR_CONSTANTS.MAX_MESSAGE_LENGTH,
      `السؤال طويل جداً (الحد الأقصى ${AI_TUTOR_CONSTANTS.MAX_MESSAGE_LENGTH} حرف)`,
    ),
  courseSlug: z.string().trim().min(1, 'معرف الدورة مطلوب'),
  lectureId: z.string().trim().optional(),
  lectureTitle: z.string().trim().optional(),
  courseTitle: z.string().trim().optional(),
});

export type AskTutorInputDTO = z.infer<typeof askTutorInputSchema>;

export type AskTutorResultDTO = {
  threadId: string;
  conversationId: string;
  sources?: MessageSourceDTO[];
  usedFallback?: boolean;
};

export type AskTutorStreamMeta = {
  sources: MessageSourceDTO[];
  usedFallback: boolean;
};
