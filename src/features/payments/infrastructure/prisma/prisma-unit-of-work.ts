import type { PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  TransactionalRepositories,
  UnitOfWork,
} from '@/features/payments/application/ports';
import { PrismaCartFulfillmentRepository } from './repositories/prisma-cart-fulfillment.repository';
import { PrismaCheckoutSessionRepository } from './repositories/prisma-checkout-session.repository';
import { PrismaEnrollmentRepository } from './repositories/prisma-enrollment.repository';
import { PrismaOrderRepository } from './repositories/prisma-order.repository';
import { PrismaPaymentRepository } from './repositories/prisma-payment.repository';
import { PrismaWebhookEventRepository } from './repositories/prisma-webhook-event.repository';

/**
 * Prisma-backed Unit of Work.
 *
 * Coordinates atomic transactions across the payment repositories by binding
 * each repository to the same `$transaction` client. The transaction commits
 * when the callback resolves and rolls back if it throws.
 */
export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly client: PrismaClient = prisma) {}

  execute<T>(
    work: (repositories: TransactionalRepositories) => Promise<T>,
  ): Promise<T> {
    return this.client.$transaction((tx) => {
      const repositories: TransactionalRepositories = {
        orders: new PrismaOrderRepository(tx),
        payments: new PrismaPaymentRepository(tx),
        checkoutSessions: new PrismaCheckoutSessionRepository(tx),
        webhookEvents: new PrismaWebhookEventRepository(tx),
        enrollments: new PrismaEnrollmentRepository(tx),
        carts: new PrismaCartFulfillmentRepository(tx),
      };

      return work(repositories);
    });
  }
}

export const prismaUnitOfWork = new PrismaUnitOfWork();
