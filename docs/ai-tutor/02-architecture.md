# AI Tutor Architecture

Clean Architecture implementation for the IthraCode AI Tutor feature.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  (React Components, UI State Management, Streaming)         │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                     API Layer                               │
│  (REST Endpoints, Request/Response Serialization)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│               Application Layer                             │
│  (Use Cases, Orchestration, Business Rules)                 │
│  - AskTutorUseCase                                          │
│  - CourseContextService                                     │
│  - PromptBuilder                                            │
│  - ContentRetriever                                         │
│  - ResponseValidator                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│                   Domain Layer                              │
│  (Business Logic, Domain Models, Ports)                     │
│  - TutorMessage, TutorConversation, TutorThread             │
│  - KnowledgeChunk, LectureTranscript                        │
│  - TutorSessionContext                                      │
│  - Ports: LlmPort, EmbeddingPort, etc.                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────────┐
│              Infrastructure Layer                           │
│  (External Services, Database, Adapters)                    │
│  - OpenAILlmAdapter, OpenAIEmbeddingAdapter                │
│  - ConversationRepository, KnowledgeChunkRepository         │
│  - VectorSearchAdapter                                      │
│  - ContentExtractionService                                 │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### **Presentation Layer**
- React components for AI chat interface
- Message streaming and UI state management
- Thread navigation and conversation display
- Loading states and error handling

**Location:** `src/features/ai-tutor/presentation/components/`

### **API Layer**
- REST endpoints for chat operations
- Request validation and serialization
- Response formatting
- Authentication middleware

**Location:** `src/features/ai-tutor/api/`

### **Application Layer**
- Business logic and use cases
- Service orchestration
- Context building and prompt engineering
- Response validation and filtering

**Location:** `src/features/ai-tutor/application/`

### **Domain Layer**
- Business entity definitions
- Domain rules and constraints
- Port interfaces (abstractions)
- Value objects

**Location:** `src/features/ai-tutor/domain/`

### **Infrastructure Layer**
- External service adapters (OpenAI, Vector DB)
- Repository implementations
- Content processing services
- Job queue integrations

**Location:** `src/features/ai-tutor/infrastructure/`

## Port & Adapter Pattern

All external dependencies are abstracted through ports defined in the domain layer. Adapters implement these ports in the infrastructure layer.

### **Core Ports**

#### **LlmPort**
Abstract interface for large language model operations.

```typescript
// Location: src/features/ai-tutor/domain/ports/LlmPort.ts
export interface LlmPort {
  streamAnswer(params: {
    messages: Array<{ role: string; content: string }>;
    systemPrompt: string;
  }): AsyncIterableIterator<string>;
}
```

**Current Adapter:** `OpenAILlmAdapter` (Sprint 1)

---

#### **EmbeddingPort**
Abstract interface for text embeddings.

```typescript
// Location: src/features/ai-tutor/domain/ports/EmbeddingPort.ts
export interface EmbeddingPort {
  generateEmbedding(text: string): Promise<number[]>;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}
```

**Current Adapter:** `OpenAIEmbeddingAdapter` (Sprint 4)

---

#### **VectorSearchPort**
Abstract interface for similarity search.

```typescript
// Location: src/features/ai-tutor/domain/ports/VectorSearchPort.ts
export interface VectorSearchPort {
  search(params: {
    embedding: number[];
    topK: number;
    filter?: Record<string, any>;
  }): Promise<SearchResult[]>;
}
```

**Current Adapter:** PostgreSQL pgvector adapter (Sprint 5)

---

#### **ConversationRepositoryPort**
Abstract interface for conversation persistence.

```typescript
// Location: src/features/ai-tutor/domain/ports/ConversationRepositoryPort.ts
export interface ConversationRepositoryPort {
  saveConversation(conversation: TutorConversation): Promise<void>;
  getConversation(courseId: string, userId: string): Promise<TutorConversation | null>;
  // ... other methods
}
```

**Current Adapter:** Prisma-based `ConversationRepository` (Sprint 2)

---

#### **ContentFilterPort**
Abstract interface for content filtering and validation.

```typescript
// Location: src/features/ai-tutor/domain/ports/ContentFilterPort.ts
export interface ContentFilterPort {
  shouldFilter(content: string): Promise<boolean>;
  transformToGuidance(content: string): Promise<string>;
  validateResponse(response: string): Promise<ValidationResult>;
}
```

**Current Adapter:** `EducationalContentFilter` (Sprint 7)

---

## Domain Models

### **TutorMessage**
Individual message in a conversation thread.

