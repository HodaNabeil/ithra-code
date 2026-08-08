import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import type { MetricReader } from '@opentelemetry/sdk-metrics';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import { logger } from '@/lib/logger';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  resolveOtlpMetricsUrl,
  resolveOtlpTracesUrl,
  resolveTraceSampler,
  type OtelRuntimeConfig,
} from './otel-config';
import { markOtelInitialized, resetOtelInitializedForTests } from './span-helpers';

let sdk: NodeSDK | null = null;

const METRICS_EXPORT_INTERVAL_MS = 15_000;

export function buildMetricReaders(config: OtelRuntimeConfig): MetricReader[] {
  const readers: MetricReader[] = [
    new PrometheusExporter({ port: config.metricsPort }, () => {
      logger.info(
        { port: config.metricsPort },
        '[OTEL] Prometheus metrics exporter started',
      );
    }),
  ];

  const metricsUrl = resolveOtlpMetricsUrl(config.otlpEndpoint);
  if (metricsUrl) {
    readers.push(
      new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter({ url: metricsUrl }),
        exportIntervalMillis: METRICS_EXPORT_INTERVAL_MS,
      }),
    );
  }

  return readers;
}

export function initOtel(): void {
  if (sdk || !AIPlatformConfig.isOtelEnabled()) {
    return;
  }

  try {
    const config = AIPlatformConfig.getOtelConfig();
    const tracesUrl = resolveOtlpTracesUrl(config.otlpEndpoint);
    const traceExporter = tracesUrl
      ? new OTLPTraceExporter({ url: tracesUrl })
      : undefined;
    const sampler = resolveTraceSampler(config);

    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: config.serviceName,
      }),
      traceExporter,
      sampler,
      metricReaders: buildMetricReaders(config),
      instrumentations: [
        new HttpInstrumentation(),
        new IORedisInstrumentation(),
        new PrismaInstrumentation(),
      ],
    });

    sdk.start();
    markOtelInitialized();
    logger.info(
      {
        serviceName: config.serviceName,
        otlpEndpoint: config.otlpEndpoint ?? null,
        metricsPort: config.metricsPort,
        tracesSampler: config.tracesSampler,
        tracesSamplerRatio: config.tracesSamplerRatio,
        otlpMetricsEnabled: Boolean(config.otlpEndpoint),
      },
      '[OTEL] SDK initialized',
    );
  } catch (error) {
    logger.warn({ error }, '[OTEL] SDK initialization failed');
  }
}

export async function shutdownOtel(): Promise<void> {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  sdk = null;
  resetOtelInitializedForTests();
}

export async function resetOtelForTests(): Promise<void> {
  await shutdownOtel();
}
