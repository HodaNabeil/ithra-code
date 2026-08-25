/**
 * Ops helper for payments stuck in MANUAL_REVIEW.
 *
 * Usage:
 *   pnpm payment:reconcile-review --list
 *   pnpm payment:reconcile-review --requeue <paymentId>
 *   pnpm payment:reconcile-review --abandon <paymentId>
 */
import 'dotenv/config';
import { prisma } from '@/lib/prisma';
import { createReconcilePaymentsUseCase } from '@/features/payments/infrastructure/di/payments.container';
import { FulfillOrderService } from '@/features/payments/application/services/fulfill-order.service';
import { prismaUnitOfWork } from '@/features/payments/infrastructure/prisma/prisma-unit-of-work';

async function listManualReview(): Promise<void> {
  const rows = await prisma.payment.findMany({
    where: { reconcileStatus: 'MANUAL_REVIEW' },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
    },
    orderBy: { lastReconciledAt: 'asc' },
    take: 100,
  });

  console.log(
    JSON.stringify(
      rows.map((row) => ({
        paymentId: row.id,
        orderId: row.order?.id,
        orderNumber: row.order?.orderNumber,
        orderStatus: row.order?.status,
        paymentStatus: row.status,
        attempts: row.reconcileAttemptCount,
        lastOutcome: row.lastProviderOutcome,
        lastDetail: row.lastProviderDetail,
        lastReconciledAt: row.lastReconciledAt,
      })),
      null,
      2,
    ),
  );
}

async function requeue(paymentId: string): Promise<void> {
  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      reconcileStatus: 'SCHEDULED',
      nextReconcileAt: new Date(),
      reconcileLeaseExpiresAt: null,
      consecutiveNotFoundCount: 0,
    },
  });
  console.log(JSON.stringify({ requeued: paymentId }));
  const summary = await createReconcilePaymentsUseCase().execute();
  console.log(JSON.stringify(summary, null, 2));
}

async function abandon(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { order: { select: { id: true } } },
  });

  if (!payment?.order?.id) {
    throw new Error(`Payment ${paymentId} not found or has no order`);
  }

  const fulfill = new FulfillOrderService(prismaUnitOfWork);
  await fulfill.fulfill({
    orderId: payment.order.id,
    outcome: 'failed',
    failureCode: 'MANUAL_ABANDON',
    failureMessage: 'Abandoned by operator via reconcile-review script',
  });

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      reconcileStatus: 'IDLE',
      nextReconcileAt: null,
      lastProviderDetail: 'MANUAL_ABANDON',
    },
  });

  console.log(
    JSON.stringify({ abandoned: paymentId, orderId: payment.order.id }),
  );
}

async function main(): Promise<void> {
  const [, , cmd, arg] = process.argv;

  if (cmd === '--list' || !cmd) {
    await listManualReview();
    return;
  }

  if (cmd === '--requeue' && arg) {
    await requeue(arg);
    return;
  }

  if (cmd === '--abandon' && arg) {
    await abandon(arg);
    return;
  }

  console.error(
    'Usage: pnpm payment:reconcile-review --list | --requeue <paymentId> | --abandon <paymentId>',
  );
  process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
