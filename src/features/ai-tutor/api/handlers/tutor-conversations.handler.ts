import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

import { buildTutorSessionContext } from '../../application/services/course-context.service';
import { filterConversationsByAccessibleCourses } from '../../application/services/enrollment-access.service';
import { AskTutorError } from '../../application/errors/ask-tutor.errors';
import { AITutorConfig } from '../../infrastructure/config/ai-tutor.config';
import {
  getConversationRepository,
  getCourseContextRepository,
  getSessionContextDeps,
  getStudentLearningProfileRepository,
} from '../../infrastructure/di/ai-tutor-container';
import { getSessionContextCacheKey } from '../../application/services/course-context.service';

export async function handleListTutorConversationsRequest(
  request: Request,
): Promise<Response> {
  if (!AITutorConfig.isEnabled()) {
    return apiError('ميزة المدرس الذكي غير مفعّلة', 503);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return apiError('يجب تسجيل الدخول', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const courseSlug = searchParams.get('courseSlug')?.trim();
    const repository = getConversationRepository();

    if (courseSlug) {
      const context = await buildTutorSessionContext(
        { courseSlug, userId: session.user.id },
        getSessionContextDeps(),
      );
      const conversation = await repository.findConversation(
        context.courseId,
        session.user.id,
      );

      return apiSuccess(
        conversation ? [conversation] : [],
        'تم تحميل المحادثات',
      );
    }

    const conversations = await repository.getUserConversations(
      session.user.id,
    );
    const courseIds = [
      ...new Set(conversations.map((conversation) => conversation.courseId)),
    ];
    const accessibleCourseIds =
      await getCourseContextRepository().getAccessibleCourseIds(
        session.user.id,
        courseIds,
      );
    const accessibleConversations = filterConversationsByAccessibleCourses(
      conversations,
      accessibleCourseIds,
    );

    return apiSuccess(accessibleConversations, 'تم تحميل المحادثات');
  } catch (error) {
    if (error instanceof AskTutorError) {
      return apiError(error.message, error.status);
    }

    return apiError('فشل تحميل المحادثات', 500);
  }
}

export async function handleDeleteTutorConversationsRequest(
  request: Request,
): Promise<Response> {
  if (!AITutorConfig.isEnabled()) {
    return apiError('ميزة المدرس الذكي غير مفعّلة', 503);
  }

  const session = await auth();
  if (!session?.user?.id) {
    return apiError('يجب تسجيل الدخول', 401);
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      courseSlug?: string;
    } | null;

    const courseSlug = body?.courseSlug?.trim();
    if (!courseSlug) {
      return apiError('معرف الدورة مطلوب', 400);
    }

    const context = await buildTutorSessionContext(
      { courseSlug, userId: session.user.id },
      getSessionContextDeps(),
    );

    const repository = getConversationRepository();
    const conversation = await repository.findConversation(
      context.courseId,
      session.user.id,
    );

    if (!conversation) {
      return apiSuccess({ deleted: false }, 'لا توجد محادثة لحذفها');
    }

    const deleted = await repository.deleteConversation(conversation.id);

    await getStudentLearningProfileRepository().deleteByUserAndCourse({
      userId: session.user.id,
      courseId: context.courseId,
    });

    await getSessionContextDeps().sessionContextCache.invalidate(
      getSessionContextCacheKey({
        userId: session.user.id,
        courseSlug,
      }),
    );

    return apiSuccess({ deleted }, 'تم حذف سجل المحادثة');
  } catch (error) {
    if (error instanceof AskTutorError) {
      return apiError(error.message, error.status);
    }

    return apiError('فشل حذف المحادثة', 500);
  }
}
