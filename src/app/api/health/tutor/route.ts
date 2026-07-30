import { NextResponse } from 'next/server';

import { AITutorConfig } from '@/features/ai-tutor/infrastructure/config/ai-tutor.config';
import { getCourseIndexingQueueMetrics } from '@/features/ai-tutor/infrastructure/queue/course-indexing-queue-metrics';
import { probeIndexingInfrastructure } from '@/features/ai-tutor/infrastructure/startup/validate-indexing-infrastructure';

export async function GET() {
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

  return NextResponse.json(
    {
      status: healthy ? 'healthy' : 'degraded',
      aiTutorEnabled: AITutorConfig.isEnabled(),
      checks: validation.checks,
      indexing,
    },
    { status: healthy ? 200 : 503 },
  );
}
