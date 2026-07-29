import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { indexCourseInputSchema } from '../../application/dto/index-course.dto';
import { IndexingError } from '../../application/errors/indexing.errors';
import { AITutorConfig } from '../../infrastructure/config/ai-tutor.config';
import {
  getIndexCourseUseCaseDeps,
  indexCourseUseCase,
} from '../../infrastructure/di/ai-tutor-container';

export async function handleIndexCourseRequest(request: Request): Promise<Response> {
  if (!AITutorConfig.isEnabled()) {
    return apiError('ميزة المدرس الذكي غير مفعّلة', 503);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return apiError('يجب تسجيل الدخول لفهرسة المحتوى', 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('صيغة الطلب غير صالحة', 400);
  }

  const parsed = indexCourseInputSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'بيانات الطلب غير صالحة';
    return apiError(message, 400);
  }

  try {
    const data = await indexCourseUseCase(
      {
        ...parsed.data,
        userId: session.user.id,
        userRole: session.user.role,
      },
      getIndexCourseUseCaseDeps(),
    );

    return apiSuccess(data, 'تم فهرسة محتوى الدورة بنجاح');
  } catch (error) {
    if (error instanceof IndexingError) {
      return apiError(error.message, error.status);
    }

    console.error('[AI_TUTOR_INDEX_COURSE_ERROR]', error);
    return apiError('فشل فهرسة محتوى الدورة', 500);
  }
}
