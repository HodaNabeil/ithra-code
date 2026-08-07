import {
  LlmError,
  LlmErrorCodes,
  type LlmCompleteOptions,
  type LlmCompleteResult,
  type LlmPort,
  type LlmStreamOptions,
} from '../../domain/ports/llm.port';
import { withSpan, isOtelActive, getTracer } from '../../observability/opentelemetry/span-helpers';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = process.env.NODE_ENV === 'test' ? 1 : 1000;
const MAX_DELAY_MS = process.env.NODE_ENV === 'test' ? 5 : 8000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function computeBackoffMs(attempt: number): number {
  const exponential = Math.min(BASE_DELAY_MS * 2 ** attempt, MAX_DELAY_MS);
  const jitter = Math.floor(Math.random() * 250);
  return exponential + jitter;
}

async function* streamWithRetry(
  inner: LlmPort,
  options: LlmStreamOptions,
): AsyncGenerator<string> {
  let lastError: LlmError | undefined;
  let tokensYielded = 0;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const stream = inner.streamAnswer(options);

      for await (const token of stream) {
        tokensYielded += 1;
        yield token;
      }

      return;
    } catch (error) {
      if (options.signal?.aborted) {
        throw error;
      }

      if (!(error instanceof LlmError) || !error.retryable || attempt === MAX_RETRIES - 1) {
        throw error;
      }

      if (tokensYielded > 0) {
        throw error;
      }

      lastError = error;
      await sleep(computeBackoffMs(attempt));
    }
  }

  throw lastError ?? new LlmError('UNKNOWN', 'فشل الاتصال بخدمة الذكاء الاصطناعي', true);
}

/**
 * Decorator that retries transient LLM failures with exponential backoff.
 */
export class ResilientLlmAdapter implements LlmPort {
  constructor(private readonly inner: LlmPort) {}

  async *streamAnswer(options: LlmStreamOptions): AsyncIterableIterator<string> {
    const model = options.model ?? 'unknown';
    const attributes = { 'ai.llm.model': model, 'ai.llm.mode': 'stream' };

    if (!isOtelActive()) {
      yield* streamWithRetry(this.inner, options);
      return;
    }

    const span = getTracer().startSpan('ai.llm.call', { attributes });
    try {
      for await (const token of streamWithRetry(this.inner, options)) {
        yield token;
      }
      span.setStatus({ code: 1 });
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
  }

  async complete(options: LlmCompleteOptions): Promise<LlmCompleteResult> {
    const model = options.model ?? 'unknown';
    return withSpan(
      'ai.llm.call',
      { 'ai.llm.model': model, 'ai.llm.mode': 'complete' },
      async () => this.completeWithRetry(options),
    );
  }

  private async completeWithRetry(options: LlmCompleteOptions): Promise<LlmCompleteResult> {
    if (!this.inner.complete) {
      throw new LlmError(LlmErrorCodes.INVALID_REQUEST, 'Inner LLM does not support complete()', false);
    }

    let lastError: LlmError | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        return await this.inner.complete(options);
      } catch (error) {
        if (!(error instanceof LlmError) || !error.retryable || attempt === MAX_RETRIES - 1) {
          throw error;
        }
        lastError = error;
        await sleep(computeBackoffMs(attempt));
      }
    }

    throw lastError ?? new LlmError('UNKNOWN', 'فشل الاتصال بخدمة الذكاء الاصطناعي', true);
  }
}
