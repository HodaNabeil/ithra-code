# AI Platform — Architecture Decision Records

> Formal records of architectural decisions, their context, trade-offs, and alternatives.  
> **Last updated:** August 2026

---

## Table of Contents

1. [ADR Index](#adr-index)
2. [ADR-001: Internal Module vs Separate AI Service](#adr-001-internal-module-vs-separate-ai-service)
3. [ADR-002: LangGraph for Orchestration](#adr-002-langgraph-for-orchestration)
4. [ADR-003: Hybrid Observability — Langfuse + LangSmith](#adr-003-hybrid-observability--langfuse--langsmith)
5. [ADR-004: pgvector over Dedicated Vector DB](#adr-004-pgvector-over-dedicated-vector-db)
6. [ADR-005: Direct TypeScript API over Internal REST](#adr-005-direct-typescript-api-over-internal-rest)
7. [ADR-006: BullMQ + Outbox for Async Indexing](#adr-006-bullmq--outbox-for-async-indexing)
8. [ADR-007: Redis + PostgreSQL Dual Memory Store](#adr-007-redis--postgresql-dual-memory-store)
9. [ADR-008: MCP for Tool Extensibility](#adr-008-mcp-for-tool-extensibility)
10. [ADR-009: Port/Adapter Provider Abstraction](#adr-009-portadapter-provider-abstraction)
11. [ADR-010: Feature-Owned Authorization](#adr-010-feature-owned-authorization)
12. [ADR-011: Workers in src/server/workers](#adr-011-workers-in-srcserverworkers)
13. [ADR-012: ai-tutor Migration via Strangler Pattern](#adr-012-ai-tutor-migration-via-strangler-pattern)

---

## ADR Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](#adr-001-internal-module-vs-separate-ai-service) | Internal module vs separate AI service | Accepted | 2026-08 |
| [ADR-002](#adr-002-langgraph-for-orchestration) | LangGraph for orchestration | Accepted | 2026-08 |
| [ADR-003](#adr-003-hybrid-observability--langfuse--langsmith) | Hybrid observability: Langfuse + LangSmith | Accepted | 2026-08 |
| [ADR-004](#adr-004-pgvector-over-dedicated-vector-db) | pgvector over dedicated vector DB | Accepted | 2026-08 |
| [ADR-005](#adr-005-direct-typescript-api-over-internal-rest) | Direct TypeScript API over internal REST | Accepted | 2026-08 |
| [ADR-006](#adr-006-bullmq--outbox-for-async-indexing) | BullMQ + outbox for async indexing | Accepted | 2026-08 |
| [ADR-007](#adr-007-redis--postgresql-dual-memory-store) | Redis + PostgreSQL dual memory store | Accepted | 2026-08 |
| [ADR-008](#adr-008-mcp-for-tool-extensibility) | MCP for tool extensibility | Accepted | 2026-08 |
| [ADR-009](#adr-009-portadapter-provider-abstraction) | Port/adapter provider abstraction | Accepted | 2026-08 |
| [ADR-010](#adr-010-feature-owned-authorization) | Feature-owned authorization | Accepted | 2026-08 |
| [ADR-011](#adr-011-workers-in-srcserverworkers) | Workers in src/server/workers | Accepted | 2026-08 |
| [ADR-012](#adr-012-ai-tutor-migration-via-strangler-pattern) | ai-tutor migration via strangler pattern | Accepted | 2026-08 |

---

## ADR-001: Internal Module vs Separate AI Service

### Status

Accepted

### Context

IthraCode is a modular monolith — a single Next.js application with feature modules, a single PostgreSQL database, and shared infrastructure (Redis, BullMQ). The team consists of a single developer maintaining the entire platform.

The AI Platform must power multiple AI products (Tutor, Assignment Evaluator, Code Reviewer, Course Assistant) and be extensible for future agents. The question is whether AI capabilities should live as an internal module (`src/ai-platform`) or as a separately deployed AI service.

### Decision

Build the AI Platform as an **internal module** within the existing Next.js application. No separate deployment, no separate repository, no separate database.

### Consequences

**Positive:**
- Zero network latency between features and AI capabilities (in-process function calls)
- Single deployment pipeline — no coordination between services
- Shared database transactions (e.g., index content and update course in one transaction)
- Single developer can maintain everything without cross-service debugging
- TypeScript type safety across module boundaries
- Existing patterns (ports/adapters, DI container) apply directly

**Negative:**
- AI workloads share resources with the web server (mitigated by BullMQ workers for heavy tasks)
- Cannot scale AI independently from the web server (acceptable at current scale)
- AI-specific dependencies (LangGraph, LangSmith) add to the main bundle (mitigated by server-only imports)
- Future extraction requires a deliberate migration (documented in [14-roadmap.md](./14-roadmap.md))

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Separate AI microservice** | Deployment complexity, network overhead, auth between services, premature for single-developer team |
| **AI Gateway (LiteLLM, Kong)** | Additional hop, another service to maintain, provider routing handled by platform `router/` module |
| **Serverless functions (Vercel AI)** | Cold start latency, no BullMQ workers, vendor lock-in, limited control |
| **Sidecar pattern** | Container orchestration overhead, no benefit at current scale |

### Future Evolution

If service extraction criteria are met (see [14-roadmap.md](./14-roadmap.md#service-extraction-criteria)), the module's typed API contracts become HTTP endpoints. The current design does not prevent this.

---

## ADR-002: LangGraph for Orchestration

### Status

Accepted

### Context

The AI Tutor currently uses a hand-rolled orchestration pipeline in `ask-tutor.use-case.ts` — a linear sequence of context building, RAG retrieval, prompt assembly, LLM streaming, and response validation. This works for a single product but does not scale to:

- Multi-step agent workflows with conditional routing
- Tool calling loops
- Multi-agent collaboration (supervisor, handoff)
- Resumable runs with checkpointing

### Decision

Adopt **LangGraph** (`@langchain/langgraph`) as the agent orchestration engine. Each AI product defines a `StateGraph` with reusable nodes.

### Consequences

**Positive:**
- Stateful multi-agent graphs with conditional edges
- Built-in checkpointing for resumable runs
- Native LangSmith trace integration
- Reusable nodes across products (sanitize, retrieve, generate, validate)
- Cyclic graphs for tool calling loops
- Growing ecosystem and documentation

**Negative:**
- New dependency (`@langchain/langgraph`, `@langchain/core`)
- Learning curve for graph-based thinking
- LangChain ecosystem coupling (mitigated by port/adapter pattern for providers)
- Graph compilation adds startup overhead (mitigated by caching compiled graphs)
- Overkill for simple linear pipelines (acceptable — tutor graph starts simple)

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Hand-rolled orchestration** | Does not scale to multi-agent; already reaching limits in ai-tutor |
| **Temporal.io** | Workflow engine — too heavy, separate infrastructure, overkill for AI agents |
| **Custom state machine** | Reinventing LangGraph; maintenance burden |
| **CrewAI** | Opinionated multi-agent framework; less control over graph structure |
| **AutoGen** | Microsoft-centric; less LangSmith integration |

### Implementation Notes

- Graphs are compiled once at startup and cached as singletons
- Nodes receive dependencies via `RunnableConfig.configurable` (not global imports)
- Phase 2 introduces LangGraph; Phase 1 continues with hand-rolled pipeline

---

## ADR-003: Hybrid Observability — Langfuse + LangSmith

### Status

Accepted

### Context

The platform needs two observability capabilities:

1. **Prompt management** — versioning, A/B testing, production promotion
2. **Agent tracing** — debugging runs, comparing outputs, inspecting graph node execution

Both LangSmith and Langfuse offer both capabilities. The team must choose one or combine them.

### Decision

Use a **hybrid approach**:
- **Langfuse** for prompt storage, versioning, and A/B testing
- **LangSmith** for agent run tracing and debugging
- **OpenTelemetry** for vendor-neutral system observability

### Consequences

**Positive:**
- Best-in-class for each concern (Langfuse versioning + LangSmith tracing)
- Langfuse is self-hostable (data residency for Arabic educational content)
- LangSmith has native LangGraph integration (automatic span propagation)
- Decoupled vendors — changing trace provider does not affect prompts
- OTEL provides escape hatch from vendor-specific tracing

**Negative:**
- Two external services to configure and pay for
- Prompt version must be recorded in LangSmith traces manually (metadata)
- Two sets of API keys and environment variables
- Team must learn two UIs

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **LangSmith only** | Weaker prompt versioning; not self-hostable; vendor lock-in on both concerns |
| **Langfuse only** | LangGraph tracing less mature; fewer agent debugging features |
| **OTEL only** | No prompt management; would need custom prompt store |
| **Custom solution** | Building prompt versioning and trace UI is not justified for single developer |

### Cost Estimate

| Service | Tier | Estimated Monthly Cost |
|---------|------|----------------------|
| Langfuse Cloud | Hobby/Pro | $0–50 |
| LangSmith | Developer | $0–39 |
| OTEL | Self-hosted collector | $0 |

---

## ADR-004: pgvector over Dedicated Vector DB

### Status

Accepted

### Context

RAG requires vector similarity search. The AI Tutor already uses pgvector with `vector(1536)` embeddings and an HNSW index on `knowledge_chunks`. The platform must decide whether to continue with pgvector or adopt a dedicated vector database.

Current scale: ~10 courses, ~500 lectures, estimated ~50,000 chunks.

### Decision

Continue using **pgvector** in the existing PostgreSQL database. Do not introduce Pinecone, Weaviate, Qdrant, or any dedicated vector database.

### Consequences

**Positive:**
- Zero new infrastructure — pgvector extension already installed and migrated
- Single database for all data (vectors, conversations, memory, cost)
- ACID transactions across vector and relational data
- Existing Prisma + raw SQL patterns work
- HNSW index provides sub-100ms search at current scale
- No additional hosting cost
- Team already has PostgreSQL operational expertise

**Negative:**
- pgvector HNSW index rebuilds are expensive (mitigated by incremental indexing)
- Scaling beyond ~1M vectors may require tuning (monitor query latency)
- No built-in hybrid search (vector + keyword) — would need custom implementation
- Prisma does not natively support `vector` type (requires raw SQL — already handled)

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Pinecone** | Additional service, cost, network latency, data duplication |
| **Weaviate** | Self-hosted overhead, another database to operate |
| **Qdrant** | Same concerns as Weaviate |
| **pg_embedding** | Less mature than pgvector; pgvector already in production |
| **Elasticsearch** | Overkill; team has no ES expertise |

### Scale Threshold

Re-evaluate if:
- Query latency exceeds 200ms p95 consistently
- Total chunks exceed 1M
- Hybrid search (vector + BM25) becomes a requirement

At that point, consider Qdrant or Weaviate as a sidecar — but not before.

---

## ADR-005: Direct TypeScript API over Internal REST

### Status

Accepted

### Context

Features need to call AI Platform capabilities (run agents, retrieve context, enqueue indexing). The communication mechanism must be chosen: direct function calls, internal REST API, gRPC, or message queue.

### Decision

Features call the platform via **direct TypeScript function imports** from `@/ai-platform` (the public barrel export). No internal HTTP, gRPC, or message-based API.

### Consequences

**Positive:**
- Zero serialization overhead
- Full TypeScript type safety across module boundaries
- Stack traces span feature → platform (easier debugging)
- No API versioning concerns
- No auth between modules (same process)
- Simplest possible integration for a monolith

**Negative:**
- Features are coupled to platform's TypeScript API (acceptable in a monolith)
- Cannot call platform from non-TypeScript code (not a requirement)
- Platform must expose a stable public API via `index.ts` (disciplined exports)
- Future service extraction requires HTTP wrapper (API contracts already typed)

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Internal REST API** | Serialization overhead, no type safety, API versioning, auth complexity |
| **gRPC** | Protobuf compilation, no benefit in single-process monolith |
| **Message queue (sync)** | Latency, complexity, no type safety |
| **Event bus** | Async-only; agent runs need synchronous streaming |
| **GraphQL** | Over-engineering for internal module communication |

### API Stability Contract

The `index.ts` barrel export is the stability contract. Internal modules can change freely as long as the public API remains compatible. Breaking changes require a migration guide.

---

## ADR-006: BullMQ + Outbox for Async Indexing

### Status

Accepted

### Context

Content indexing (course → chunks → embeddings → store) is too slow for synchronous request processing (30s–5min per course). The AI Tutor already uses BullMQ with an outbox pattern for course indexing. The platform must generalize this pattern.

### Decision

Use **BullMQ** with a **transactional outbox** for all async AI platform jobs (indexing, evaluation, cost aggregation). Workers are separate processes; handlers live in the platform module.

### Consequences

**Positive:**
- Proven pattern already in production (course-indexing worker)
- Outbox ensures no lost jobs (durability before enqueue)
- Stable job IDs prevent duplicate indexing
- Exponential backoff for transient failures
- Shared Redis connection with existing workers
- Worker scaling independent of web server

**Negative:**
- Requires Redis (already installed)
- Worker processes must be deployed and monitored separately
- Outbox adds a table and recovery sweeper
- Job payload serialization (JSON — acceptable for indexing data)

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Synchronous indexing** | Too slow for request path; blocks user actions |
| **Database polling (no queue)** | No backoff, no concurrency control, no job dedup |
| **pg-boss** | Less ecosystem support than BullMQ; team already uses BullMQ |
| **AWS SQS** | Cloud vendor lock-in; team uses self-hosted Redis |
| **In-process async (setTimeout)** | No durability, no retry, lost on process crash |

### Outbox Recovery

Pending outbox rows older than 5 minutes are re-enqueued by a sweeper on worker startup. This handles the case where the application crashes between outbox insert and queue enqueue.

---

## ADR-007: Redis + PostgreSQL Dual Memory Store

### Status

Accepted

### Context

AI agents need memory at multiple time scales:
- **Session context** (minutes) — avoid re-querying DB on every message
- **Conversation history** (permanent) — thread messages for prompt context
- **Long-term facts** (permanent) — user preferences, learned misconceptions

A single storage system cannot optimally serve all time scales.

### Decision

Use a **dual-store memory system**:
- **Redis** for short-term/session memory (TTL-based expiration)
- **PostgreSQL** for long-term/durable memory (permanent storage)

### Consequences

**Positive:**
- Redis provides sub-millisecond reads for hot session data
- PostgreSQL provides durable, queryable long-term memory
- TTL-based expiration in Redis requires no cleanup jobs
- Both stores already installed and operational
- Session cache pattern proven in ai-tutor (`redis-session-context.cache.ts`)

**Negative:**
- Two stores to maintain (already required for BullMQ + Prisma)
- Cache invalidation complexity (must invalidate Redis on DB writes)
- Redis failure requires fallback to DB (handled — fail-open on read)
- Memory consistency between stores is eventual (acceptable for session context)

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **PostgreSQL only** | Too slow for per-message session context; unnecessary DB load |
| **Redis only** | No durable memory; data lost on Redis restart |
| **In-process memory** | Lost on server restart; doesn't work with multiple Next.js instances |
| **Dedicated memory service (Mem0)** | Additional service; overkill for current needs |

---

## ADR-008: MCP for Tool Extensibility

### Status

Accepted

### Context

AI agents need tools beyond text generation: search, code analysis, file reading, external API calls. Tools must be extensible without modifying platform code for each new tool.

### Decision

Adopt the **Model Context Protocol (MCP)** as the primary tool extension mechanism, supplemented by built-in platform tools for common operations.

### Consequences

**Positive:**
- Standard protocol — growing ecosystem of MCP servers
- New tools added via configuration, not code changes
- Community MCP servers available (filesystem, GitHub, Slack)
- Built-in tools cover common cases without MCP overhead
- Tool registry provides unified interface regardless of source

**Negative:**
- MCP SDK adds a dependency
- MCP servers are separate processes (stdio) or network services (HTTP)
- Security risk from third-party MCP servers (mitigated by trust model)
- MCP is relatively new — protocol may evolve
- Phase 3 delivery — not needed for Phase 1–2

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Custom tool plugin system** | Reinventing MCP; no ecosystem |
| **LangChain tools only** | LangChain-specific; less portable |
| **OpenAI function calling only** | Tied to OpenAI; no standard protocol |
| **Hardcoded tools per agent** | Not extensible; code change per tool |

### Phase Rollout

Tools are documented and stubbed in Phase 1–2 but activated in Phase 3. This avoids complexity during the ai-tutor migration.

---

## ADR-009: Port/Adapter Provider Abstraction

### Status

Accepted (inherits from AI Tutor ADR-001)

### Context

The AI Tutor established a port/adapter pattern for LLM and embedding providers (`LlmPort`, `EmbeddingPort`, `OpenAILlmAdapter`). The platform generalizes this to support multiple providers (OpenAI, Anthropic, Gemini, Ollama).

See [AI Tutor ADR-001](../ai-tutor/06-adr/ADR-001-port-adapter-pattern.md) for the original decision.

### Decision

Continue the **port/adapter pattern** for all external provider dependencies. Ports in `domain/ports/`, adapters in `providers/`. A `ProviderRegistry` resolves adapters by model ID.

### Consequences

**Positive:**
- Proven in production (ai-tutor since 2026)
- Provider changes require only adapter swap, not graph changes
- Testable with mock ports
- Multi-provider routing without code changes
- OpenRouter compatibility via OpenAI adapter base URL

**Negative:**
- Lowest-common-denominator interface (may not expose provider-specific features)
- Adapter maintenance for each provider
- Streaming interface must be normalized across providers

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Direct SDK usage in graphs** | Provider lock-in; untestable; violates dependency rule |
| **LiteLLM proxy** | External service; another hop; team prefers in-process routing |
| **LangChain model abstraction** | LangChain-specific; port pattern is more portable |

---

## ADR-010: Feature-Owned Authorization

### Status

Accepted

### Context

AI Platform operations require authorization (enrollment checks, role verification, scope validation). The question is whether authorization logic lives in the platform or in feature modules.

### Decision

**Authorization stays in features.** The platform receives pre-authorized context (`userId`, `scope`) and validates shape only, not permissions.

### Consequences

**Positive:**
- Platform has no dependency on NextAuth or feature-specific policies
- Different products have different auth rules (enrollment vs admin role)
- Platform remains a pure AI execution engine
- Auth changes in features do not require platform changes
- Dependency rule preserved: `features → platform`, never reverse

**Negative:**
- Each feature must implement its own auth checks (but they already do)
- Risk of feature forgetting auth (mitigated by code review, not platform concern)
- Platform cannot enforce global auth policies (acceptable — features are trusted)

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Platform-level auth** | Couples platform to NextAuth; different rules per product |
| **Shared auth middleware** | Still requires platform to know about auth mechanisms |
| **Policy injection** | Features pass policy functions — more complex than pre-authorized context |

### Contract

```typescript
// Feature MUST verify auth before calling platform
const session = await auth();
await enrollmentPolicy.assertEnrolled(session.user.id, courseId);
await streamAgent('tutor', { userId: session.user.id, scope: { courseId } });
```

---

## ADR-011: Workers in src/server/workers

### Status

Accepted

### Context

Background jobs (indexing, evaluation) run in separate Node.js processes. The question is where worker process files and handler logic should live.

### Decision

- **Worker process files** stay in `src/server/workers/` (deployment boundary)
- **Handler business logic** lives in `src/ai-platform/` (domain boundary)

Worker files are thin shells that import and invoke platform handlers.

### Consequences

**Positive:**
- Consistent with existing worker pattern (`order-completed.worker.ts`, `reconcile-payments.worker.ts`)
- Worker scripts in `package.json` point to known locations
- Platform module contains all AI business logic (testable without process)
- Workers can be scaled independently

**Negative:**
- Handler logic split across two directories (worker shell + platform handler)
- Worker files must be updated when new queues are added

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Workers inside ai-platform/** | Blurs deployment boundary; platform becomes a deployable unit |
| **Workers in features** | Indexing is platform concern, not tutor-specific |
| **Single worker for all queues** | Less isolation; one queue failure affects others |

### Pattern

```typescript
// src/server/workers/course-indexing.worker.ts (thin shell)
import { handleCourseIndexing } from '@/ai-platform/indexing/workers/course-indexing.handler';

const worker = new Worker('course-indexing', handleCourseIndexing, { connection: redis });
```

---

## ADR-012: ai-tutor Migration via Strangler Pattern

### Status

Accepted

### Context

The AI Tutor is a production-grade feature with 127 files, 12 test files, and live API routes. The platform must extract shared code without breaking the tutor or requiring a big-bang rewrite.

### Decision

Migrate using the **strangler fig pattern** — incrementally extract shared code into `src/ai-platform` while the tutor delegates to platform modules. Three phases over 14–18 weeks.

### Consequences

**Positive:**
- Zero downtime — tutor remains operational throughout migration
- Each extraction step is testable (existing tests must pass)
- Risk is incremental — one module at a time
- Team learns platform patterns gradually
- Rollback is trivial (revert single file move)

**Negative:**
- Transitional period with delegation indirection (`ai-tutor-container` → `ai-platform.container`)
- Duplicate imports during migration (cleaned up after each phase)
- Longer total migration time than big-bang rewrite
- Temporary complexity in DI wiring

### Alternatives Considered

| Alternative | Why Rejected |
|------------|-------------|
| **Big-bang rewrite** | High risk; tutor is in production; single developer cannot afford downtime |
| **Parallel build (no migration)** | Duplicate code; two systems to maintain; diverging implementations |
| **Greenfield platform only** | Ignores proven ai-tutor code; wastes production investment |
| **Copy-paste extraction** | No shared code; maintenance nightmare |

### Migration Phases

| Phase | Extracts | Tutor Changes |
|-------|----------|--------------|
| **Phase 1** | Providers, RAG, indexing, guards, cost | Container delegates to platform |
| **Phase 2** | LangGraph, prompts, tracing, eval | `ask-tutor` calls `streamAgent()` |
| **Phase 3** | Tools, memory, new products | Tutor is thin product layer |

### Rollback Strategy

Each phase is independently revertible:
1. Revert platform module moves (git revert)
2. Restore ai-tutor-container to direct implementations
3. Run ai-tutor test suite to verify

---

## Related Documentation

- [01-overview.md](./01-overview.md) — Vision and goals
- [02-architecture.md](./02-architecture.md) — Architecture implementing these decisions
- [14-roadmap.md](./14-roadmap.md) — Implementation phases
- [AI Tutor ADRs](../ai-tutor/06-adr/) — Pre-platform decisions (ADR-001 through ADR-005)
