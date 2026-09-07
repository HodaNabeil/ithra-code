import { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { UserCourseSignals } from '@/features/courses/course-detail/dto/course-detail.dto';

export type CourseEnrollmentState = {
  isEnrolled: boolean;
  isInCart: boolean;
};

/** Shared enrollment + cart lookup used by API, SSR, and cart flows. */
export async function findUserCourseSignals(
  userId: string,
  courseId: string,
): Promise<UserCourseSignals> {
  const [cartItem, enrollment] = await Promise.all([
    prisma.cartItem.findFirst({
      where: {
        courseId,
        cart: { userId },
      },
      select: { id: true },
    }),
    prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userId,
          courseId,
        },
      },
      select: { status: true },
    }),
  ]);

  const enrollmentStatus = enrollment?.status ?? null;

  return {
    isPurchased: enrollmentStatus === EnrollmentStatus.ACTIVE,
    isInCart: !!cartItem,
    enrollmentStatus,
  };
}

export async function getIsUserEnrolledInCourse(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const signals = await findUserCourseSignals(userId, courseId);
  return signals.isPurchased;
}

/** Returns true when the student's enrollment allows access to course content
 * (ACTIVE = currently enrolled, COMPLETED = finished the course). */
export async function canAccessCourseContent(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const signals = await findUserCourseSignals(userId, courseId);
  return (
    signals.enrollmentStatus === EnrollmentStatus.ACTIVE ||
    signals.enrollmentStatus === EnrollmentStatus.COMPLETED
  );
}

export async function resolveCourseEnrollmentState(
  courseId: string,
  userId?: string,
): Promise<CourseEnrollmentState> {
  if (!userId) {
    return { isEnrolled: false, isInCart: false };
  }

  const signals = await findUserCourseSignals(userId, courseId);

  return {
    isEnrolled: signals.isPurchased,
    isInCart: signals.isInCart,
  };
}
