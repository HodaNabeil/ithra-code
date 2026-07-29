# Testing Strategy

Comprehensive testing approach for AI Tutor across all components and stages.

## Testing Pyramid

```
                    ▲
                   /█\
                  /███\        E2E Tests (5-10%)
                 /█████\       Integration & Acceptance
                /███████\
               /█████████\     Integration Tests (30-40%)
              /███████████\    Database, API, Services
             /█████████████\
            /███████████████\   Unit Tests (50-60%)
           /█████████████████\  Functions, Services, Models
          /███████████████████\
         ███████████████████████
```

---

## Unit Tests

### **Scope**
Test individual functions, services, and domain models in isolation.

### **Target Coverage**
- Domain models: 100% (all rules and validations)
- Services: 80%+ (all error paths)
- Adapters: 70%+ (mocked external calls)
- Use cases: 80%+ (all flows and errors)

### **Tools**
- Framework: Vitest or Jest
- Mocking: vitest.mock() or jest.mock()
- Assertions: expect() with custom matchers

### **Example Test Areas**

#### **Domain Models**

```typescript
// tests/domain/TutorMessage.test.ts
describe('TutorMessage', () => {
  it('should create message with valid data', () => {
    const message = new TutorMessage({
      threadId: 'thread-1',
      role: 'user',
      content: 'What is X?',
    });
    expect(message.role).toBe('user');
  });

  it('should reject invalid role', () => {
    expect(() => {
      new TutorMessage({ role: 'invalid' });
    }).toThrow();
  });
});
```

#### **Prompt Builder**

```typescript
// tests/application/services/PromptBuilder.test.ts
describe('PromptBuilder', () => {
  let builder: PromptBuilder;

  beforeEach(() => {
    builder = new PromptBuilder();
  });

  it('should include course context in system prompt', () => {
    const context = {
      course: { title: 'Web Development' },
      lecture: { title: 'React Basics' },
    };
    const prompt = builder.buildPrompt({ context });
    expect(prompt.system).toContain('Web Development');
    expect(prompt.system).toContain('React Basics');
  });

  it('should include conversation history', () => {
    const history = [
      { role: 'user', content: 'What is React?' },
      { role: 'assistant', content: 'React is...' },
    ];
    const prompt = builder.buildPrompt({ conversationHistory: history });
    expect(prompt.messages).toContainEqual(history[0]);
  });

  it('should respect token limits', () => {
    const longContext = { largeContent: 'x'.repeat(100000) };
    const prompt = builder.buildPrompt(longContext);
    expect(tokenCount(prompt)).toBeLessThan(4096);
  });
});
```

#### **Content Classifier**

```typescript
// tests/application/services/ContentClassificationService.test.ts
describe('ContentClassificationService', () => {
  let classifier: ContentClassificationService;

  beforeEach(() => {
    classifier = new ContentClassificationService();
  });

  it('should classify quiz content as assessment', () => {
    const content = 'Quiz: What is React? A) ... B) ...';
    const result = classifier.classify(content);
    expect(result.isAssessment).toBe(true);
    expect(result.type).toBe('quiz');
  });

  it('should classify lecture content as learning material', () => {
    const content = 'Lecture 5: React Fundamentals. React is a library...';
    const result = classifier.classify(content);
    expect(result.isAssessment).toBe(false);
    expect(result.type).toBe('lecture');
  });
});
```

---

## Integration Tests

### **Scope**
Test interactions between components, databases, and external services.

### **Target Coverage**
- API endpoints: 90%+
- Database operations: 90%+
- Service orchestration: 80%+
- Error scenarios: All critical paths

### **Tools**
- Framework: Vitest with integration setup
- Database: Test database with migrations
- External APIs: Mocked with MSW (Mock Service Worker)
- Test Fixtures: Factory functions for test data

### **Test Database**
- Use PostgreSQL test instance
- Run migrations before each test suite
- Rollback after each test
- Use transactions for test isolation

### **Example Integration Tests**

#### **Conversation API Endpoint**

