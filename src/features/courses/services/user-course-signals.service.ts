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
