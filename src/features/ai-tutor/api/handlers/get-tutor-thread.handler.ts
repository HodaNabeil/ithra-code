import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { getTutorThreadInputSchema } from '../../application/dto/tutor-thread.dto';
import { AskTutorError } from '../../application/errors/ask-tutor.errors';
import { AITutorConfig } from '../../infrastructure/config/ai-tutor.config';
import {
  getTutorThreadMessagesUseCase,
  getTutorThreadMessagesUseCaseDeps,
} from '../../infrastructure/di/ai-tutor-container';

export async function handleGetTutorThreadRequest(
  request: Request,
): Promise<Response> {
  if (!AITutorConfig.isEnabled()) {
    return apiError('ميزة المدرس الذكي غير مفعّلة', 503);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return apiError('يجب تسجيل الدخول لاستخدام المدرس الذكي', 401);
  }

  const { searchParams } = new URL(request.url);
  const parsed = getTutorThreadInputSchema.safeParse({
    courseSlug: searchParams.get('courseSlug'),
    lectureId: searchParams.get('lectureId') ?? undefined,
    lectureTitle: searchParams.get('lectureTitle') ?? undefined,
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'بيانات الطلب غير صالحة';
    return apiError(message, 400);
  }

  try {
    const data = await getTutorThreadMessagesUseCase(
      {
        ...parsed.data,
        userId: session.user.id,
      },
      getTutorThreadMessagesUseCaseDeps(),
    );

    return apiSuccess(data, 'تم جلب سجل المحادثة بنجاح');
  } catch (error) {
    if (error instanceof AskTutorError) {
      return apiError(error.message, error.status);
    }

    console.error('[AI_TUTOR_THREAD_ERROR]', error);
    return apiError('حدث خطأ أثناء تحميل المحادثة', 500);
  }
}
