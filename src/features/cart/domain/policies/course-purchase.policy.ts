import {
  CourseStatus,
  CourseVisibility,
  EnrollmentStatus,
  type Currency,
} from '@/generated/prisma/enums';
import { CartError, CART_ERROR_CODES } from '../errors/cart.errors';

export type CourseForPurchase = {
  id: string;
  price: number;
  currency: Currency;
  status: CourseStatus;
  visibility: CourseVisibility;
};

export type EnrollmentRecord = {
  status: EnrollmentStatus;
};

export function assertCoursePurchasable(course: CourseForPurchase): void {
  if (course.status !== CourseStatus.PUBLISHED) {
    throw new CartError(
      400,
      'هذه الدورة غير متاحة للشراء حالياً',
      'COURSE_NOT_PUBLISHED',
    );
  }

  if (course.visibility !== CourseVisibility.PUBLIC) {
    throw new CartError(
      400,
      'هذه الدورة غير متاحة للشراء حالياً',
      'COURSE_NOT_PUBLISHED',
    );
  }

  if (course.price <= 0) {
    throw new CartError(
      400,
      'الدورات المجانية لا تُضاف إلى السلة — يمكنك التسجيل مباشرة',
      'FREE_COURSE',
    );
  }
}

export function assertNotEnrolled(enrollment: EnrollmentRecord | null): void {
  if (!enrollment) return;

  if (
    enrollment.status === EnrollmentStatus.ACTIVE ||
    enrollment.status === EnrollmentStatus.COMPLETED
  ) {
    throw new CartError(
      400,
      'لقد اشتريت هذه الدورة مسبقاً',
      'ALREADY_ENROLLED',
    );
  }
}

export function assertNotDuplicate(
  existingCourseIds: string[],
  courseId: string,
): void {
  if (existingCourseIds.includes(courseId)) {
    throw new CartError(
      400,
      'هذه الدورة موجودة بالفعل في السلة',
      CART_ERROR_CODES.ALREADY_IN_CART,
    );
  }
}

export function assertCurrencyCompatible(
  cartCurrency: Currency,
  courseCurrency: Currency,
  hasItems: boolean,
): void {
  if (!hasItems) return;

  if (cartCurrency !== courseCurrency) {
    throw new CartError(
      400,
      'لا يمكن إضافة دورات بعملات مختلفة إلى نفس السلة',
      'CURRENCY_MISMATCH',
    );
  }
}
