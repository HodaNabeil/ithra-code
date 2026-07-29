# Indexing Pipeline

Background process for building and maintaining the knowledge base.

## High-Level Flow

```
Course Content Change Event
    ↓
Content Detection
    ↓
Content Extraction
    ↓
Content Classification
    ↓
Intelligent Chunking
    ↓
Embedding Generation
    ↓
Vector Storage
    ↓
Index Update Complete
```

---

## Trigger Events

### **Automatic Triggers**

#### **Course Published**
**Event:** Course status changes to `PUBLISHED`

**Trigger Location:** `src/features/courses/actions/publish-course.ts`

**Processing:**
- Full course indexing initiated
- All sections, lectures, and attachments processed
- Expected duration: 2-10 minutes (depending on content size)

**Detection:**
```typescript
// Webhook or event emission
onCourseStatusChange('PUBLISHED', courseId, () => {
  indexingService.indexFullCourse(courseId);
});
```

---

#### **Lecture Updated**
**Event:** Lecture content modified

**Trigger Location:** `src/features/courses/actions/update-lecture.ts`

**Processing:**
- Identify changed lecture
- Re-index only that lecture's content
- Update related chunks
- Cascading: If lecture moved, update all chunk metadata

**Detection:**
```typescript
onLectureUpdate(lectureId, courseId, () => {
  indexingService.reindexLecture(lectureId);
});
```

---

#### **Attachment Added/Modified**
**Event:** File uploaded to lecture

**Trigger Location:** `src/features/courses/actions/upload-attachment.ts`

**Processing:**
- Detect attachment type (PDF, video transcript, etc.)
- Extract content based on type
- Generate chunks
- Create embeddings
- Store in vector database

**Detection:**
```typescript
onAttachmentUpload(attachmentId, lectureId, courseId, () => {
  indexingService.indexAttachment(attachmentId);
});
```

---

#### **Content Updated Webhook**
**Event:** External content management system notifies of changes

**Trigger Location:** `src/server/webhooks/content-updated.ts`

**Processing:**
- Receive webhook with course/lecture IDs
- Queue indexing job
- Process asynchronously

---

### **Manual Triggers**

#### **Instructor-Initiated Re-indexing**
**UI:** "Re-index Course" button in course settings

**Location:** `src/features/courses/actions/reindex-course.ts`

**Processing:**
- Instructor can manually trigger full re-indexing
- Useful after bulk updates or troubleshooting

---

#### **Admin Override**
**UI:** Admin dashboard

**Location:** `src/features/admin/actions/reindex-course.ts`

**Processing:**
- Force full re-indexing of any course
- Clear and rebuild vector index
- Useful for debugging or migration

---

#### **Batch Processing**
**Type:** Scheduled job (nightly)

**Location:** `src/server/workers/index-courses.worker.ts`

**Processing:**
- Query courses with pending re-index flag
- Process in batch during off-peak hours
- Useful for performance optimization

---

## Detailed Pipeline Steps

### **Step 1: Content Detection**

**Responsibility:** Identify what content needs indexing

**Processing:**

1. **Check Course Status**
   - Only index published courses
   - Query: `SELECT * FROM courses WHERE status = 'PUBLISHED'`

2. **Identify Sections**
   - Fetch all course sections
   - Query: `SELECT * FROM sections WHERE courseId = ?`

3. **Identify Lectures**
   - Fetch published lectures only
   - Query: `SELECT * FROM lectures WHERE sectionId = ? AND isPublished = true`

4. **Identify Attachments**
   - Fetch all attachments for each lecture
   - Query: `SELECT * FROM attachments WHERE lectureId = ?`

5. **Check for Changes**
   - Compare `updatedAt` with last indexing time
   - Only process changed content

**Output:**
```typescript
ContentToIndex[] {
  type: 'lecture' | 'transcript' | 'attachment' | 'description';
  id: string;
  courseId: string;
  lectureId?: string;
  content?: string;
  fileUrl?: string;
  metadata: Record<string, any>;
}
```

---

### **Step 2: Content Extraction**

**Responsibility:** Convert various formats to text

**Location:** `src/features/ai-tutor/infrastructure/services/ContentExtractionService.ts`

**Processing by Type:**

#### **Lecture Descriptions**
- Extract text directly
- Clean HTML if present
- Duration: <10ms

#### **Video Transcripts**
- Fetch from storage
- Clean formatting
- Remove timestamps if present
- Duration: <50ms

#### **PDF Attachments**
- Use pdf-parse library
- Extract text with structure
- Handle multi-page documents
- Duration: 100-500ms (depends on size)

#### **Code Attachments**
- Read file directly
- Preserve formatting
- Extract comments as documentation
- Duration: <100ms

