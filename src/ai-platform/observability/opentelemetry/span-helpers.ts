import {
  context,
  metrics,
  trace,
  type Span,
  type Attributes,
} from '@opentelemetry/api';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import { sanitizeOtelAttributes } from './otel-attributes';
import {
  runTelemetrySafely,
  runTelemetrySafelyAsync,
} from './telemetry-isolation';

let initialized = false;

export function isOtelActive(): boolean {
  return initialized && AIPlatformConfig.isOtelEnabled();
}

export function markOtelInitialized(): void {
  initialized = true;
}

export function resetOtelInitializedForTests(): void {
  initialized = false;
}

export function getTracer(name = 'ithracode-ai-platform') {
  return trace.getTracer(name);
}

export function getMeter(name = 'ithracode-ai-platform') {
  return metrics.getMeter(name);
}

export function runInSpanContext<T>(span: Span, fn: () => T): T {
  if (!isOtelActive()) {
    return fn();
  }

  return runTelemetrySafely(
    'runInSpanContext',
    () => context.with(trace.setSpan(context.active(), span), fn),
    fn(),
  );
}

export async function runInSpanContextAsync<T>(
  span: Span,
  fn: () => Promise<T>,
): Promise<T> {
  if (!isOtelActive()) {
    return fn();
  }

  return runTelemetrySafelyAsync(
    'runInSpanContextAsync',
    () => context.with(trace.setSpan(context.active(), span), fn),
    fn,
  );
}

export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const noopSpan = trace.getTracer('noop').startSpan('noop');

  if (!isOtelActive()) {
    return fn(noopSpan);
  }

  return runTelemetrySafelyAsync(
    `withSpan:${name}`,
    async () => {
      const tracer = getTracer();
      const safeAttributes = sanitizeOtelAttributes(attributes);

      return tracer.startActiveSpan(
        name,
        { attributes: safeAttributes },
        async (span) => {
          try {
            const result = await fn(span);
            span.setStatus({ code: 1 });
            return result;
          } catch (error) {
            span.recordException(error as Error);
            span.setStatus({
              code: 2,
              message: error instanceof Error ? error.message : 'error',
            });
            throw error;
          } finally {
            span.end();
          }
        },
      );
    },
    () => fn(noopSpan),
  );
}

export function withSpanSync<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => T,
): T {
  const noopSpan = trace.getTracer('noop').startSpan('noop');

  if (!isOtelActive()) {
    return fn(noopSpan);
  }

  return runTelemetrySafely(
    `withSpanSync:${name}`,
    () => {
      const tracer = getTracer();
      const safeAttributes = sanitizeOtelAttributes(attributes);

      return tracer.startActiveSpan(
        name,
        { attributes: safeAttributes },
        (span) => {
          try {
            const result = fn(span);
            span.setStatus({ code: 1 });
            return result;
          } catch (error) {
            span.recordException(error as Error);
            span.setStatus({
              code: 2,
              message: error instanceof Error ? error.message : 'error',
            });
            throw error;
          } finally {
            span.end();
          }
        },
      );
    },
    fn(noopSpan),
  );
}

export function wrapGraphNode<TState, TResult>(
  nodeName: string,
  fn: (state: TState, config: LangGraphRunnableConfig) => Promise<TResult>,
): (state: TState, config: LangGraphRunnableConfig) => Promise<TResult> {
  return async (state, config) =>
    withSpan(`ai.node.${nodeName}`, { 'ai.node.name': nodeName }, async () =>
      fn(state, config),
    );
}
