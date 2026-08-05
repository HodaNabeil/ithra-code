import { NextResponse } from 'next/server';

import { env } from '@/config/env';
import { AITutorConfig } from '@/features/ai-tutor/infrastructure/config/ai-tutor.config';
import { getCourseIndexingQueueMetrics } from '@/ai-platform';
import { probeIndexingInfrastructure } from '@/features/ai-tutor/infrastructure/startup/validate-indexing-infrastructure';
import { redis } from '@/lib/redis';

const WORKER_HEARTBEAT_KEY = 'tutor:worker:heartbeat';

function isAuthorizedDetailedHealth(request: Request): boolean {
  const token = env.INTERNAL_HEALTH_TOKEN;
  if (!token) {
    return env.NODE_ENV !== 'production';
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader === `Bearer ${token}`) {
    return true;
  }

  return request.headers.get('x-health-token') === token;
}

export async function GET(request: Request) {
  const validation = await probeIndexingInfrastructure();
  const indexing =
    validation.enabled && validation.checks.queueConnectivity === 'ok'
      ? await getCourseIndexingQueueMetrics()
      : {
          queue: 'course-indexing' as const,
          active: 0,
          waiting: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
        };

  const healthy =
    validation.checks.database === 'ok' &&
    validation.checks.redis === 'ok' &&
    validation.checks.pgvector === 'ok' &&
    (validation.checks.aiTutorConfigured === 'ok' ||
      validation.checks.aiTutorConfigured === 'skipped') &&
    (validation.checks.queueConnectivity === 'ok' ||
      validation.checks.queueConnectivity === 'skipped');

  if (!isAuthorizedDetailedHealth(request)) {
    return NextResponse.json(
      {
        status: healthy ? 'healthy' : 'degraded',
      },
      { status: healthy ? 200 : 503 },
    );
  }

  let workerHeartbeat: string | null = null;
  try {
    workerHeartbeat = await redis.get(WORKER_HEARTBEAT_KEY);
  } catch {
    workerHeartbeat = null;
  }

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      aiTutorEnabled: AITutorConfig.isEnabled(),
      checks: validation.checks,
      indexing,
      workerHeartbeat,
    },
    { status: healthy ? 200 : 503 },
  );
}
