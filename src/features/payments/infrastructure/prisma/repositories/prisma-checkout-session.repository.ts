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
}

export const prismaCheckoutSessionRepository =
  new PrismaCheckoutSessionRepository();
