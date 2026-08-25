import { EnrollmentStatus } from '@/generated/prisma/enums';
import { prisma } from '@/lib/prisma';
import type {
  AddCartItemInput,
  CartRepository,
  CartTotals,
} from '../../../domain/repositories/cart.repository';
import { cartWithItemsInclude, type DB_CartWithItems } from '../cart.select';

export class PrismaCartRepository implements CartRepository {
  async findByUserId(userId: string): Promise<DB_CartWithItems | null> {
    return prisma.cart.findUnique({
      where: { userId },
      include: cartWithItemsInclude,
    });
  }

  async findOrCreateByUserId(userId: string): Promise<DB_CartWithItems> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;

    return prisma.cart.create({
      data: { userId },
      include: cartWithItemsInclude,
    });
  }

  async addItem(input: AddCartItemInput): Promise<void> {
    await prisma.cartItem.create({
      data: {
        cartId: input.cartId,
        courseId: input.courseId,
        price: input.price,
        currency: input.currency,
      },
    });
  }

  async updateCurrency(
    cartId: string,
    currency: AddCartItemInput['currency'],
  ): Promise<void> {
    await prisma.cart.update({
      where: { id: cartId },
      data: { currency },
    });
  }

  async updateTotals(cartId: string, totals: CartTotals): Promise<void> {
    await prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
      },
    });
  }

  async clearCoupon(cartId: string): Promise<void> {
    await prisma.cart.update({
      where: { id: cartId },
      data: { couponId: null },
    });
  }

  async removeItems(cartId: string, courseIds: string[]): Promise<void> {
    if (courseIds.length === 0) return;

    await prisma.cartItem.deleteMany({
      where: { cartId, courseId: { in: courseIds } },
    });
  }

  async clearItems(cartId: string): Promise<void> {
    await prisma.cartItem.deleteMany({
      where: { cartId },
    });
  }

  async findActiveEnrollmentCourseIds(
    userId: string,
    courseIds: string[],
  ): Promise<Set<string>> {
    if (courseIds.length === 0) return new Set();

    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: userId,
        courseId: { in: courseIds },
        status: EnrollmentStatus.ACTIVE,
      },
      select: { courseId: true },
    });

    return new Set(enrollments.map((e) => e.courseId));
  }
}

export const prismaCartRepository = new PrismaCartRepository();
export const cartRepository = prismaCartRepository;