#### **Other Attachments**
- Attempt text extraction
- Skip unsupported formats gracefully
- Log for manual review
- Duration: variable

**Output:**
```typescript
ExtractedContent {
  id: string;
  type: string;
  text: string;
  metadata: {
    title: string;
    source: string;
    pageCount?: number;
    wordCount: number;
  };
}
```

**Error Handling:**
- Corrupted files: Skip and log
- Unsupported formats: Skip silently
- Extraction failures: Log for review

---

### **Step 3: Content Classification**

**Responsibility:** Categorize content and identify sensitive materials

**Location:** `src/features/ai-tutor/infrastructure/services/ContentClassificationService.ts`

**Processing:**

1. **Content Type Detection**
   - Lecture description → `lecture`
   - Video transcript → `transcript`
   - PDF → `attachment`
   - Code → `attachment`
   - Quiz → `quiz` (special handling)
   - Assignment → `assignment` (special handling)

2. **Assessment Detection**
   - Analyze text for assessment indicators
   - Keywords: "quiz", "test", "exam", "assignment", "solution", "answer key"
   - Mark as `isAssessment: true`

3. **Sensitivity Tagging**
   - Assessment content: `sensitivity: 'assessment'`
   - Regular content: `sensitivity: 'public'`
   - Instructor notes: `sensitivity: 'instructor'` (if available)

4. **Metadata Enrichment**
   - Extract learning objectives
   - Identify key concepts
   - Tag with section and lecture

**Output:**
```typescript
ClassifiedContent {
  id: string;
  type: ContentType;
  text: string;
  sensitivity: 'public' | 'assessment' | 'instructor';
  concepts: string[];
  objectives?: string[];
  metadata: Record<string, any>;
}
```

---

### **Step 4: Intelligent Chunking**

**Responsibility:** Split content into embedding-sized pieces

**Location:** `src/features/ai-tutor/infrastructure/services/ChunkingService.ts`

**Strategy:**

#### **Optimal Chunk Size**
- Target: 500-1000 tokens (~2000-4000 characters)
- Reason: Fits well with OpenAI embeddings and retrieval context

#### **Content-Type Specific Chunking**

**Lecture Descriptions** (Usually small)
- If <1000 tokens: Keep as single chunk
- If >1000 tokens: Split by paragraphs

**Video Transcripts** (Often long)
- Split by topic/section markers if available
- Otherwise: Split by length with 20% overlap
- Example: Chunks of 800 tokens with 160-token overlap

**PDFs** (Structure preserved)
- Respect section boundaries
- Split by headings when possible
- Maintain hierarchy information

**Code** (Special handling)
- Keep code blocks together
- Split by logical sections or classes
- Preserve indentation and structure

**Assessments** (Special handling)
- Mark quiz questions as individual chunks
- Mark assignment descriptions separately
- Do NOT chunk answers (keep hidden)

#### **Chunking Algorithm**

```typescript
function chunk(text: string, maxTokens: number = 800): Chunk[] {
  // 1. Estimate tokens (rough: 1 token ≈ 4 characters)
  // 2. If under limit: return single chunk
  // 3. Otherwise: split by sentence/paragraph boundaries
  // 4. Aim for chunks close to maxTokens without breaking mid-sentence
}
```

**Output:**
```typescript
Chunk[] {
  id: string;
  originalContentId: string;
  text: string;
  startIndex: number;
  endIndex: number;
  metadata: {
    contentType: string;
    title: string;
    section: string;
    lectureId: string;
    position: number;
    isAssessment: boolean;
  };
}
```

---

### **Step 5: Embedding Generation**

**Responsibility:** Convert chunks to vectors for similarity search

**Location:** `src/features/ai-tutor/infrastructure/services/EmbeddingService.ts`

**Processing:**

1. **Batch Preparation**
   - Group chunks into batches of 25
   - Reason: OpenAI batching efficiency
   - Respect API rate limits (429 errors)

2. **API Calls**
   - POST to OpenAI Embeddings API
   - Model: `text-embedding-3-small` (cheaper, good quality)
   - Output: 1536-dimensional vectors

3. **Error Handling**
   - Rate limit (429): Wait 60s and retry
   - Timeout (>30s): Retry once
   - API error (5xx): Log and continue with next batch

4. **Caching**
   - Hash chunk content
   - Skip re-embedding if hash matches existing
   - Saves API costs

5. **Quality Checks**
   - Verify embedding dimensions (1536)
   - Check for NaN or Inf values
   - Validate magnitude (should be normalized)

**Output:**
```typescript
ChunkWithEmbedding {
  id: string;
  text: string;
  embedding: number[];  // 1536 dimensions
  metadata: Record<string, any>;
}
```

**Performance:**
- Embedding generation: ~0.5s per batch of 25 chunks
- Cost: ~$0.001 per 1000 embeddings

