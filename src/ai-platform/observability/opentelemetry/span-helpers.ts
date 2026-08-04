import { metrics, trace, type Span, type Attributes } from '@opentelemetry/api';
import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';

let initialized = false;

export function isOtelActive(): boolean {
  return initialized && AIPlatformConfig.isOtelEnabled();
}

export function markOtelInitialized(): void {
  initialized = true;
}

export function getTracer(name = 'ithracode-ai-platform') {
  return trace.getTracer(name);
}

export function getMeter(name = 'ithracode-ai-platform') {
  return metrics.getMeter(name);
}

export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  if (!isOtelActive()) {
    return fn(trace.getTracer('noop').startSpan('noop'));
  }

  const tracer = getTracer();
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
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
  });
}

export function withSpanSync<T>(
  name: string,
  attributes: Attributes,
  fn: (span: Span) => T,
): T {
  if (!isOtelActive()) {
    return fn(trace.getTracer('noop').startSpan('noop'));
  }

  const tracer = getTracer();
  return tracer.startActiveSpan(name, { attributes }, (span) => {
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
  });
}

export function wrapGraphNode<TState, TResult>(
  nodeName: string,
  fn: (state: TState, config: LangGraphRunnableConfig) => Promise<TResult>,
): (state: TState, config: LangGraphRunnableConfig) => Promise<TResult> {
  return async (state, config) =>
    withSpan(
      `ai.node.${nodeName}`,
      { 'ai.node.name': nodeName },
      async () => fn(state, config),
    );
}
