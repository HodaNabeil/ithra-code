import { NextRequest } from 'next/server';

import {
  Permission,
  RolePermissions,
  hasPermission,
} from '@/constants/permissions.enum';
import { courseIdOrSlugSchema } from '@/features/enrollments/api/validation/enroll-course-params';
import {
  EnrollmentError,
  EnrollmentValidationError,
} from '@/features/enrollments/application/errors/enrollment.errors';
import { enrollInFreeCourseUseCase } from '@/features/enrollments/application/use-cases/enroll-in-free-course.use-case';
import {
  checkFreeEnrollRateLimit,
  getClientIp,
} from '@/features/enrollments/infrastructure/rate-limit/enroll-rate-limit';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseIdOrSlug: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError('يجب تسجيل الدخول للتسجيل في الدورة', 401);
    }

    if (
      !hasPermission(
        session.user.role as keyof typeof RolePermissions,
        Permission.ENROLLMENT_CREATE,
      ) ||
      !hasPermission(
        session.user.role as keyof typeof RolePermissions,
        Permission.COURSE_ENROLL,
      )
    ) {
      return apiError('ليس لديك صلاحية', 403);
    }

    await checkFreeEnrollRateLimit({
      userId: session.user.id,
      ip: getClientIp(req),
    });

    const { courseIdOrSlug } = await params;
    const parsedCourseRef = courseIdOrSlugSchema.safeParse(courseIdOrSlug);

    if (!parsedCourseRef.success) {
      throw new EnrollmentValidationError(
        parsedCourseRef.error.issues[0]?.message ?? 'معرّف الدورة غير صالح',
      );
    }

    const data = await enrollInFreeCourseUseCase({
      studentId: session.user.id,
      courseIdOrSlug: parsedCourseRef.data,
    });

    return apiSuccess(data, 'تم التسجيل في الدورة بنجاح');
  } catch (error) {
    if (error instanceof EnrollmentError) {
      return apiError(error.message, error.status);
    }

    console.error('[FREE_ENROLL_ERROR]', error);
    return apiError('حدث خطأ غير متوقع أثناء التسجيل في الدورة', 500);
  }
}
