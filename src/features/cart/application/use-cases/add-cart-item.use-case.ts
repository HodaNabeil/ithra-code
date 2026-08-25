import { CartError } from '../../domain/errors/cart.errors';
import {
  assertCoursePurchasable,
  assertCurrencyCompatible,
  assertNotDuplicate,
  assertNotEnrolled,
} from '../../domain/policies/course-purchase.policy';
import type { CartRepository } from '../../domain/repositories/cart.repository';
import type { CourseRepository } from '../../domain/repositories/course.repository';
import type { EnrollmentRepository } from '../../domain/repositories/enrollment.repository';
import { prismaCartRepository } from '../../infrastructure/prisma/repositories/prisma-cart.repository';
import { prismaCourseRepository } from '../../infrastructure/prisma/repositories/prisma-course.repository';
import { prismaEnrollmentRepository } from '../../infrastructure/prisma/repositories/prisma-enrollment.repository';
import { mapCartToDto } from '../../mappers/cart.mapper';
import type {
  AddCartItemInputDTO,
  AddCartItemOutputDTO,
} from '../dto/add-cart-item.dto';
import { recalculateCartTotals } from '../services/cart-totals.service';

export type AddCartItemUseCaseDeps = {
  cartRepository?: CartRepository;
  courseRepository?: CourseRepository;
  enrollmentRepository?: EnrollmentRepository;
};

/** Adds a paid published course to the user's cart and returns the updated cart. */
export async function addCartItemUseCase(
  input: AddCartItemInputDTO,
  deps: AddCartItemUseCaseDeps = {},
): Promise<AddCartItemOutputDTO> {
  const cartRepository = deps.cartRepository ?? prismaCartRepository;
  const courseRepository = deps.courseRepository ?? prismaCourseRepository;
  const enrollmentRepository =
    deps.enrollmentRepository ?? prismaEnrollmentRepository;

  const { userId, courseId } = input;

  const course = await courseRepository.findByIdForPurchase(courseId);
  if (!course) {
    throw new CartError(404, 'هذه الدورة غير موجودة', 'COURSE_NOT_FOUND');
  }

  assertCoursePurchasable(course);

  const enrollment = await enrollmentRepository.findByStudentAndCourse(
    userId,
    courseId,
  );
  assertNotEnrolled(enrollment);

  const cart = await cartRepository.findOrCreateByUserId(userId);

  const existingCourseIds = cart.items.map((item) => item.courseId);
  assertNotDuplicate(existingCourseIds, courseId);
  assertCurrencyCompatible(
    cart.currency,
    course.currency,
    cart.items.length > 0,
  );

  if (cart.items.length === 0 && cart.currency !== course.currency) {
    await cartRepository.updateCurrency(cart.id, course.currency);
  }

  await cartRepository.addItem({
    cartId: cart.id,
    courseId,
    price: course.price,
    currency: course.currency,
  });

  const refreshedCart = await cartRepository.findByUserId(userId);
  if (!refreshedCart) {
    throw new CartError(500, 'فشل تحميل السلة', 'VALIDATION_ERROR');
  }

  const totals = await recalculateCartTotals(refreshedCart, cartRepository);

  const cartForDto = totals.couponCleared
    ? { ...refreshedCart, coupon: null }
    : refreshedCart;

  return mapCartToDto(cartForDto, userId, {
    discount: totals.discount,
    coupon: cartForDto.coupon,
  });
}
