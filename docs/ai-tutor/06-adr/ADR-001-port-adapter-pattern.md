# ADR-001: Port & Adapter Pattern for AI Providers

## Status
✅ Accepted

## Context

The AI Tutor feature integrates with external AI services (OpenAI for LLM and embeddings, PostgreSQL for vector search). These integrations are critical infrastructure that could change:

- Different LLM providers (Claude, Gemini, open-source models)
- Alternative embedding services (Cohere, self-hosted)
- Different vector databases (Pinecone, Weaviate, pgvector)

Tightly coupling the application to these specific implementations would:
- Make testing difficult (hard to mock)
- Require extensive refactoring if provider changes
- Complicate provider comparisons or multi-provider strategies
- Violate Dependency Inversion Principle

## Decision

We adopt the **Port & Adapter Pattern** (also known as Hexagonal Architecture):

### **Ports** (Interfaces)
Defined in the domain layer, ports represent abstraction boundaries:
- `LlmPort` - Large language model operations
- `EmbeddingPort` - Text embedding generation
- `VectorSearchPort` - Similarity search functionality
- `ConversationRepositoryPort` - Conversation persistence
- `ContentFilterPort` - Response filtering and validation

### **Adapters** (Implementations)
Defined in the infrastructure layer, adapters implement ports:
- `OpenAILlmAdapter` implements `LlmPort`
- `OpenAIEmbeddingAdapter` implements `EmbeddingPort`
- `PostgresVectorAdapter` implements `VectorSearchPort`
- `PrismaConversationRepository` implements `ConversationRepositoryPort`
- `EducationalContentFilter` implements `ContentFilterPort`

### **Dependency Flow**
```
Application & Use Cases
    ↓ (depend on)
Ports (Domain)
    ↑ (implement)
Adapters (Infrastructure)
    ↓ (call)
External Services
```

## Benefits

1. **Testability:** Ports are easily mocked for unit and integration tests
2. **Flexibility:** Swap implementations without changing application code
3. **Provider Independence:** Not locked into specific services
4. **Clear Boundaries:** Architecture clearly separates concerns
5. **Future-Proof:** Easy to add multi-provider support (e.g., fallback LLMs)

## Implementation

### **Port Definition Example**
```typescript
// Location: src/features/ai-tutor/domain/ports/LlmPort.ts
export interface LlmPort {
  streamAnswer(params: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    systemPrompt: string;
  }): AsyncIterableIterator<string>;
}
```

### **Adapter Implementation Example**
```typescript
// Location: src/features/ai-tutor/infrastructure/adapters/OpenAILlmAdapter.ts
export class OpenAILlmAdapter implements LlmPort {
  constructor(private openai: OpenAI) {}

  async *streamAnswer(params: {
    messages: Array<{ role: string; content: string }>;
    systemPrompt: string;
  }): AsyncIterableIterator<string> {
    const stream = this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: params.systemPrompt }, ...params.messages],
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.choices[0]?.delta?.content) {
        yield chunk.choices[0].delta.content;
      }
    }
  }
}
```

### **Dependency Injection**
```typescript
// Location: src/features/ai-tutor/infrastructure/di/AiTutorContainer.ts
container.register<LlmPort>(
  'LlmPort',
  () => new OpenAILlmAdapter(new OpenAI({ apiKey: env.OPENAI_API_KEY }))
);
```

## Consequences

### **Positive**
- Easy to test all layers in isolation
- Can easily switch providers for cost/performance optimization
- Application logic completely decoupled from infrastructure
- Clear architectural boundaries

### **Negative**
- Additional interface abstraction layer (slight complexity)
- Some provider-specific features may need adaptation
- Initial setup requires defining all ports upfront

## Related Decisions
- ADR-002: Dependency Injection strategy
- Clean Architecture principles from existing project

## Alternatives Considered

### **Direct Integration**
Directly use OpenAI SDK in application code.
- ❌ Tight coupling, hard to test, provider lock-in

### **Factory Pattern**
Use factory functions without formal port interfaces.
- ⚠️ Less formal, less type-safe than port pattern

### **Dependency Injection without Ports**
Use DI to inject implementations without abstractions.
- ⚠️ Doesn't enforce contract, allows implementation details to leak

## Future Enhancements

1. **Multi-Provider Support**
   - Route questions to multiple LLMs, select best response
   - Compare cost/quality across providers

2. **Fallback Adapters**
   - Automatic failover if primary provider unavailable
   - Example: If OpenAI down, use Claude

3. **Hybrid Adapters**
   - Combine multiple providers (e.g., semantic search + keyword search)

---

**Date:** 2024
**Author:** Architecture Team
