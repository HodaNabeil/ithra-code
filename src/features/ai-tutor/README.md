# AI Tutor Feature

Intelligent tutoring system providing personalized, course-aware assistance through Retrieval
Augmented Generation (RAG).

## Documentation

See `/docs/ai-tutor/` for complete documentation:

- **[00-index.md](../../docs/ai-tutor/00-index.md)** - Documentation index
- **[01-implementation-roadmap.md](../../docs/ai-tutor/01-implementation-roadmap.md)** -
  Sprint-by-sprint implementation plan
- **[02-architecture.md](../../docs/ai-tutor/02-architecture.md)** - Clean Architecture overview
- **[03-runtime-pipeline.md](../../docs/ai-tutor/03-runtime-pipeline.md)** - Student question flow
- **[04-indexing-pipeline.md](../../docs/ai-tutor/04-indexing-pipeline.md)** - Knowledge base
  indexing
- **[06-adr/](../../docs/ai-tutor/06-adr/)** - Architecture Decision Records
- **[07-future-roadmap.md](../../docs/ai-tutor/07-future-roadmap.md)** - Post-MVP enhancements

## Structure

```
ai-tutor/
├── domain/
│   ├── models/
│   └── ports/
├── application/
│   ├── use-cases/
│   ├── services/
│   └── dto/
├── infrastructure/
│   ├── adapters/
│   ├── repositories/
│   ├── config/
│   └── di/
├── api/
│   └── handlers/
├── presentation/
│   ├── components/
│   └── hooks/
└── shared/
```

## Feature Flag

AI Tutor is controlled by `AI_TUTOR_ENABLED` environment variable:

```typescript
// .env
AI_TUTOR_ENABLED=true  # or false
```

When disabled:

- Routes are not registered
- Services are not available
- Q&A tab shows placeholder message

## Getting Started

### For Developers

1. Read [02-architecture.md](../../docs/ai-tutor/02-architecture.md)
2. Understand ports and adapters
3. Review [01-implementation-roadmap.md](../../docs/ai-tutor/01-implementation-roadmap.md)
4. Start with Sprint 1 tasks

### For Architects

1. Review all [ADRs](../../docs/ai-tutor/06-adr/)
2. Understand [03-runtime-pipeline.md](../../docs/ai-tutor/03-runtime-pipeline.md)
3. Review [07-future-roadmap.md](../../docs/ai-tutor/07-future-roadmap.md)

## Development

### Environment Setup

```bash
# Add to .env
OPENAI_API_KEY=sk-...
AI_TUTOR_ENABLED=true
```

### Available Scripts

```bash
# Type check
npm run type-check

# Lint
npm run lint
```

## Key Concepts

- **Port & Adapter Pattern:** All external dependencies abstracted through ports
- **Clean Architecture:** Clear separation between layers
- **Streaming Responses:** Real-time token streaming for better UX
- **RAG (Retrieval Augmented Generation):** Ground responses in actual course materials
- **Educational Integrity:** Assessment content protected, guidance mode for learning
- **Course-Scoped Conversations:** One conversation per course with lecture-based threading

## Integration Points

### Database

- Prisma models: `TutorConversation`, `TutorMessage`, `TutorThread`, `KnowledgeChunk`
- Vector storage: PostgreSQL with pgvector extension

### API

- Routes under `/api/tutor/`
- Streaming responses via Server-Sent Events
- Authentication required (user must be enrolled)

### UI

- Component in lecture view (replaces Q&A placeholder)
- Integrated into `LectureView` component
- Accessible from lecture tab interface

## Status

- **Core chat + RAG:** Implemented (`POST /api/tutor/messages`, streaming, persistence)
- **Thread history:** Implemented (`GET /api/tutor/threads`, read-only)
- **Course indexing:** Implemented (publish hooks, worker, bootstrap, outbox,
  `POST /api/tutor/index`)
- **Repository ports + DI:** Implemented
- **Session context cache:** Redis-backed (`tutor:session-context:v2`, 5 min TTL)
- **Production hardening:** Rate limits (fail-closed), cost cap, LLM retries, integrity buffering

When disabled, routes return **503** (feature flag).

---

Last Updated: August 2026
