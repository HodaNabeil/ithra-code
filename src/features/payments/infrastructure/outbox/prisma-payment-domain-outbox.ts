import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import type { PaymentDomainEvent } from '@/features/payments/application/events/payment-domain.event';
import type { PaymentDomainOutbox } from '@/features/payments/application/ports/payment-domain-outbox';

/**
 * Persists payment domain events for async downstream consumers.
 */
export class PrismaPaymentDomainOutbox implements PaymentDomainOutbox {
  async enqueue(event: PaymentDomainEvent): Promise<void> {
    await prisma.paymentDomainOutbox.create({
      data: {
        id: randomUUID(),
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        payload: event.payload as Prisma.InputJsonValue,
      },
    });
  }
}

export const prismaPaymentDomainOutbox = new PrismaPaymentDomainOutbox();
