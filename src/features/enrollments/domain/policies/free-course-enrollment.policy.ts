import {
  CourseStatus,
  CourseVisibility,
  EnrollmentStatus,
} from '@/generated/prisma/enums';
import { EnrollmentError } from '../../application/errors/enrollment.errors';

export type CourseForFreeEnrollment = {
  id: string;
  slug: string;
  price: number;
  status: CourseStatus;
  visibility: CourseVisibility;
  maxStudents: number | null;
};

export type ExistingEnrollment = {
  status: EnrollmentStatus;
} | null;

/** Validates course eligibility for direct free enrollment (no enrollment state). */
export function assertCourseEligibleForFreeEnrollment(
  course: CourseForFreeEnrollment,
): void {
  if (course.status !== CourseStatus.PUBLISHED) {
    throw new EnrollmentError(
      400,
      'هذه الدورة غير متاحة للتسجيل حالياً',
      'COURSE_NOT_PUBLISHED',
    );
  }

  if (course.visibility !== CourseVisibility.PUBLIC) {
    throw new EnrollmentError(
      400,
      'هذه الدورة غير متاحة للتسجيل حالياً',
      'COURSE_NOT_PUBLISHED',
    );
  }

  if (course.price > 0) {
    throw new EnrollmentError(
      400,
      'هذه الدورة مدفوعة — يُرجى إضافتها إلى السلة',
      'NOT_FREE_COURSE',
    );
  }

  if (course.price !== 0) {
    throw new EnrollmentError(
      400,
      'هذه الدورة غير متاحة للتسجيل حالياً',
      'INVALID_COURSE_PRICE',
    );
  }
}

/**
 * Validates existing enrollment state before free (re-)enrollment.
 * DROPPED may be reactivated; REVOKED may not.
 */
export function assertEnrollmentEligibleForFreeEnrollment(
  enrollment: ExistingEnrollment,
): void {
  if (!enrollment) return;

  if (enrollment.status === EnrollmentStatus.REVOKED) {
    throw new EnrollmentError(
      403,
      'تم إلغاء تسجيلك في هذه الدورة ولا يمكنك إعادة التسجيل',
      'ENROLLMENT_REVOKED',
    );
  }

  if (
    enrollment.status === EnrollmentStatus.ACTIVE ||
    enrollment.status === EnrollmentStatus.COMPLETED
  ) {
    throw new EnrollmentError(
      400,
      'أنت مسجل بالفعل في هذه الدورة',
      'ALREADY_ENROLLED',
    );
  }
}

/** Returns true when the operation would add or reactivate an ACTIVE seat. */
export function willIncreaseActiveEnrollmentCount(
  enrollment: ExistingEnrollment,
): boolean {
  if (!enrollment) return true;
  return enrollment.status === EnrollmentStatus.DROPPED;
}

/** Enforces course capacity using ACTIVE enrollment count (must run under course row lock). */
export function assertCourseHasCapacity(
  maxStudents: number | null,
  activeEnrollmentCount: number,
  willIncreaseActiveCount: boolean,
): void {
  if (!willIncreaseActiveCount || maxStudents == null) {
    return;
  }

  if (activeEnrollmentCount >= maxStudents) {
    throw new EnrollmentError(
      400,
      'هذه الدورة ممتلئة ولا يمكن قبول تسجيلات جديدة',
      'COURSE_FULL',
    );
  }
}