```typescript
// tests/integration/api/messages.test.ts
describe('POST /api/tutor/messages', () => {
  let db: Database;
  let api: API;

  beforeAll(async () => {
    db = await setupTestDatabase();
    api = await startTestServer(db);
  });

  afterAll(async () => {
    await db.close();
    await api.close();
  });

  it('should save message and return response', async () => {
    // Setup: Create course and student
    const course = await db.courses.create({ title: 'Web Dev' });
    const student = await db.users.create({ email: 'test@test.com' });
    const enrollment = await db.enrollments.create({ studentId: student.id, courseId: course.id });

    // Act: Send question
    const response = await api.post('/api/tutor/messages', {
      courseSlug: course.slug,
      question: 'What is React?',
    });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body.message).toBeDefined();
    
    // Verify persistence
    const savedMessage = await db.tutorMessages.findById(response.body.message.id);
    expect(savedMessage.content).toContain('React');
  });

  it('should enforce rate limiting', async () => {
    const requests = Array(35).fill(null);
    const responses = await Promise.all(
      requests.map(() => api.post('/api/tutor/messages', { question: 'Test' }))
    );
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('should return 403 if not enrolled', async () => {
    const course = await db.courses.create({ title: 'Web Dev' });
    const student = await db.users.create({ email: 'test@test.com' });
    // Note: No enrollment created

    const response = await api.post('/api/tutor/messages', {
      courseSlug: course.slug,
      question: 'What is React?',
    });

    expect(response.status).toBe(403);
  });
});
```

#### **Content Retrieval Service**

```typescript
// tests/integration/services/ContentRetriever.test.ts
describe('ContentRetriever Integration', () => {
  let retriever: ContentRetriever;
  let db: Database;
  let vectorSearch: VectorSearchPort;

  beforeAll(async () => {
    db = await setupTestDatabase();
    vectorSearch = new PostgresVectorAdapter(db);
    retriever = new ContentRetriever(vectorSearch);
  });

  it('should retrieve relevant content chunks', async () => {
    // Setup: Create and index course content
    const course = await db.courses.create({ title: 'React' });
    const chunks = [
      { courseId: course.id, content: 'React is a JavaScript library' },
      { courseId: course.id, content: 'JSX is React syntax' },
      { courseId: course.id, content: 'CSS is for styling' },
    ];
    await Promise.all(chunks.map(c => createAndIndexChunk(c)));

    // Act: Retrieve for question
    const results = await retriever.retrieve({
      question: 'What is React?',
      courseId: course.id,
      topK: 2,
    });

    // Assert: React content ranked higher
    expect(results[0].content).toContain('React');
    expect(results.length).toBe(2);
  });
});
```

---

## Prompt Engineering Tests

### **Scope**
Validate prompt quality, context inclusion, and educational guidelines.

### **Test Types**

#### **Context Assembly Tests**

```typescript
// tests/prompts/context-assembly.test.ts
describe('Prompt Context Assembly', () => {
  it('should include all required context elements', () => {
    const context = {
      course: { title: 'React', objectives: ['Learn React'] },
      lecture: { title: 'Basics', objectives: ['Understand JSX'] },
      studentProgress: { completed: 5, total: 10 },
    };

    const prompt = buildPrompt({ context });

    // Verify all elements are present
    expect(prompt.system).toContain(context.course.title);
    expect(prompt.system).toContain(context.lecture.title);
    expect(prompt.system).toContain('50%'); // Progress percentage
  });
});
```

#### **Educational Guideline Tests**

```typescript
// tests/prompts/educational-guidelines.test.ts
describe('Educational Guidelines in Prompts', () => {
  it('should guide instead of tell for quiz questions', () => {
    const context = { isAssessment: true };
    const prompt = buildPrompt({ context });
    
    // Should emphasize guided discovery
    expect(prompt.system).toContain('guide');
    expect(prompt.system).toContain('discover');
    expect(prompt.system).not.toContain('directly answer');
  });

  it('should include encouragement for learning', () => {
    const prompt = buildPrompt({});
    expect(prompt.system).toContain('help');
    expect(prompt.system).toContain('learn');
  });
});
```

#### **Conversation History Tests**

```typescript
// tests/prompts/conversation-history.test.ts
describe('Conversation History in Prompts', () => {
  it('should maintain context across messages', () => {
    const history = [
      { role: 'user', content: 'What is React?' },
      { role: 'assistant', content: 'React is a library for building UIs' },
      { role: 'user', content: 'What about JSX?' },
    ];

    const prompt = buildPrompt({ conversationHistory: history });
    
    // Should include full history for context
    expect(prompt.messages).toHaveLength(3);
    expect(prompt.messages[0].content).toContain('React');
  });

  it('should handle long conversation history', () => {
    const history = Array(100).fill(null).map((_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }));

    const prompt = buildPrompt({ conversationHistory: history });
    
    // Should trim to fit token limit
    expect(tokenCount(prompt)).toBeLessThan(4096);
    // Recent messages should be preserved
    expect(prompt.messages[prompt.messages.length - 1].content).toContain('Message 99');
  });
});
```

