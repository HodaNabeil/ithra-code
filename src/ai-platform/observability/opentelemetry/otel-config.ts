import {
  AlwaysOffSampler,
  AlwaysOnSampler,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  type Sampler,
} from '@opentelemetry/sdk-trace-base';

export type OtelRuntimeConfig = {
  serviceName: string;
  otlpEndpoint?: string;
  metricsPort: number;
  tracesSampler: string;
  tracesSamplerRatio: number;
};

export function resolveTraceSampler(config: OtelRuntimeConfig): Sampler | undefined {
  switch (config.tracesSampler) {
    case 'always_on':
      return new AlwaysOnSampler();
    case 'always_off':
      return new AlwaysOffSampler();
    case 'traceidratio':
      return new TraceIdRatioBasedSampler(config.tracesSamplerRatio);
    case 'parentbased_traceidratio':
    default:
      if (config.tracesSamplerRatio >= 1) {
        return undefined;
      }
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(config.tracesSamplerRatio),
      });
  }
}

export function resolveOtlpMetricsUrl(otlpEndpoint?: string): string | undefined {
  if (!otlpEndpoint) {
    return undefined;
  }

  return `${otlpEndpoint.replace(/\/$/, '')}/v1/metrics`;
}

export function resolveOtlpTracesUrl(otlpEndpoint?: string): string | undefined {
  if (!otlpEndpoint) {
    return undefined;
  }

  return `${otlpEndpoint.replace(/\/$/, '')}/v1/traces`;
}
