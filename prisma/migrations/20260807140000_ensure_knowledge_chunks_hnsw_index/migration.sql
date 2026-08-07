-- Reaffirm HNSW index for knowledge_chunks.embedding (idempotent).
-- Prisma schema documents this index; it cannot be declared on Unsupported("vector").
CREATE INDEX IF NOT EXISTS "knowledge_chunks_embedding_idx"
  ON "knowledge_chunks"
  USING hnsw ("embedding" vector_cosine_ops);
