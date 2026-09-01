import { NextResponse } from 'next/server';
import { env } from '@/config';
import { prisma } from '@/lib/prisma';
import { createReconcilePaymentsUseCase } from '@/features/payments/infrastructure/di/payments.container';
import { prometheusMetricsRecorder } from '@/features/payments/infrastructure/observability/prometheus-metrics.recorder';

function isAuthorized(request: Request): boolean {
  const secret = env.PAYMENT_RECONCILE_ADMIN_SECRET;
  if (!secret) {
    return false;
  }

  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const manualReview = await prisma.payment.findMany({
    where: { reconcileStatus: 'MANUAL_REVIEW' },
    include: {
      order: { select: { id: true, orderNumber: true, status: true } },
    },
    orderBy: { lastReconciledAt: 'asc' },
    take: 100,
  });

  return NextResponse.json({
    manualReview: manualReview.map((row) => ({
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
    metrics: prometheusMetricsRecorder.toPrometheusText(),
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    action?: 'requeue' | 'abandon' | 'run';
    paymentId?: string;
  };

  if (body.action === 'run') {
    const summary = await createReconcilePaymentsUseCase().execute();
    return NextResponse.json({ summary });
  }

  if (body.action === 'requeue' && body.paymentId) {
    await prisma.payment.update({
      where: { id: body.paymentId },
      data: {
        reconcileStatus: 'SCHEDULED',
        nextReconcileAt: new Date(),
        reconcileLeaseExpiresAt: null,
        consecutiveNotFoundCount: 0,
      },
    });

    const summary = await createReconcilePaymentsUseCase().execute();
    return NextResponse.json({ requeued: body.paymentId, summary });
  }

  return NextResponse.json(
    { error: 'Unsupported action. Use action=run|requeue with paymentId.' },
    { status: 400 },
  );
}
