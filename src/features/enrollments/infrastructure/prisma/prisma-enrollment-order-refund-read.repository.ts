import { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

import type { EnrollmentPurchaseDTO } from '../../application/dto/enrollment-list.dto';
import type { EnrollmentOrderRefundReadRepository } from '../../application/ports/enrollment-order-refund-read.repository';

function toIsoNullable(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function latestTimestamp(completedAt: Date | null, createdAt: Date): number {
  return (completedAt ?? createdAt).getTime();
}

export class PrismaEnrollmentOrderRefundReadRepository implements EnrollmentOrderRefundReadRepository {
  async findLatestByUserAndCourseIds(
    userId: string,
    courseIds: string[],
  ): Promise<Map<string, EnrollmentPurchaseDTO>> {
    const snapshots = new Map<string, EnrollmentPurchaseDTO>();

    if (courseIds.length === 0) {
      return snapshots;
    }

    const items = await prisma.orderItem.findMany({
      where: {
        courseId: { in: courseIds },
        order: {
          userId,
          status: {
            in: [OrderStatus.COMPLETED, OrderStatus.PARTIALLY_REFUNDED],
          },
        },
      },
      select: {
        id: true,
        courseId: true,
        status: true,
        refundedAt: true,
        refundRequest: {
          select: { status: true },
        },
        order: {
          select: {
            completedAt: true,
            createdAt: true,
          },
        },
      },
    });

    const latestByCourseId = new Map<
      string,
      (typeof items)[number] & { sortKey: number }
    >();

    for (const item of items) {
      const sortKey = latestTimestamp(
        item.order.completedAt,
        item.order.createdAt,
      );
      const current = latestByCourseId.get(item.courseId);

      if (!current || sortKey > current.sortKey) {
        latestByCourseId.set(item.courseId, { ...item, sortKey });
      }
    }

    for (const [courseId, item] of latestByCourseId) {
      snapshots.set(courseId, {
        orderItemId: item.id,
        status: item.status,
        refundStatus: item.refundRequest?.status ?? null,
        refundedAt: toIsoNullable(item.refundedAt),
      });
    }

    return snapshots;
  }
}

export const prismaEnrollmentOrderRefundReadRepository =
  new PrismaEnrollmentOrderRefundReadRepository();
