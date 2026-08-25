import { NextResponse } from 'next/server';

import { AIPlatformConfig } from '@/ai-platform/infrastructure/config/ai-platform.config';
import { isOtelActive } from '@/ai-platform/observability/opentelemetry/span-helpers';

export async function GET() {
  if (!AIPlatformConfig.isEnabled()) {
    return NextResponse.json({ status: 'disabled' });
  }

  const otelConfig = AIPlatformConfig.getOtelConfig();

  return NextResponse.json({
    status: 'ok',
    platform: 'ai-platform',
    otel: {
      enabled: otelConfig.enabled,
      active: isOtelActive(),
      serviceName: otelConfig.serviceName,
      metricsPort: otelConfig.enabled ? otelConfig.metricsPort : null,
      otlpEndpoint: otelConfig.enabled
        ? (otelConfig.otlpEndpoint ?? null)
        : null,
      tracesSampler: otelConfig.tracesSampler,
      tracesSamplerRatio: otelConfig.tracesSamplerRatio,
    },
    metrics: {
      export: otelConfig.enabled
        ? {
            prometheus: `http://127.0.0.1:${otelConfig.metricsPort}/metrics`,
            otlp: otelConfig.otlpEndpoint
              ? `${otelConfig.otlpEndpoint}/v1/metrics`
              : null,
          }
        : null,
    },
  });
}
