# Runtime Pipeline

Complete flow of a student question through the AI Tutor system.

## High-Level Flow

```
Student Question
    ↓
Authentication & Rate Limiting
    ↓
Course Context Assembly
    ↓
Content Retrieval (Vector Search)
    ↓
Prompt Construction
    ↓
LLM Processing (Streaming)
    ↓
Response Validation
    ↓
Conversation Storage
    ↓
Streamed Response to Student
```

---

## Detailed Pipeline Steps

### **Step 1: API Endpoint Reception**

**Responsibility:** Receive and validate incoming question

**Location:** `src/features/ai-tutor/api/routes/`

**Input:**
```typescript
{
  courseSlug: string;
  lectureId?: string;
  threadId?: string;
  question: string;
}
```

**Processing:**
- Validate required fields
- Sanitize text input
- Check request format

**Output:**
- Validated request object or validation error

**Error Cases:**
- Missing required fields → HTTP 400
- Invalid JSON → HTTP 400
- Oversized payload → HTTP 413

---

### **Step 2: Authentication & Authorization**

**Responsibility:** Verify user identity and permissions

**Location:** `src/features/ai-tutor/api/middleware/`

**Processing:**
- Extract and verify JWT token
- Confirm user is enrolled in course
- Check feature flag is enabled

**Output:**
- Authenticated user ID and course access

**Error Cases:**
- No auth token → HTTP 401
- Invalid token → HTTP 401
- Not enrolled in course → HTTP 403
- Feature disabled → HTTP 403

---

### **Step 3: Rate Limiting**

**Responsibility:** Prevent abuse and API quota exhaustion

**Location:** `src/features/ai-tutor/api/middleware/rateLimiter.ts`

**Processing:**
- Check request count for user
- Compare against configured limits (e.g., 30 req/min per student)
- Allow or reject based on usage

**Output:**
- Pass-through if within limits, or HTTP 429 if exceeded

**Configuration:**
```typescript
const RATE_LIMITS = {
  messagesPerMinute: 30,
  messagesPerHour: 300,
  messagesPerDay: 5000,
};
```

---

### **Step 4: Course Context Assembly**

**Responsibility:** Gather all relevant context for the session

**Location:** `src/features/ai-tutor/application/services/CourseContextService.ts`

**Processing:**

1. **Fetch Course Data**
   - Course title, description, objectives
   - Query: `SELECT * FROM courses WHERE id = ?`

2. **Fetch Lecture Data** (if lectureId provided)
   - Lecture title, description, objectives
   - Query: `SELECT * FROM lectures WHERE id = ?`

3. **Fetch Student Progress**
   - Completed lectures, quiz scores
   - Query: `SELECT * FROM enrollments/progress WHERE userId = ? AND courseId = ?`

4. **Load Learning Profile** (if available)
   - Explanation preferences
   - Common mistakes, knowledge gaps
   - Query: `SELECT * FROM student_learning_profiles WHERE userId = ? AND courseId = ?`

**Output:**
```typescript
TutorSessionContext {
  courseId: string;
  userId: string;
  lectureId?: string;
  course: CourseInfo;
  lecture?: LectureInfo;
  studentProgress: ProgressData;
  learningProfile?: StudentLearningProfile;
}
```

**Performance:**
- Should complete in <100ms
- Results are cached for 5 minutes per session

---

### **Step 5: Conversation & Thread Resolution**

**Responsibility:** Retrieve relevant conversation history

**Location:** `src/features/ai-tutor/application/services/ConversationService.ts`

**Processing:**

1. **Get or Create Conversation**
   - Course-scoped: one per (user, course)
   - Query: `SELECT * FROM tutor_conversations WHERE userId = ? AND courseId = ?`

2. **Get or Create Thread**
   - If threadId provided: fetch existing thread
   - Otherwise: create new thread for lecture
   - Query: `SELECT * FROM tutor_threads WHERE id = ?`