```typescript
// Location: src/features/ai-tutor/domain/models/TutorMessage.ts
export interface TutorMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant';
  content: string;
  retrievedSources?: KnowledgeChunk[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### **TutorConversation**
Course-scoped conversation container.

```typescript
// Location: src/features/ai-tutor/domain/models/TutorConversation.ts
export interface TutorConversation {
  id: string;
  courseId: string;
  userId: string;
  threads: TutorThread[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### **TutorThread**
Lecture/topic-specific thread within a conversation.

```typescript
// Location: src/features/ai-tutor/domain/models/TutorThread.ts
export interface TutorThread {
  id: string;
  conversationId: string;
  lectureId?: string;
  topic: string;
  messages: TutorMessage[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### **KnowledgeChunk**
Indexed piece of course content.

```typescript
// Location: src/features/ai-tutor/domain/models/KnowledgeChunk.ts
export interface KnowledgeChunk {
  id: string;
  courseId: string;
  lectureId?: string;
  sectionId?: string;
  content: string;
  contentType: 'lecture' | 'transcript' | 'attachment' | 'assignment' | 'quiz';
  metadata: {
    title: string;
    source: string;
    position?: number;
    isAssessment: boolean;
  };
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

### **TutorSessionContext**
Runtime context for a tutor session.

```typescript
// Location: src/features/ai-tutor/domain/models/TutorSessionContext.ts
export interface TutorSessionContext {
  courseId: string;
  userId: string;
  lectureId?: string;
  course: {
    id: string;
    title: string;
    description: string;
  };
  lecture?: {
    id: string;
    title: string;
    objectives: string[];
  };
  studentProgress: {
    completedLectures: number;
    totalLectures: number;
    quizScores: Map<string, number>;
  };
  learningProfile?: StudentLearningProfile;
}
```

---

## Service Layer

Services coordinate between use cases and adapters. Each service has a single responsibility.

### **Key Services**

#### **CourseContextService**
Assembles context for a tutor session.

```typescript
// Location: src/features/ai-tutor/application/services/CourseContextService.ts
export class CourseContextService {
  async buildContext(params: {
    courseId: string;
    userId: string;
    lectureId?: string;
  }): Promise<TutorSessionContext> {
    // Gather course, student, and progress data
  }
}
```

---

#### **PromptBuilder**
Constructs LLM prompts with context.

```typescript
// Location: src/features/ai-tutor/application/services/PromptBuilder.ts
export class PromptBuilder {
  buildPrompt(params: {
    context: TutorSessionContext;
    conversationHistory: TutorMessage[];
    retrievedContent: KnowledgeChunk[];
    userQuestion: string;
  }): { system: string; messages: Array<{ role: string; content: string }> } {
    // Build system and conversation prompts
  }
}
```

---

#### **ContentRetriever**
Retrieves relevant course content via RAG.

```typescript
// Location: src/features/ai-tutor/application/services/ContentRetriever.ts
export class ContentRetriever {
  async retrieve(params: {
    question: string;
    courseId: string;
    topK: number;
  }): Promise<KnowledgeChunk[]> {
    // Generate embedding and search vectors
  }
}
```

---

#### **ResponseValidator**
Ensures responses meet educational and safety standards.

```typescript
// Location: src/features/ai-tutor/application/services/ResponseValidator.ts
export class ResponseValidator {
  async validate(params: {
    response: string;
    context: TutorSessionContext;
    retrievedContent: KnowledgeChunk[];
  }): Promise<ValidationResult> {
    // Check for assessment leakage, hallucinations, etc.
  }
}
```

---

## Dependency Injection

Services are registered in a centralized configuration module.

```typescript
// Location: src/features/ai-tutor/infrastructure/di/AiTutorContainer.ts
export class AiTutorContainer {
  static register(container: DependencyContainer): void {
    // Port registrations
    container.register('LlmPort', () => new OpenAILlmAdapter(openaiApiKey));
    container.register('EmbeddingPort', () => new OpenAIEmbeddingAdapter(openaiApiKey));
    container.register('VectorSearchPort', () => new PostgresVectorAdapter(db));
    container.register('ConversationRepositoryPort', () => new ConversationRepository(prisma));

    // Service registrations
    container.register('CourseContextService', CourseContextService);
    container.register('PromptBuilder', PromptBuilder);
    container.register('ContentRetriever', ContentRetriever);
    container.register('ResponseValidator', ResponseValidator);

    // Use case registrations
    container.register('AskTutorUseCase', AskTutorUseCase);
  }
}
```

---

## Feature Flag Integration

AI Tutor is controlled by a feature flag that can be toggled without deployment.

```typescript
// Location: src/features/ai-tutor/infrastructure/config/AITutorConfig.ts
export class AITutorConfig {
  static isEnabled(): boolean {
    return process.env.AI_TUTOR_ENABLED === 'true';
  }

  static shouldRegisterServices(container: DependencyContainer): boolean {
    return this.isEnabled();
  }
}
```

---

## Communication Between Layers

### **Request Flow**
```
UI Component
    ↓
API Endpoint (validates input)
    ↓
Use Case (orchestrates)
    ↓
Services (business logic)
    ↓
Adapters (external calls)
    ↓
Response back through layers
```

### **Error Handling**
- Domain layer defines error types
- Application layer handles business logic errors
- API layer catches and formats all errors
- Presentation layer displays user-friendly messages

---

## Scalability Considerations

### **Horizontal Scaling**
- Stateless services allow horizontal scaling
- Conversation and context data in centralized database
- Vector search distributes across cluster

### **Performance Optimization**
- Streaming responses prevent large buffer accumulation
- Caching for embeddings and frequent contexts
- Batch processing for indexing operations
- Index optimization for vector searches

### **Maintainability**
- Clear port/adapter boundaries allow provider changes
- Service layer isolates business logic from infrastructure
- Domain layer stays free of framework dependencies
- Dependency injection enables testing and flexibility

---

## Extension Points

### **Future Enhancements**
- **Alternative LLM Providers:** Implement new `LlmPort` adapter
- **Vector Store Alternatives:** Implement new `VectorSearchPort` adapter
- **Content Sources:** Extend `ContentRetriever` with new sources
- **Response Processing:** Add new response validators/transformers
- **Learning Analytics:** Extend `StudentLearningProfile`

All extensions follow port/adapter pattern without modifying core layers.

---

Last Updated: 2024
