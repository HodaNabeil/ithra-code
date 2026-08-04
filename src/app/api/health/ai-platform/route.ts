import { NextResponse } from 'next/server';

import { platformMetrics } from '@/ai-platform/observability/metrics/platform-metrics';
import { AIPlatformConfig } from '@/ai-platform/infrastructure/config/ai-platform.config';

export async function GET() {
  if (!AIPlatformConfig.isEnabled()) {
    return NextResponse.json({ status: 'disabled' });
  }

  return new NextResponse(platformMetrics.toPrometheusText(), {
    headers: { 'Content-Type': 'text/plain; version=0.0.4' },
  });
}
