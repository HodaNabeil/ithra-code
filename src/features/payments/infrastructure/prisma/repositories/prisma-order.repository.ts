import { prisma } from '@/lib/prisma';
import type { OrderEntity } from '@/features/payments/domain';
import type { OrderRepository } from '@/features/payments/application/ports';
import { orderWithItemsInclude } from '../order.select';
import { OrderMapper } from '../mappers/order.mapper';
import type { PrismaClientLike } from '../prisma.types';

/**
 * Prisma-backed implementation of the Order persistence port.
 * Manages the Order aggregate only (order + order items).
 */
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly db: PrismaClientLike = prisma) {}

  async save(order: OrderEntity): Promise<OrderEntity> {
    const created = await this.db.order.create({
      data: OrderMapper.toCreateInput(order),
      include: orderWithItemsInclude,
    });

    return OrderMapper.toDomain(created);
  }

  async findById(orderId: string): Promise<OrderEntity | null> {
    const order = await this.db.order.findUnique({
      where: { id: orderId },
      include: orderWithItemsInclude,
    });

    return order ? OrderMapper.toDomain(order) : null;
  }

  async markCompleted(orderId: string): Promise<void> {
    await this.db.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }
}

export const prismaOrderRepository = new PrismaOrderRepository();
