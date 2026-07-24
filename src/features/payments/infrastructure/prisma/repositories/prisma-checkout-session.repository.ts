import { prisma } from '@/lib/prisma';
import type { CheckoutSessionEntity } from '@/features/payments/domain';
import type { CheckoutSessionRepository } from '@/features/payments/application/ports';
import { CheckoutSessionMapper } from '../mappers/checkout-session.mapper';
import type { PrismaClientLike } from '../prisma.types';

/**
 * Prisma-backed implementation of the CheckoutSession persistence port.
 * Manages the CheckoutSession aggregate only.
 */
export class PrismaCheckoutSessionRepository
  implements CheckoutSessionRepository
{
  constructor(private readonly db: PrismaClientLike = prisma) {}

  async save(session: CheckoutSessionEntity): Promise<CheckoutSessionEntity> {
    const created = await this.db.checkoutSession.create({
      data: CheckoutSessionMapper.toCreateInput(session),
    });

    return CheckoutSessionMapper.toDomain(created);
  }

  async findOpenByOrderId(
    orderId: string,
  ): Promise<CheckoutSessionEntity | null> {
    const session = await this.db.checkoutSession.findFirst({
      where: { orderId, status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });

    return session ? CheckoutSessionMapper.toDomain(session) : null;
  }

  async markExpired(sessionId: string): Promise<void> {
    await this.db.checkoutSession.update({
      where: { id: sessionId },
      data: { status: 'EXPIRED' },
    });
  }
}

export const prismaCheckoutSessionRepository =
  new PrismaCheckoutSessionRepository();
