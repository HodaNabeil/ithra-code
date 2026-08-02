import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { AITutorConfig } from '../../infrastructure/config/ai-tutor.config';
import { getConversationRepository } from '../../infrastructure/di/ai-tutor-container';

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
  const ownsMessage = conversations.some((conversation) =>
    conversation.threads.some((thread) => thread.id === message.threadId),
  );

  if (!ownsMessage) {
    return apiError('غير مصرح لك بحذف هذه الرسالة', 403);
  }

  const deleted = await repository.deleteMessage(messageId);
  return apiSuccess({ deleted }, 'تم حذف الرسالة');
}
