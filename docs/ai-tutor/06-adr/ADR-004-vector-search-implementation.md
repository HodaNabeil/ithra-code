# ADR-004: Vector Search Implementation Strategy

## Status
✅ Accepted

## Context

The AI Tutor needs to retrieve relevant course content efficiently for RAG (Retrieval Augmented Generation). We evaluated several vector search options:

**Requirements:**
- Search thousands of course content chunks
- Sub-200ms query latency
- Accurate relevance ranking
- Cost-effective
- Integrated with existing PostgreSQL stack

**Options Considered:**
1. PostgreSQL with pgvector extension
2. Pinecone (managed service)
3. Milvus (self-hosted)
4. Elasticsearch (existing, but not optimized for vectors)
5. Weaviate (new infrastructure)

## Decision

Use **PostgreSQL with pgvector extension** for vector storage and search.

### **Why pgvector**

1. **Integration:** Runs in existing PostgreSQL database
   - No new infrastructure
   - Unified data model
   - Same backups and replication

2. **Performance:** HNSW indexes provide fast similarity search
   - ~50-100ms queries on 10K+ chunks
   - Meets <200ms requirement

3. **Cost:** Zero additional infrastructure
   - No managed service fees
   - Leverages existing database capacity

4. **Consistency:** Transactional semantics
   - Indexing and data updates atomic
   - No eventual consistency issues

5. **Developer Experience:**
   - SQL-based queries (familiar to team)
   - Native Prisma support with extensions
   - Easy debugging and monitoring

### **Architecture**

```typescript
// Database Schema
table knowledge_chunks {
  id: string @id
  courseId: string
  lectureId: string?
  sectionId: string?
  content: string
  contentType: string  // 'lecture' | 'transcript' | 'attachment' | 'quiz' | 'assignment'
  sensitivity: string  // 'public' | 'assessment' | 'instructor'
  
  // Vector embedding (1536 dimensions for OpenAI)
  embedding: vector(1536) @db.VectorType  // pgvector
  
  metadata: Json
  createdAt: DateTime
  updatedAt: DateTime
  
  @@index([courseId])
  @@index([lectureId])
  @@index([embedding], type: "hnsw")  // Fast similarity search
}
```

### **Search Query**
```typescript
// Raw SQL for similarity search
const searchQuery = `
  SELECT 
    id, content, metadata,
    embedding <-> $1 as distance
  FROM knowledge_chunks
  WHERE courseId = $2
    AND sensitivity != 'instructor'
  ORDER BY embedding <-> $1
  LIMIT $3
`;

// Or with Prisma once pgvector support is complete:
const results = await prisma.$queryRaw`
  SELECT * FROM knowledge_chunks
  WHERE courseId = ${courseId}
  ORDER BY embedding <-> ${vector}::vector
  LIMIT 10
`;
```

## Implementation Details

### **Setup**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with vector column
CREATE TABLE knowledge_chunks (
  id SERIAL PRIMARY KEY,
  embedding vector(1536) NOT NULL,
  -- ... other columns
);

-- Create HNSW index for fast search
CREATE INDEX ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- Or IVFFlat for larger datasets
CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### **Query Optimization**

**Index Types:**
- **HNSW** (default, recommended)
  - Fast search: O(log n)
  - Better for <1M vectors
  - Used for our scope

- **IVFFlat** (for larger scale)
  - Good for >1M vectors
  - Trade accuracy for speed if needed

**Search Operators:**
- `<->` - Cosine distance (default, good for normalized embeddings)
- `<#>` - Negative inner product
- `<=>` - L2 distance

**Filters with Search:**
```sql
SELECT * FROM knowledge_chunks
WHERE courseId = $1
  AND sensitivity = 'public'
ORDER BY embedding <-> $2
LIMIT 10;
```

### **Cost Calculation**

For 500 courses × 500 chunks/course = 250K vectors:
- Storage: ~1GB for vectors alone
- Query performance: 50-100ms per search
- Cost: Same as current PostgreSQL hosting (no increase)

## Benefits

1. **No New Infrastructure**
   - Runs in existing database
   - Simplified deployment and monitoring

2. **Strong Consistency**
   - ACID guarantees
   - No eventual consistency issues
   - Transactional integrity

3. **Unified Data Model**
   - Single source of truth
   - Easier to join with other data
   - Simpler disaster recovery

4. **Cost Effective**
   - No managed service fees
   - Leverages existing capacity
   - Scales with database

5. **Developer Friendly**
   - SQL-based (team familiar)
   - Easy debugging
   - Standard monitoring tools

## Consequences

### **Positive**
- Minimal infrastructure overhead
- Data consistency guarantees
- Single database to manage
- Good performance characteristics
- Integrated with existing Prisma setup

### **Negative**
- Requires PostgreSQL 12+ with pgvector extension
- Performance capped by single database instance (can't shard vectors)
- If scaling to 10M+ vectors, may need migration
- Limited built-in analytics (compared to specialized search services)

## Related Decisions
- ADR-001: Port & Adapter pattern (VectorSearchPort)
- Database infrastructure decisions

## Alternatives Considered

### **Pinecone (Managed Vector DB)**
Pros:
- Fully managed, no ops burden
- Purpose-built for vector search
- Mature ecosystem

Cons:
- Additional infrastructure cost (~$70-300/month)
- Data lives in separate system
- Consistency challenges
- Vendor lock-in

**Decision:** ❌ Rejected due to cost and complexity for MVP

### **Milvus (Self-Hosted)**
Pros:
- Open source
- Powerful vector search
- Can handle scale

Cons:
- New infrastructure to manage
- Operational overhead
- Data syncing challenges

**Decision:** ❌ Rejected - adds ops burden

### **Elasticsearch**
Pros:
- Already familiar to team
- Good full-text search

Cons:
- Vector search less optimized than pgvector
- Separate index to maintain
- Consistency issues

**Decision:** ❌ Rejected - pgvector better suited

## Future Enhancements

1. **Scale Migration Path**
   - pgvector handles MVP scale
   - Plan for Pinecone/Milvus if >5M vectors needed
   - Port & Adapter pattern allows easy migration

2. **Hybrid Search**
   - Combine pgvector with full-text search
   - Better recall with keyword filtering

3. **Approximate Search**
   - Switch to IVFFlat if performance degrades
   - Trade accuracy for speed at scale

4. **Reranking**
   - Initial vector search: top-100 fast
   - Rerank with semantic model: select top-10
   - Improves quality for complex queries

---

**Date:** 2024
**Author:** Architecture Team
