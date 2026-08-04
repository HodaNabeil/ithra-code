import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

import { logger } from '@/lib/logger';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import { markOtelInitialized } from './span-helpers';

let sdk: NodeSDK | null = null;

export function initOtel(): void {
  if (sdk || !AIPlatformConfig.isOtelEnabled()) {
    return;
  }

  const config = AIPlatformConfig.getOtelConfig();
  const traceExporter = config.otlpEndpoint
    ? new OTLPTraceExporter({ url: `${config.otlpEndpoint}/v1/traces` })
    : undefined;

  const prometheusExporter = new PrometheusExporter(
    { port: config.metricsPort },
    () => {
      logger.info(
        { port: config.metricsPort },
        '[OTEL] Prometheus metrics exporter started',
      );
    },
  );

  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
    }),
    traceExporter,
    metricReader: prometheusExporter,
    instrumentations: [
      new HttpInstrumentation(),
      new IORedisInstrumentation(),
      new PrismaInstrumentation(),
    ],
  });

  sdk.start();
  markOtelInitialized();
  logger.info({ serviceName: config.serviceName }, '[OTEL] SDK initialized');
}

export async function shutdownOtel(): Promise<void> {
  if (!sdk) {
    return;
  }
  await sdk.shutdown();
  sdk = null;
}
