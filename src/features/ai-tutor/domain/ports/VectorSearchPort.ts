/**
 * VectorSearchPort
 *
 * Abstraction for vector similarity search.
 * Finds semantically similar content chunks based on embeddings.
 *
 * Implementations must handle:
 * - Vector indexing
 * - Similarity scoring
 * - Efficient querying
 * - Metadata filtering
 */

export interface SearchFilter {
  [key: string]: any;
}

export interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface VectorSearchOptions {
  topK?: number;
  filter?: SearchFilter;
  minScore?: number;
  includeEmbedding?: boolean;
}

/**
 * VectorSearchPort interface
 * Provides semantic similarity search functionality
 */
export interface VectorSearchPort {
  /**
   * Search for similar vectors
   *
   * @param embedding - Query embedding vector
   * @param options - Search configuration
   * @returns Most similar results ranked by score
   * @throws VectorSearchError if search fails
   *
   * @example
   * const results = await vectorSearch.search(
   *   [0.123, -0.456, ...],  // Query embedding
   *   { topK: 5, filter: { courseId: 'course-123' } }
   * );
   * console.log(results[0].score); // 0.95 (higher is better)
   */
  search(embedding: number[], options?: VectorSearchOptions): Promise<SearchResult[]>;

  /**
   * Index a new vector with metadata
   *
   * @param id - Unique identifier
   * @param embedding - Vector to index
   * @param metadata - Associated metadata
   * @returns Index ID
   * @throws VectorSearchError if indexing fails
   */
  index(id: string, embedding: number[], metadata: Record<string, any>): Promise<string>;

  /**
   * Index multiple vectors in batch
   * More efficient than individual calls
   *
   * @param items - Items to index
   * @returns Number of successfully indexed items
   */
  indexBatch(
    items: Array<{
      id: string;
      embedding: number[];
      metadata: Record<string, any>;
    }>,
  ): Promise<number>;

  /**
   * Delete a vector from index
   *
   * @param id - ID to delete
   * @returns True if deleted, false if not found
   */
  delete(id: string): Promise<boolean>;

  /**
   * Update vector and metadata
   *
   * @param id - ID to update
   * @param embedding - New embedding (optional)
   * @param metadata - New metadata (optional)
   * @throws VectorSearchError if update fails
   */
  update(
    id: string,
    embedding?: number[],
    metadata?: Record<string, any>,
  ): Promise<void>;

  /**
   * Clear entire index
   * WARNING: Destructive operation
   *
   * @returns Number of items deleted
   */
  clear(): Promise<number>;

  /**
   * Get index statistics
   *
   * @returns Stats about indexed vectors
   */
  getStats(): Promise<{
    totalVectors: number;
    indexSize: number;
    lastUpdated: Date;
  }>;
}

/**
 * VectorSearchError
 * Represents errors from vector search operations
 */
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

/**
 * Common vector search error codes
 */
export const VectorSearchErrorCodes = {
  INVALID_EMBEDDING: 'INVALID_EMBEDDING',
  INDEX_CORRUPTED: 'INDEX_CORRUPTED',
  QUERY_FAILED: 'QUERY_FAILED',
  OUT_OF_MEMORY: 'OUT_OF_MEMORY',
  DATABASE_ERROR: 'DATABASE_ERROR',
  UNKNOWN: 'UNKNOWN',
} as const;