---

## RAG Evaluation Tests

### **Scope**
Measure effectiveness of content retrieval and response quality.

### **Metrics**

#### **1. Retrieval Precision**
Percentage of relevant chunks in top-k results.

```typescript
// tests/rag/retrieval-precision.test.ts
describe('Retrieval Precision', () => {
  let testDataset: EvaluationQuestion[];

  beforeAll(() => {
    testDataset = loadEvaluationDataset();
  });

  it('should achieve >80% precision@5', async () => {
    let precisionSum = 0;

    for (const question of testDataset) {
      const results = await retriever.retrieve({
        question: question.text,
        topK: 5,
      });

      const relevant = results.filter(r => 
        question.expectedSources.includes(r.id)
      ).length;

      const precision = relevant / results.length;
      precisionSum += precision;
    }

    const avgPrecision = precisionSum / testDataset.length;
    expect(avgPrecision).toBeGreaterThan(0.8);
  });
});
```

#### **2. Groundedness**
Response is supported by retrieved content.

```typescript
// tests/rag/groundedness.test.ts
describe('Response Groundedness', () => {
  it('should base responses on retrieved content', async () => {
    const question = 'What is React?';
    const retrieved = [
      { id: '1', content: 'React is a JavaScript library for building UIs' },
    ];

    const response = await askTutor({
      question,
      retrievedContent: retrieved,
    });

    // Check if response references the content
    expect(response).toContain('library');
    expect(response).toContain('UI');
  });

  it('should not hallucinate about missing content', async () => {
    const question = 'What is advanced React?';
    const retrieved = []; // No content found

    const response = await askTutor({
      question,
      retrievedContent: retrieved,
    });

    // Should indicate lack of information
    expect(response).toContain('not covered') || 
    expect(response).toContain('not found');
  });
});
```

#### **3. Hallucination Detection**
Responses don't contain unsupported claims.

```typescript
// tests/rag/hallucination.test.ts
describe('Hallucination Detection', () => {
  it('should not claim information from absent content', async () => {
    const retrieved = [
      { content: 'React uses virtual DOM' },
    ];

    const response = await askTutor({ retrievedContent: retrieved });

    // Should not claim specific version details if not in content
    expect(response).not.toMatch(/React version \d+\.\d+/);
  });

  it('should detect and flag potential hallucinations', async () => {
    const response = "React was created by Google in 2010";
    const retrieved = [
      { content: "React was created by Facebook and open-sourced in 2013" },
    ];

    const validation = validateResponse(response, retrieved);
    expect(validation.hallucinations).toContain('creator');
    expect(validation.hallucinations).toContain('year');
  });
});
```

#### **4. Response Quality**
Helpfulness and clarity scores.

```typescript
// tests/rag/response-quality.test.ts
describe('Response Quality', () => {
  it('should provide helpful answers', async () => {
    const questions = [
      { question: 'How does React work?', minLength: 100 },
      { question: 'What is JSX?', minLength: 50 },
    ];

    for (const q of questions) {
      const response = await askTutor({ question: q.question });
      expect(response.length).toBeGreaterThan(q.minLength);
    }
  });

  it('should match difficulty to student level', async () => {
    const beginner = await askTutor({
      question: 'What is React?',
      context: { level: 'beginner' },
    });
    
    const advanced = await askTutor({
      question: 'What is React?',
      context: { level: 'advanced' },
    });

    // Beginner response should be simpler
    expect(beginner.split(' ').length).toBeLessThan(advanced.split(' ').length);
  });
});
```

#### **5. Educational Integrity**
Assessment content not revealed.

```typescript
// tests/rag/educational-integrity.test.ts
describe('Educational Integrity', () => {
  it('should never reveal quiz answers', async () => {
    const response = await askTutor({
      question: 'What is the answer to quiz question 5?',
      retrievedContent: [
        { 
          type: 'quiz',
          content: 'Q: What is React? A) Library B) Framework',
          answers: ['A'],
        },
      ],
    });

    expect(response).not.toContain('answer');
    expect(response).not.toContain('A)');
    expect(response).toContain('guide') || expect(response).toContain('help');
  });

  it('should not reveal assignment solutions', async () => {
    const response = await askTutor({
      question: 'Show me the assignment solution',
      retrievedContent: [
        {
          type: 'assignment',
          content: 'Assignment: Build a calculator',
          solution: 'function add(a, b) { return a + b; }',
        },
      ],
    });

    expect(response).not.toContain('function');
    expect(response).not.toContain('return');
  });
});
```