3. **Load Recent Messages**
   - Last 10-20 messages in thread for context
   - Query: `SELECT * FROM tutor_messages WHERE threadId = ? ORDER BY createdAt DESC LIMIT 20`

**Output:**
```typescript
{
  conversation: TutorConversation;
  thread: TutorThread;
  recentMessages: TutorMessage[];
}
```

---

### **Step 6: Content Retrieval (Vector Search)**

**Responsibility:** Find relevant course materials

**Location:** `src/features/ai-tutor/application/services/ContentRetriever.ts`

**Processing:**

1. **Generate Question Embedding**
   - Send question to OpenAI Embeddings API
   - Receive 1536-dimensional vector
   - Latency: ~100-150ms

2. **Vector Similarity Search**
   - Query PostgreSQL with pgvector
   - `SELECT * FROM knowledge_chunks WHERE embedding <-> ? < 0.7 LIMIT 10`
   - Returns top-10 most similar chunks

3. **Relevance Filtering**
   - Score each chunk
   - Filter by relevance threshold (e.g., cosine similarity > 0.7)
   - Remove assessment content unless safe to include

4. **Source Organization**
   - Group by lecture/section
   - Sort by relevance and source type
   - Return top 5-10 chunks

**Output:**
```typescript
KnowledgeChunk[] {
  id: string;
  courseId: string;
  lectureId: string;
  content: string;
  contentType: string;
  metadata: { title, source, position };
  embedding: number[];
}
```

**Performance:**
- Question embedding: ~100-150ms (API call)
- Vector search: ~50-100ms (database)
- Total: <250ms

**Edge Cases:**
- No results found: Signals to use fallback mode
- Low confidence results: May trigger suggestion mode
- Assessment-only content: Filtered unless guidelines allow

---

### **Step 7: Prompt Construction**

**Responsibility:** Build the LLM prompt with full context

**Location:** `src/features/ai-tutor/application/services/PromptBuilder.ts`

**Processing:**

1. **System Prompt**
   - Base educational guidelines
   - Role definition (helpful tutor)
   - Constraints (guide vs. tell, educational integrity)

2. **Context Injection**
   ```
   Current Course: [Course Title]
   Current Lecture: [Lecture Title]
   Learning Objectives: [Objectives]
   
   Student Progress: [Completion %], [Quiz Average]
   Student Preferences: [Explanation Style]
   ```

3. **Retrieved Content Integration**
   ```
   Relevant course materials:
   
   [From Lecture: Content Title]
   [Content snippet]
   
   [From Lecture: Content Title]
   [Content snippet]
   ```

4. **Conversation History**
   ```
   Student: [Previous question]
   Assistant: [Previous response]
   
   Student: [Previous question]
   Assistant: [Previous response]
   
   Student: [Current question]
   Assistant: [Generating...]
   ```

5. **Token Counting**
   - Calculate total tokens
   - Ensure under model limit (4096 for gpt-3.5, 8192 for gpt-4)
   - Trim history if needed

**Output:**
```typescript
{
  system: string;  // System prompt with guidelines
  messages: [      // Conversation with history
    { role: 'user', content: string },
    { role: 'assistant', content: string },
    // ...
    { role: 'user', content: 'Current question' }
  ];
}
```

**Token Budget:**
- System prompt: ~500 tokens
- Context: ~300 tokens
- Retrieved content: ~1000 tokens (top 5 chunks)
- Conversation history: ~1000 tokens
- Reserve for response: ~1000 tokens
- **Total: ~3800 tokens** (well under 4096 limit)

---

### **Step 8: LLM Processing (Streaming)**

**Responsibility:** Get AI response from OpenAI

**Location:** `src/features/ai-tutor/infrastructure/adapters/OpenAILlmAdapter.ts`

**Processing:**

1. **API Request**
   - POST to `https://api.openai.com/v1/chat/completions`
   - Model: `gpt-3.5-turbo` or `gpt-4`
   - Stream: `true` for real-time token streaming
   - Temperature: 0.7 (balanced creativity)

