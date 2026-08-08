# AI Platform (`src/ai-platform`)

Internal AI module for IthraCode. Features import **only** from `@/ai-platform`.

## Status

Phase 1 scaffold + provider extraction (Weeks 1–4): domain ports, OpenAI adapters, cost ledger, and `ai.chat()` / `ai.chatStream()` runtime.

Weeks 5–6 RAG extraction: `PostgresVectorSearchAdapter`, embedding cache, embedding pipeline, BullMQ indexing handlers, and outbox/queue infrastructure.

Week 7 guards + ingestion extraction: knowledge ingestion pipeline, `course-indexing.pipeline`, generalized Redis guards (`ai:*` keys), and staging `AI_PLATFORM_ENABLED=true`.

**Phase 2 (Weeks 8–10) — complete:** LangGraph agent runtime with `tutor.graph.ts` (sanitize → retrieve → generate → validate), agent registry, and `AgentRuntime`. Requires `AI_PLATFORM_ENABLED=true` and `AI_TUTOR_ENABLED=true`.

## Quick start

```typescript
import { ai, streamAgent } from '@/ai-platform';

// Phase 1 path (hand-rolled LLM)
const result = await ai.chat({
  appId: 'ai-tutor',
  messages: [{ role: 'user', content: 'Hello' }],
  scope: { userId: 'user-id', courseId: 'course-id' },
});

// Phase 2 path (LangGraph runtime)
const stream = streamAgent('tutor', {
  userId: 'user-id',
  input: 'Explain recursion',
  scope: { userId: 'user-id', courseId: 'course-id' },
});
for await (const event of stream) {
  if (event.type === 'token') console.log(event.text);
}
```

## Documentation

- [Platform blueprint](../../docs/ai-platform/00-platform-blueprint.md)
- [Folder structure](../../docs/ai-platform/03-folder-structure.md)
- [Agents & LangGraph](../../docs/ai-platform/04-agents.md)
- [Runtime](../../docs/ai-platform/17-runtime.md)
- [Roadmap](../../docs/ai-platform/14-roadmap.md)
