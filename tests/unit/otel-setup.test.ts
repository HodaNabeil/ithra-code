import {
  AlwaysOffSampler,
  AlwaysOnSampler,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  resolveOtlpMetricsUrl,
  resolveOtlpTracesUrl,
  resolveTraceSampler,
} from '@/ai-platform/observability/opentelemetry/otel-config';
import {
  buildMetricReaders,
  resetOtelForTests,
} from '@/ai-platform/observability/opentelemetry/otel-setup';
import {
  isOtelActive,
  resetOtelInitializedForTests,
} from '@/ai-platform/observability/opentelemetry/span-helpers';

describe('otel-config', () => {
  it('builds OTLP trace and metrics URLs from endpoint', () => {
    expect(resolveOtlpTracesUrl('http://127.0.0.1:4318')).toBe(
      'http://127.0.0.1:4318/v1/traces',
    );
    expect(resolveOtlpMetricsUrl('http://127.0.0.1:4318/')).toBe(
      'http://127.0.0.1:4318/v1/metrics',
    );
  });

  it('returns undefined URLs when OTLP endpoint is missing', () => {
    expect(resolveOtlpTracesUrl(undefined)).toBeUndefined();
    expect(resolveOtlpMetricsUrl(undefined)).toBeUndefined();
  });

  it('resolves parent-based ratio sampler', () => {
    const sampler = resolveTraceSampler({
      serviceName: 'test',
      metricsPort: 9464,
      tracesSampler: 'parentbased_traceidratio',
      tracesSamplerRatio: 0.1,
    });

    expect(sampler).toBeInstanceOf(ParentBasedSampler);
  });

  it('returns undefined sampler for full sampling ratio', () => {
    const sampler = resolveTraceSampler({
      serviceName: 'test',
      metricsPort: 9464,
      tracesSampler: 'parentbased_traceidratio',
      tracesSamplerRatio: 1,
    });

    expect(sampler).toBeUndefined();
  });

  it('resolves explicit sampler strategies', () => {
    expect(
      resolveTraceSampler({
        serviceName: 'test',
        metricsPort: 9464,
        tracesSampler: 'always_on',
        tracesSamplerRatio: 1,
      }),
    ).toBeInstanceOf(AlwaysOnSampler);

    expect(
      resolveTraceSampler({
        serviceName: 'test',
        metricsPort: 9464,
        tracesSampler: 'always_off',
        tracesSamplerRatio: 0,
      }),
    ).toBeInstanceOf(AlwaysOffSampler);

    expect(
      resolveTraceSampler({
        serviceName: 'test',
        metricsPort: 9464,
        tracesSampler: 'traceidratio',
        tracesSamplerRatio: 0.25,
      }),
    ).toBeInstanceOf(TraceIdRatioBasedSampler);
  });
});

describe('otel-setup', () => {
  beforeEach(async () => {
    await resetOtelForTests();
    vi.resetModules();
    process.env.SKIP_ENV_VALIDATION = 'true';
    process.env.OTEL_ENABLED = 'false';
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  });

  afterEach(async () => {
    await resetOtelForTests();
    resetOtelInitializedForTests();
  });

  it('isOtelActive is false before initialization', () => {
    expect(isOtelActive()).toBe(false);
  });

  it('initOtel is a no-op when OTEL is disabled', async () => {
    const { initOtel: init } = await import(
      '@/ai-platform/observability/opentelemetry/otel-setup'
    );

    expect(() => init()).not.toThrow();
    expect(isOtelActive()).toBe(false);
  });

  it('initOtel does not throw without OTLP endpoint', async () => {
    process.env.OTEL_ENABLED = 'true';
    delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    vi.resetModules();

    const { initOtel: init } = await import(
      '@/ai-platform/observability/opentelemetry/otel-setup'
    );

    expect(() => init()).not.toThrow();
    await resetOtelForTests();
  });

  it('buildMetricReaders includes Prometheus and optional OTLP readers', () => {
    const readers = buildMetricReaders({
      serviceName: 'test',
      metricsPort: 9464,
      tracesSampler: 'parentbased_traceidratio',
      tracesSamplerRatio: 1,
      otlpEndpoint: 'http://127.0.0.1:4318',
    });

    expect(readers).toHaveLength(2);
  });

  it('buildMetricReaders uses Prometheus only when OTLP endpoint is absent', () => {
    const readers = buildMetricReaders({
      serviceName: 'test',
      metricsPort: 9464,
      tracesSampler: 'parentbased_traceidratio',
      tracesSamplerRatio: 1,
    });

    expect(readers).toHaveLength(1);
  });
});
