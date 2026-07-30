export class AskTutorError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AskTutorError';
  }
}

export const AskTutorErrorCodes = {
  FEATURE_DISABLED: 'FEATURE_DISABLED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  CONCURRENT_STREAM_LIMIT: 'CONCURRENT_STREAM_LIMIT',
  LLM_ERROR: 'LLM_ERROR',
  REPOSITORY_ERROR: 'REPOSITORY_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;
