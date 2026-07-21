import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { WebhookEventEntity } from '@/features/payments/domain';
import type { WebhookEventRepository } from '@/features/payments/application/ports';
import type { PrismaClientLike } from '../prisma.types';

/**
 * Prisma-backed WebhookEvent repository.
 * Unique `(provider, providerEventId)` enforces idempotency at the DB layer.
 */
export class PrismaWebhookEventRepository implements WebhookEventRepository {
  constructor(private readonly db: PrismaClientLike = prisma) {}

  async save(event: WebhookEventEntity): Promise<WebhookEventEntity> {
    const created = await this.db.webhookEvent.create({
      data: {
        id: event.id,
        provider: event.provider,
        type: event.type,
        providerEventId: event.providerEventId,
        payload: event.payload as Prisma.InputJsonValue,
        receivedAt: event.receivedAt,
      },
    });

    return {
      id: created.id,
      provider: created.provider,
      type: created.type,
      providerEventId: created.providerEventId,
      receivedAt: created.receivedAt,
      payload: created.payload,
    };
  }
}

export const prismaWebhookEventRepository = new PrismaWebhookEventRepository();
