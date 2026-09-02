import {
  CourseStatus,
  CourseVisibility,
  type Currency,
} from '@/generated/prisma/enums';
import { SUPPORTED_CHECKOUT_CURRENCIES } from '@/constants/currency';
import { isCouponValid } from '@/features/cart/mappers/cart.mapper';
import type { DB_CartCoupon } from '@/features/cart/infrastructure/prisma/cart.select';
import { isSupportedPaymentProvider } from '@/features/payments/domain';
import { CheckoutError } from '../errors/checkout.errors';

export { SUPPORTED_CHECKOUT_CURRENCIES };

export type CheckoutCartCourse = {
  id: string;
  instructorId: string;
  price: number;
  currency: Currency;
  status: CourseStatus;
  visibility: CourseVisibility;
};

export type CheckoutCartItem = {
  courseId: string;
  price: number;
  currency: Currency;
  course: CheckoutCartCourse | null;
};

export type CheckoutCartSnapshot = {
  id: string;
  userId: string;
  currency: Currency;
  coupon: DB_CartCoupon | null;
  items: CheckoutCartItem[];
};

export type CheckoutValidationInput = {
  userId: string;
  provider: string;
  cart: CheckoutCartSnapshot | null;
  enrolledCourseIds: ReadonlySet<string>;
};

/** Validates checkout preconditions without persistence or payment logic. */
export class CheckoutValidator {
  /**
   * Ensures the checkout request and cart state satisfy all business rules.
   * @throws {CheckoutError} when validation fails.
   */
  validate(input: CheckoutValidationInput): void {
    this.assertAuthenticatedUser(input.userId);
    this.assertSupportedProvider(input.provider);
    this.assertCartExists(input.cart);
    this.assertCartNotEmpty(input.cart!);
    this.assertSupportedCurrency(input.cart!);
    this.assertCartItems(input.userId, input.cart!, input.enrolledCourseIds);
    this.assertCouponValid(input.cart!);
  }

  private assertAuthenticatedUser(userId: string): void {
    if (!userId.trim()) {
      throw new CheckoutError(401, 'يجب تسجيل الدخول للمتابعة', 'UNAUTHORIZED');
    }
  }

  private assertSupportedProvider(provider: string): void {
    if (!isSupportedPaymentProvider(provider)) {
      throw new CheckoutError(
        400,
        'مزود الدفع غير مدعوم',
        'UNSUPPORTED_PROVIDER',
      );
    }
  }

  private assertCartExists(
    cart: CheckoutCartSnapshot | null,
  ): asserts cart is CheckoutCartSnapshot {
    if (!cart) {
      throw new CheckoutError(404, 'السلة غير موجودة', 'CART_NOT_FOUND');
    }
  }

  private assertCartNotEmpty(cart: CheckoutCartSnapshot): void {
    if (cart.items.length === 0) {
      throw new CheckoutError(400, 'السلة فارغة', 'EMPTY_CART');
    }
  }

  private assertSupportedCurrency(cart: CheckoutCartSnapshot): void {
    const currency = cart.items[0]?.currency ?? cart.currency;

    if (!SUPPORTED_CHECKOUT_CURRENCIES.includes(currency)) {
      throw new CheckoutError(
        400,
        'عملة السلة غير مدعومة للدفع',
        'UNSUPPORTED_CURRENCY',
      );
    }

    const hasMixedCurrencies = cart.items.some(
      (item) => item.currency !== currency,
    );

    if (hasMixedCurrencies) {
      throw new CheckoutError(
        400,
        'لا يمكن إتمام الدفع لسلة بعملات مختلفة',
        'UNSUPPORTED_CURRENCY',
      );
    }
  }

  private assertCartItems(
    userId: string,
    cart: CheckoutCartSnapshot,
    enrolledCourseIds: ReadonlySet<string>,
  ): void {
    for (const item of cart.items) {
      if (!item.course || !item.course.instructorId) {
        throw new CheckoutError(
          404,
          'إحدى الدورات في السلة غير موجودة',
          'COURSE_NOT_FOUND',
        );
      }

      if (
        item.course.status !== CourseStatus.PUBLISHED ||
        item.course.visibility !== CourseVisibility.PUBLIC
      ) {
        throw new CheckoutError(
          400,
          'إحدى الدورات في السلة غير متاحة للشراء',
          'COURSE_NOT_PUBLISHED',
        );
      }

      if (enrolledCourseIds.has(item.courseId)) {
        throw new CheckoutError(
          400,
          'لقد اشتريت إحدى الدورات في السلة مسبقاً',
          'ALREADY_ENROLLED',
        );
      }

      if (item.course.instructorId === userId) {
        throw new CheckoutError(
          400,
          'لا يمكنك شراء دورتك الخاصة',
          'OWN_COURSE',
        );
      }
    }
  }

  private assertCouponValid(cart: CheckoutCartSnapshot): void {
    if (!cart.coupon) {
      return;
    }

    const subtotalCents = cart.items.reduce((total, item) => {
      return total + Math.round(Number(item.course?.price ?? 0) * 100);
    }, 0);

    if (!isCouponValid(cart.coupon, subtotalCents / 100)) {
      throw new CheckoutError(400, 'كود الخصم غير صالح', 'INVALID_COUPON');
    }
  }
}
