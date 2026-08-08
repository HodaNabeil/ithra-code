export class IndexingError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'IndexingError';
  }
}

export const IndexingErrorCodes = {
  FEATURE_DISABLED: 'FEATURE_DISABLED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
  NO_CONTENT: 'NO_CONTENT',
  EMBEDDING_FAILED: 'EMBEDDING_FAILED',
  STORAGE_FAILED: 'STORAGE_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;
