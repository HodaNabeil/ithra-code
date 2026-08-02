import {
  LlmError,
  type LlmPort,
  type LlmStreamOptions,
} from '../../domain/ports/LlmPort';

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

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const stream = inner.streamAnswer(options);

      for await (const token of stream) {
        yield token;
      }

      return;
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

/**
 * Decorator that retries transient LLM failures with exponential backoff.
 */
export class ResilientLlmAdapter implements LlmPort {
  constructor(private readonly inner: LlmPort) {}

  async *streamAnswer(options: LlmStreamOptions): AsyncIterableIterator<string> {
    yield* streamWithRetry(this.inner, options);
  }
}
