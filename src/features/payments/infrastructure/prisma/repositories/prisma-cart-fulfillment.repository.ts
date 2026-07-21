import { prisma } from '@/lib/prisma';
import type { CartFulfillmentRepository } from '@/features/payments/application/ports';
import type { PrismaClientLike } from '../prisma.types';

/**
 * Clears a user's cart as part of payment fulfillment.
 * Runs through the same transactional client as the Unit of Work.
 */
export class PrismaCartFulfillmentRepository
  implements CartFulfillmentRepository
{
  constructor(private readonly db: PrismaClientLike = prisma) {}

  async clearForUser(userId: string): Promise<void> {
    const cart = await this.db.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      return;
    }

    await this.db.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.db.cart.update({
      where: { id: cart.id },
      data: {
        couponId: null,
        subtotal: 0,
        discount: 0,
        total: 0,
      },
    });
  }
}

export const prismaCartFulfillmentRepository =
  new PrismaCartFulfillmentRepository();
