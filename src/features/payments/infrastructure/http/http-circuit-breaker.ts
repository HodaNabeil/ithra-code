export class CircuitOpenError extends Error {
  constructor(message = 'HTTP circuit breaker is open') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export type HttpCircuitBreakerConfig = {
  failureThreshold: number;
  resetMs: number;
};

/**
 * In-process circuit breaker for provider HTTP calls.
 * Opens after consecutive failures; half-opens after reset window.
 */
export class HttpCircuitBreaker {
  private failures = 0;
  private state: 'closed' | 'open' | 'half_open' = 'closed';
  private openedAt = 0;

  constructor(private readonly config: HttpCircuitBreakerConfig) {}

  getState(): 'closed' | 'open' | 'half_open' {
    if (
      this.state === 'open' &&
      Date.now() - this.openedAt >= this.config.resetMs
    ) {
      return 'half_open';
    }

    return this.state;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    const effectiveState = this.getState();

    if (effectiveState === 'open') {
      throw new CircuitOpenError();
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures += 1;

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }
}
