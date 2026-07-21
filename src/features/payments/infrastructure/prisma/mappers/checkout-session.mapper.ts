import type { Prisma } from '@prisma/client';
import type {
  CheckoutSessionEntity,
  CheckoutSessionStatus,
} from '@/features/payments/domain';
import type { DB_CheckoutSession } from '../checkout-session.select';

/**
 * Translates between the Prisma `CheckoutSession` model and the
 * `CheckoutSessionEntity` domain aggregate. This mapper is an implementation
 * detail of the CheckoutSession repository.
 */
export const CheckoutSessionMapper = {
  toDomain(db: DB_CheckoutSession): CheckoutSessionEntity {
    return {
      id: db.id,
      orderId: db.orderId,
      userId: db.userId,
      provider: db.provider,
      providerSessionId: db.providerSessionId,
      status: db.status as CheckoutSessionStatus,
      amountCents: db.amountCents,
      currency: db.currency,
      url: db.url,
      expiresAt: db.expiresAt,
      createdAt: db.createdAt,
    };
  },

  toCreateInput(
    session: CheckoutSessionEntity,
  ): Prisma.CheckoutSessionUncheckedCreateInput {
    return {
      id: session.id,
      orderId: session.orderId,
      userId: session.userId,
      provider: session.provider,
      providerSessionId: session.providerSessionId,
      status: session.status,
      amountCents: session.amountCents,
      currency: session.currency,
      url: session.url,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
    };
  },
};