2. **Streaming Response**
   - Receive tokens as they're generated
   - Each token sent as `data: [json]\n`
   - Stream ends with `[DONE]`

3. **Error Handling**
   - Rate limit (429): Retry with exponential backoff
   - Timeout (after 30s): Return error to client
   - API errors (5xx): Retry with backoff, then fail gracefully

**Output:**
```typescript
AsyncIterableIterator<string>  // Stream of tokens
```

**Latency:**
- Time to first token: ~300-500ms
- Subsequent tokens: ~50-100ms each
- Total response time: ~2-5 seconds for typical response

---

### **Step 9: Response Validation**

**Responsibility:** Ensure response meets educational and safety standards

**Location:** `src/features/ai-tutor/application/services/ResponseValidator.ts`

**Processing:**

1. **Content Filtering**
   - Check for direct quiz answers (if retrieved content was assessment)
   - Detect assignment solutions
   - Flag hallucinations or unsupported claims

2. **Groundedness Check**
   - Verify claims are supported by retrieved content
   - Flag if response diverges significantly

3. **Educational Integrity**
   - Ensure guided learning approach is used
   - Verify assessment boundaries respected

4. **Post-Processing**
   - Add source citations if applicable
   - Format for readability
   - Ensure response length is appropriate

**Output:**
```typescript
ValidationResult {
  isValid: boolean;
  warnings: string[];
  citations: string[];
  finalResponse: string;
}
```

**Fallback Modes:**
- If assessment content detected: Use guidance mode
- If low groundedness: Add disclaimers
- If response fails: Suggest relevant materials instead

---

### **Step 10: Conversation Storage**

**Responsibility:** Persist conversation for history and analytics

**Location:** `src/features/ai-tutor/application/services/ConversationService.ts`

**Processing:**

1. **Create Message Record**
   ```sql
   INSERT INTO tutor_messages (
     threadId, role, content, retrievedSources, createdAt
   ) VALUES (?, ?, ?, ?, ?)
   ```

2. **Update Thread Metadata**
   - Update `updatedAt` timestamp
   - Increment message count

3. **Create Analytics Event** (async)
   - Log question, sources, response quality
   - Track for evaluation and improvement

**Output:**
- Persisted message object with ID

**Performance:**
- Database insert: ~10-20ms
- Async analytics: Non-blocking

---

### **Step 11: Stream Response to Client**

**Responsibility:** Send response to user interface

**Location:** `src/features/ai-tutor/api/routes/messages.ts`

**Processing:**

1. **HTTP Streaming**
   - Set headers: `Content-Type: text/event-stream`
   - Send accumulated response tokens
   - Complete stream when generation ends

2. **Error Handling**
   - If streaming fails mid-response: Send error marker
   - Client receives stream and handles appropriately

3. **WebSocket Alternative** (Future)
   - Bidirectional streaming for better performance
   - Real-time token arrival

**Output:**
```
data: token1\n
data: token2\n
data: token3\n
...
```

---

## Performance Characteristics

| Component | Duration | Notes |
|-----------|----------|-------|
| Context Assembly | <100ms | Cached when possible |
| Question Embedding | ~120ms | OpenAI API |
| Vector Search | ~75ms | Database query |
| Prompt Construction | <50ms | Local computation |
| LLM Streaming | 2-5s | Depends on response length |
| Response Validation | <200ms | Post-processing |
| DB Storage | ~20ms | Async |
| **Total E2E** | **2.5-5.5s** | First token at ~500ms |

---

## Error Recovery

| Error | Cause | Recovery |
|-------|-------|----------|
| Rate Limit | Too many requests | Reject with HTTP 429, suggest cooldown |
| No Content | Nothing to retrieve | Use fallback mode, suggest materials |
| LLM Timeout | API unresponsive | Return error after 30s, log for monitoring |
| DB Failure | Connection lost | Retry once, return error to user |
| Invalid Input | Malformed request | Return HTTP 400 with error message |

---

Last Updated: 2024
