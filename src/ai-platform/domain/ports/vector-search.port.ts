/**
 * VectorSearchPort — semantic similarity search over embedded content.
 */

export interface SearchFilter {
  [key: string]: unknown;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
  embedding?: number[];
}

export interface VectorSearchOptions {
  topK?: number;
  filter?: SearchFilter;
  minScore?: number;
  includeEmbedding?: boolean;
}

export interface VectorSearchPort {
  search(embedding: number[], options?: VectorSearchOptions): Promise<SearchResult[]>;
  index(id: string, embedding: number[], metadata: Record<string, unknown>): Promise<string>;
  indexBatch(
    items: Array<{
      id: string;
      embedding: number[];
      metadata: Record<string, unknown>;
    }>,
  ): Promise<number>;
  delete(id: string): Promise<boolean>;
  update(
    id: string,
    embedding?: number[],
    metadata?: Record<string, unknown>,
  ): Promise<void>;
  clear(): Promise<number>;
  getStats(): Promise<{
    totalVectors: number;
    indexSize: number;
    lastUpdated: Date;
  }>;
}

export class VectorSearchError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'VectorSearchError';
  }
}

export const VectorSearchErrorCodes = {
  INVALID_EMBEDDING: 'INVALID_EMBEDDING',
  INDEX_CORRUPTED: 'INDEX_CORRUPTED',
  QUERY_FAILED: 'QUERY_FAILED',
  OUT_OF_MEMORY: 'OUT_OF_MEMORY',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;
