import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { readPaymobConfig } from '@/features/payments/infrastructure/gateways/paymob/paymob.config';
import { redisMetricsRecorder } from '@/features/payments/infrastructure/observability/redis-metrics.recorder';

export async function GET() {
  const checks: Record<string, 'ok' | 'error' | 'skipped'> = {
    database: 'error',
    redis: 'error',
    paymobConfigured: readPaymobConfig() ? 'ok' : 'skipped',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'ok' : 'error';
  } catch {
    checks.redis = 'error';
  }

  const manualReviewAlert = await redisMetricsRecorder.getManualReviewAlert();
  const healthy = checks.database === 'ok' && checks.redis === 'ok';

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      checks,
      alerts: {
        manualReview: manualReviewAlert,
      },
      reconcileMetrics: await redisMetricsRecorder.toPrometheusText(),
    },
    { status: healthy ? 200 : 503 },
  );
}