---

### **Step 6: Vector Storage**

**Responsibility:** Store embeddings in vector database for retrieval

**Location:** `src/features/ai-tutor/infrastructure/adapters/PostgresVectorAdapter.ts`

**Processing:**

1. **Vector Preparation**
   - Convert to PostgreSQL pgvector format
   - Normalize vectors to unit length (improves similarity search)

2. **Database Insertion**
   ```sql
   INSERT INTO knowledge_chunks (
     id, courseId, lectureId, sectionId, 
     content, contentType, embedding, 
     metadata, sensitivity, createdAt
   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   ON CONFLICT (id) DO UPDATE SET
     embedding = EXCLUDED.embedding,
     updatedAt = CURRENT_TIMESTAMP;
   ```

3. **Index Management**
   - Create HNSW index for fast similarity search
   - Rebuild index if corrupted
   - Analyze statistics for query optimization

4. **Metadata Storage**
   - Store chunk metadata as JSONB
   - Metadata includes:
     - Source lecture/section
     - Content type
     - Extraction date
     - Sensitivity level
     - Learning objectives

**Output:**
- Chunks stored in `knowledge_chunks` table
- Embeddings stored in `embedding` column (pgvector type)
- Searchable via HNSW index

**Performance:**
- Database insert: ~5-10ms per chunk
- Index update: ~20-50ms per batch
- Total: ~100-200ms per 10 chunks

---

### **Step 7: Index Completion & Validation**

**Responsibility:** Verify indexing success and update metadata

**Processing:**

1. **Completion Status**
   - Mark course as fully indexed
   - Update `lastIndexedAt` timestamp
   - Query: `UPDATE courses SET lastIndexedAt = NOW() WHERE id = ?`

2. **Statistics**
   - Count chunks created/updated
   - Log statistics for monitoring
   - Example: "Indexed 450 chunks from 12 lectures"

3. **Validation**
   - Verify chunk count matches expected
   - Spot-check: Run test queries to ensure retrievability
   - Log any anomalies

4. **Notifications** (Optional)
   - Send instructor email: "Course indexed successfully"
   - Update UI status for admin
   - Log event for auditing

**Output:**
```typescript
IndexingResult {
  courseId: string;
  success: boolean;
  chunksCreated: number;
  chunksUpdated: number;
  chunksDeleted: number;
  duration: number;  // milliseconds
  errors: string[];
}
```

---

## Indexing Trigger Strategies

### **Automatic Indexing Scenarios**

| Event | Trigger | Scope | Latency |
|-------|---------|-------|---------|
| Course Published | Webhook | Full course | Immediate |
| Lecture Updated | Event | Single lecture | Immediate |
| Attachment Added | Event | Attachment only | Immediate |
| Section Reordered | Event | Full course | Deferred (next batch) |
| Daily Batch | Scheduled | All pending | Off-peak (2am) |

### **Optimization Strategies**

#### **Incremental Indexing**
- Only re-process changed content
- Use content hash to detect changes
- Saves ~80% of indexing time for small updates

#### **Priority Queue**
- Published courses: High priority
- Draft courses: Low priority
- Instructor-initiated: Highest priority

#### **Rate Limiting**
- Max 5 concurrent indexing jobs
- Prevents API quota exhaustion
- Uses job queue (BullMQ)

#### **Caching**
- Cache extracted text
- Cache generated embeddings
- Skip re-processing if content unchanged

#### **Batch Processing**
- Group small updates
- Process nightly in batches
- Saves API costs

---

## Error Recovery

| Error | Strategy | Outcome |
|-------|----------|---------|
| Rate Limited | Exponential backoff | Retry after delay |
| API Timeout | Retry once, then skip | Log for manual review |
| Corrupted File | Skip gracefully | Continue with next file |
| Database Error | Retry transaction | Flag for admin review |
| Low Retrieval Quality | Log analytics | Track for improvement |

---

## Monitoring & Observability

### **Key Metrics**

- **Indexing Duration:** Time to complete indexing
- **Chunk Count:** Number of chunks created per course
- **Embedding Cost:** API cost per course
- **Retrieval Success Rate:** % of test queries returning relevant results
- **Error Rate:** % of failed indexing jobs

### **Alerts**

- Indexing fails or times out (>30min)
- Chunk count anomaly (e.g., 10x normal)
- API rate limiting triggered
- Vector search returns no results

---

## Future Enhancements

- **Incremental Embedding Updates:** Only re-embed changed chunks
- **Hybrid Search:** Combine keyword + semantic search
- **Content Deduplication:** Identify and merge duplicate chunks
- **Automatic Summarization:** Store summaries with chunks
- **Concept Extraction:** Automatically tag learning concepts

---

Last Updated: 2024