---

## AI Evaluation Dataset

### **Purpose**
Automated quality assurance and regression testing for AI responses.

### **Dataset Structure**

```typescript
interface EvaluationQuestion {
  id: string;
  category: string;
  question: string;
  expectedSources: string[];  // Expected chunk IDs to retrieve
  acceptableSources: string[]; // Alternative valid sources
  expectedKeywords: string[];  // Should be in response
  forbiddenKeywords: string[]; // Should NOT be in response
  minLength: number;
  maxLength: number;
  expectedDifficulty: 'beginner' | 'intermediate' | 'advanced';
  isAssessmentQuestion: boolean;
}
```

### **Dataset Coverage**

**20-30 questions covering:**
- Basic concepts (10%)
- Advanced topics (20%)
- Application/synthesis (30%)
- Edge cases (20%)
- Assessment-related (20%)

### **Example Questions**

```typescript
const evaluationDataset: EvaluationQuestion[] = [
  {
    id: 'eval-001',
    category: 'fundamental',
    question: 'What is React?',
    expectedSources: ['lecture-1-intro', 'transcript-1'],
    expectedKeywords: ['library', 'UI', 'JavaScript'],
    forbiddenKeywords: ['Python', 'backend'],
    minLength: 100,
    maxLength: 500,
    expectedDifficulty: 'beginner',
    isAssessmentQuestion: false,
  },
  {
    id: 'eval-002',
    category: 'application',
    question: 'Show me an example of React hooks',
    expectedSources: ['lecture-5-hooks', 'attachment-code-examples'],
    expectedKeywords: ['useState', 'useEffect'],
    forbiddenKeywords: ['class'],
    minLength: 200,
    maxLength: 800,
    expectedDifficulty: 'intermediate',
    isAssessmentQuestion: false,
  },
];
```

### **Automated Metrics Collection**

```typescript
// tests/rag-eval/metrics-collection.test.ts
describe('AI Evaluation Metrics', () => {
  it('should collect metrics for all evaluation questions', async () => {
    const results: EvaluationResult[] = [];

    for (const question of evaluationDataset) {
      const result = await evaluateQuestion(question);
      results.push(result);
    }

    // Aggregate metrics
    const summary = aggregateResults(results);
    
    // Assert baselines
    expect(summary.avgRetrievalPrecision).toBeGreaterThan(0.75);
    expect(summary.hallucationRate).toBeLessThan(0.15);
    expect(summary.groundednessScore).toBeGreaterThan(0.8);
    expect(summary.educationalIntegrityScore).toBeGreaterThan(0.95);
  });
});
```

---

## Regression Testing Automation

### **Trigger**
Run automatically after:
- Major LLM prompt changes
- Content filtering updates
- Retrieval algorithm changes
- Pre-production deployment

### **Pipeline**

```typescript
// scripts/ai-regression-test.ts
async function runRegressionTests() {
  console.log('Starting AI regression tests...');

  // 1. Run evaluation dataset
  const metrics = await runEvaluationDataset();
  
  // 2. Compare to baseline
  const baseline = loadBaseline();
  const regression = detectRegression(metrics, baseline);

  // 3. Report
  const report = generateReport(metrics, regression);
  console.log(report);

  // 4. Alert if regression
  if (regression.severity === 'high') {
    await notifySlack('AI regression detected!', report);
    process.exit(1);
  }
}
```

### **Baseline Metrics**
Established after Sprint 9:

```yaml
retrieval_precision: 0.82
hallucination_rate: 0.08
groundedness_score: 0.85
response_quality: 4.2/5
educational_integrity: 0.98
avg_response_time: 2.3s
```

---

## Testing Milestones

| Sprint | Key Tests | Coverage |
|--------|-----------|----------|
| Sprint 1 | Unit: LLM adapter, Use case | 70% |
| Sprint 2 | Integration: DB persistence | 75% |
| Sprint 3 | Prompt tests, Context assembly | 80% |
| Sprint 5 | RAG tests, Retrieval evaluation | 85% |
| Sprint 7 | Educational integrity, Response filtering | 90% |
| Sprint 9 | Full regression suite, E2E, Load tests | 95%+ |

---

## Continuous Testing

### **CI/CD Integration**
- Run unit tests on every commit
- Run integration tests on PRs
- Run prompt tests before merge to main
- Run full evaluation dataset nightly
- Report metrics to dashboard

### **Monitoring in Production**
- Track actual vs. expected metrics
- Alert on metric degradation
- Auto-rollback on critical failures

---

Last Updated: 2024
