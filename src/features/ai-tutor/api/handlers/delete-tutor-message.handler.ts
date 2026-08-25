import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { AITutorConfig } from '../../infrastructure/config/ai-tutor.config';
import { isCourseAccessible } from '../../application/services/enrollment-access.service';
import {
  getConversationRepository,
  getCourseContextRepository,
} from '../../infrastructure/di/ai-tutor-container';

export async function handleDeleteTutorMessageRequest(
  _request: Request,
  messageId: string,
): Promise<Response> {
  if (!AITutorConfig.isEnabled()) {
    return apiError('ميزة المدرس الذكي غير مفعّلة', 503);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return apiError('يجب تسجيل الدخول', 401);
  }

  const repository = getConversationRepository();
  const message = await repository.getMessage(messageId);

  if (!message) {
    return apiError('الرسالة غير موجودة', 404);
  }

  const conversations = await repository.getUserConversations(session.user.id);
  const conversation = conversations.find((item) =>
    item.threads.some((thread) => thread.id === message.threadId),
  );
  const ownsMessage = Boolean(conversation);

  if (!ownsMessage || !conversation) {
    return apiError('غير مصرح لك بحذف هذه الرسالة', 403);
  }

  const accessibleCourseIds =
    await getCourseContextRepository().getAccessibleCourseIds(session.user.id, [
      conversation.courseId,
    ]);
  if (!isCourseAccessible(conversation.courseId, accessibleCourseIds)) {
    return apiError('غير مصرح لك بحذف هذه الرسالة', 403);
  }

  const deleted = await repository.deleteMessage(messageId);
  return apiSuccess({ deleted }, 'تم حذف الرسالة');
}
