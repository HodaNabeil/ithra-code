import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { AskTutorError } from '../../application/errors/ask-tutor.errors';
import { isCourseAccessible } from '../../application/services/enrollment-access.service';
import { AITutorConfig } from '../../infrastructure/config/ai-tutor.config';
import {
  getConversationRepository,
  getCourseContextRepository,
} from '../../infrastructure/di/ai-tutor-container';
import { AI_TUTOR_CONSTANTS } from '../../shared';

export async function handleGetTutorThreadByIdRequest(
  _request: Request,
  threadId: string,
): Promise<Response> {
  if (!AITutorConfig.isEnabled()) {
    return apiError('ميزة المدرس الذكي غير مفعّلة', 503);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return apiError('يجب تسجيل الدخول', 401);
  }

  try {
    const repository = getConversationRepository();
    const conversations = await repository.getUserConversations(
      session.user.id,
    );
    const conversation = conversations.find((item) =>
      item.threads.some((thread) => thread.id === threadId),
    );
    const thread = conversation?.threads.find((item) => item.id === threadId);

    if (!thread || !conversation) {
      return apiError('الموضوع غير موجود', 404);
    }

    const accessibleCourseIds =
      await getCourseContextRepository().getAccessibleCourseIds(
        session.user.id,
        [conversation.courseId],
      );
    if (!isCourseAccessible(conversation.courseId, accessibleCourseIds)) {
      return apiError('غير مصرح لك بالوصول إلى هذه المحادثة', 403);
    }

    const messages = await repository.getThreadMessages(
      thread.id,
      AI_TUTOR_CONSTANTS.CONVERSATION_HISTORY_LIMIT,
    );

    return apiSuccess(
      {
        threadId: thread.id,
        conversationId: thread.conversationId,
        messages: messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          sources: message.retrievedSources,
          createdAt: message.createdAt.toISOString(),
        })),
      },
      'تم تحميل المحادثة',
    );
  } catch (error) {
    if (error instanceof AskTutorError) {
      return apiError(error.message, error.status);
    }

    return apiError('فشل تحميل المحادثة', 500);
  }
}
