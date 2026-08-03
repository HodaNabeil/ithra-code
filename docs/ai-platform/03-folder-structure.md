# AI Platform — Folder Structure

> Complete folder tree, responsibilities, and import rules for `src/ai-platform/`.  
> **Last updated:** August 2026

---

## Table of Contents

1. [Complete Folder Tree](#complete-folder-tree)
2. [Top-Level Entry Point](#top-level-entry-point)
3. [Folder Responsibilities](#folder-responsibilities)
4. [Import Rules](#import-rules)
5. [Dependency Matrix](#dependency-matrix)
6. [Naming Conventions](#naming-conventions)
7. [What Belongs Here vs in Features](#what-belongs-here-vs-in-features)

---

## Complete Folder Tree

```
src/ai-platform/
├── index.ts                          # Public API barrel — only import surface for features
├── README.md                         # Quick-start for platform consumers
│
├── application/
│   ├── use-cases/
│   │   ├── run-agent.use-case.ts
│   │   ├── stream-agent.use-case.ts
│   │   ├── index-document.use-case.ts
│   │   └── run-evaluation.use-case.ts
│   ├── services/
│   │   ├── agent-runner.service.ts
│   │   ├── retrieval-coordinator.service.ts
│   │   └── cost-tracker.service.ts
│   ├── dto/
│   │   ├── agent-run.dto.ts
│   │   ├── retrieval.dto.ts
│   │   └── indexing.dto.ts
│   ├── errors/
│   │   ├── agent.error.ts
│   │   ├── retrieval.error.ts
│   │   └── indexing.error.ts
│   └── events/
│       ├── indexing-requested.event.ts
│       └── agent-run-completed.event.ts
│
├── domain/
│   ├── models/
│   │   ├── agent-run.ts
│   │   ├── retrieval-query.ts
│   │   ├── knowledge-chunk.ts
│   │   ├── memory-record.ts
│   │   └── tool-call.ts
│   ├── ports/
│   │   ├── llm.port.ts
│   │   ├── embedding.port.ts
│   │   ├── vector-search.port.ts
│   │   ├── memory-store.port.ts
│   │   ├── prompt-repository.port.ts
│   │   ├── tool-executor.port.ts
│   │   └── cost-ledger.port.ts
│   ├── policies/
│   │   ├── token-budget.policy.ts
│   │   └── content-sensitivity.policy.ts
│   └── enums/
│       ├── agent-capability.ts
│       ├── content-sensitivity.ts
│       └── indexing-status.ts
│
├── infrastructure/
│   ├── di/
│   │   └── ai-platform.container.ts
│   ├── config/
│   │   └── ai-platform.config.ts
│   ├── persistence/
│   │   └── prisma/
│   │       ├── agent-run.repository.ts
│   │       ├── memory-fact.repository.ts
│   │       └── cost-ledger.repository.ts
│   ├── cache/
│   │   ├── redis-embedding.cache.ts
│   │   └── redis-session.cache.ts
│   ├── queue/
│   │   ├── queue-factory.ts
│   │   └── outbox.service.ts
│   ├── guards/
│   │   ├── rate-limit.guard.ts
│   │   ├── cost-cap.guard.ts
│   │   └── concurrency-slot.guard.ts
│   └── startup/
│       └── validate-platform-infrastructure.ts
│
├── providers/
│   ├── ports/
│   │   ├── llm.port.ts              # Re-export or extend domain port
│   │   └── embedding.port.ts
│   ├── openai/
│   │   ├── openai-llm.adapter.ts
│   │   └── openai-embedding.adapter.ts
│   ├── anthropic/
│   │   └── anthropic-llm.adapter.ts
│   ├── gemini/
│   │   └── gemini-llm.adapter.ts
│   ├── ollama/
│   │   └── ollama-llm.adapter.ts
│   ├── resilient/
│   │   └── resilient-llm.adapter.ts
│   └── registry/
│       └── provider-registry.ts
│
├── router/
│   ├── model-router.ts
│   ├── routing-policies.ts
│   └── fallback-chain.ts
│
├── agents/
│   ├── base/
│   │   ├── agent-definition.ts
│   │   └── agent-lifecycle.ts
│   ├── definitions/
│   │   └── agent-registry.ts
│   ├── tutor/
│   │   └── tutor-agent.definition.ts
│   ├── evaluator/
│   │   └── evaluator-agent.definition.ts
│   ├── code-reviewer/
│   │   └── code-reviewer-agent.definition.ts
│   └── course-assistant/
│       └── course-assistant-agent.definition.ts
│
├── graph/
│   ├── state/
│   │   ├── base-agent.state.ts
│   │   └── tutor-agent.state.ts
│   ├── nodes/
│   │   ├── sanitize-input.node.ts
│   │   ├── retrieve-context.node.ts
│   │   ├── generate-response.node.ts
│   │   ├── validate-output.node.ts
│   │   └── tool-call.node.ts
│   ├── edges/
│   │   └── conditional-routing.ts
│   ├── graphs/
│   │   ├── tutor.graph.ts
│   │   └── evaluator.graph.ts
│   ├── checkpointers/
│   │   ├── postgres-checkpointer.ts
│   │   └── redis-checkpointer.ts
│   └── compiler/
│       └── graph-compiler.ts
│
├── prompts/
│   ├── ports/
│   │   └── prompt-repository.port.ts
│   ├── langfuse/
│   │   └── langfuse-prompt.adapter.ts
│   ├── local/
│   │   └── file-prompt.adapter.ts
│   ├── templates/
│   │   ├── tutor-system.ar.md
│   │   └── tutor-system.en.md
│   └── resolver.ts
│
├── rag/
│   ├── retrieval/
│   │   ├── retrieve-context.ts
│   │   └── postgres-vector-search.adapter.ts
│   ├── chunking/
│   │   ├── fixed-size.chunker.ts
│   │   ├── structural.chunker.ts
│   │   └── semantic.chunker.ts
│   ├── ingestion/
│   │   ├── ingestion-pipeline.ts
│   │   ├── extractor-registry.ts
│   │   └── extractors/
│   │       ├── transcript.extractor.ts
│   │       ├── pdf.extractor.ts
│   │       └── code.extractor.ts
│   ├── filters/
│   │   ├── sensitivity.filter.ts
│   │   └── scope.filter.ts
│   └── rerankers/
│       └── noop.reranker.ts
│
├── embeddings/
│   ├── pipeline.ts
│   ├── cache/
│   │   └── embedding-cache.ts
│   └── dimensions.ts
│
├── memory/
│   ├── short-term/
│   │   └── redis-session-memory.ts
│   ├── long-term/
│   │   └── postgres-memory-store.ts
│   ├── conversation/
│   │   └── conversation-assembler.ts
│   ├── ports/
│   │   ├── memory-store.port.ts
│   │   └── conversation-memory.port.ts
│   └── summarizer/
│       └── context-summarizer.ts
│
├── tools/
│   ├── registry/
│   │   └── tool-registry.ts
│   ├── executor/
│   │   └── tool-executor.ts
│   ├── mcp/
│   │   ├── mcp-client.ts
│   │   └── mcp-transport.ts
│   ├── builtin/
│   │   ├── search.tool.ts
│   │   └── calculator.tool.ts
│   └── schemas/
│       └── tool-schema.ts
│
├── evaluation/
│   ├── ragas/
│   │   └── ragas-runner.ts
│   ├── deepeval/
│   │   └── deepeval-runner.ts
│   ├── datasets/
│   │   ├── tutor-golden.json
│   │   └── evaluator-golden.json
│   ├── runners/
│   │   └── offline-eval.runner.ts
│   └── reports/
│       └── eval-report.service.ts
│
├── cost/                             # Phase 2+ — budgets, quotas, policies (see 16-cost-engine.md)
│   ├── domain/
│   ├── application/
│   └── infrastructure/
│
├── observability/
│   ├── langsmith/
│   │   └── langsmith-tracer.ts
│   ├── opentelemetry/
│   │   ├── otel-setup.ts
│   │   └── span-helpers.ts
│   ├── cost/
│   │   ├── cost-ledger.service.ts
│   │   └── token-pricing.ts
│   ├── metrics/
│   │   └── platform-metrics.ts
│   ├── tracing/
│   │   └── correlation-context.ts
│   └── dashboard/
│       └── cost-analytics.service.ts
│
├── indexing/
│   ├── pipelines/
│   │   ├── course-indexing.pipeline.ts
│   │   ├── lecture-indexing.pipeline.ts
│   │   └── enqueue.ts
│   ├── outbox/
│   │   └── indexing-outbox.service.ts
│   ├── workers/
│   │   ├── course-indexing.handler.ts
│   │   └── lecture-indexing.handler.ts
│   └── hash/
│       └── content-hash.service.ts
│
└── shared/
    ├── constants.ts
    ├── errors.ts
    ├── types.ts
    ├── streaming.ts
    └── language.ts
```

---

## Top-Level Entry Point

### `index.ts`

The **only** file features should import from. It re-exports the public API:

```typescript
// Agents
export { runAgent, streamAgent } from './application/use-cases/run-agent.use-case';
export { registerAgent } from './agents/definitions/agent-registry';

// RAG
export { retrieveContext } from './rag/retrieval/retrieve-context';
export { enqueueIndexing } from './indexing/pipelines/enqueue';

// Memory
export { getConversationMemory, storeMemoryFact } from './memory';

// Observability
export { recordAgentRun, getCostSummary } from './observability/cost/cost-ledger.service';

// Types
export type { AgentRunRequest, RetrievalOptions, MemoryScope } from './domain/models';
```

Internal modules must not be imported directly by features.

---

## Folder Responsibilities

### `application/`

Cross-product use cases and orchestration services. Contains no framework-specific code (no LangGraph imports in use-case files — they delegate to services).

| Subfolder | Responsibility |
|-----------|---------------|
| `use-cases/` | Entry points: `runAgent`, `indexDocument`, `runEvaluation` |
| `services/` | Multi-step orchestration shared across use cases |
| `dto/` | Zod-validated input/output contracts |
| `errors/` | Platform error taxonomy with error codes |
| `events/` | Domain events for indexing, agent completion |

### `domain/`

Pure business logic. Zero dependencies on Prisma, Redis, LangChain, or OpenAI.

| Subfolder | Responsibility |
|-----------|---------------|
| `models/` | Value objects and entities (`AgentRun`, `RetrievalQuery`) |
| `ports/` | Interface contracts for all external capabilities |
| `policies/` | Business rules (token budgets, sensitivity classification) |
| `enums/` | Shared enumerations |

### `infrastructure/`

Wiring and external system integration. The composition root lives here.

| Subfolder | Responsibility |
|-----------|---------------|
| `di/` | `ai-platform.container.ts` — singleton getters, deps bundles |
| `config/` | Env-backed configuration (`AI_PLATFORM_*` vars) |
| `persistence/` | Prisma repository implementations for platform tables |
| `cache/` | Redis adapters for embeddings, sessions, rate limits |
| `queue/` | BullMQ queue factory, generic outbox service |
| `guards/` | Rate limits, cost caps, concurrency slots |
| `startup/` | Boot-time validation (pgvector extension, Redis, API keys) |

### `providers/`

LLM and embedding provider implementations.

| Subfolder | Responsibility |
|-----------|---------------|
| `ports/` | Provider-facing port definitions (may re-export domain ports) |
| `openai/` | OpenAI SDK adapters (migrated from ai-tutor) |
| `anthropic/` | Claude adapters |
| `gemini/` | Google Gemini adapters |
| `ollama/` | Local development and offline fallback |
| `resilient/` | Retry and circuit-breaker wrappers |
| `registry/` | `ProviderRegistry` — resolve adapter by model ID |

### `router/`

Model selection logic. Keeps provider choice out of features and graph nodes.

| File | Responsibility |
|------|---------------|
| `model-router.ts` | Route task type → provider + model |
| `routing-policies.ts` | Cost, latency, capability-based rules |
| `fallback-chain.ts` | Primary → fallback on failure |

### `agents/`

Product agent definitions. Metadata and defaults — not the graph itself.

| Subfolder | Responsibility |
|-----------|---------------|
| `base/` | Shared interfaces, lifecycle hooks |
| `definitions/` | `AgentRegistry` — register and resolve agents |
| `tutor/` | Tutor agent config (capabilities, default tools, graph ref) |
| `evaluator/` | Assignment evaluator agent stub |
| `code-reviewer/` | Code reviewer agent stub |
| `course-assistant/` | Course assistant agent stub |

### `graph/`

LangGraph orchestration engine.

| Subfolder | Responsibility |
|-----------|---------------|
| `state/` | Typed state definitions per agent |
| `nodes/` | Reusable graph nodes (retrieve, generate, validate, tool-call) |
| `edges/` | Conditional routing between nodes |
| `graphs/` | Compiled `StateGraph` instances per product |
| `checkpointers/` | Postgres/Redis checkpoint adapters for resumable runs |
| `compiler/` | Factory: agent definition → compiled runnable graph |

### `prompts/`

Prompt management with Langfuse as primary store.

| Subfolder | Responsibility |
|-----------|---------------|
| `ports/` | `PromptRepositoryPort` interface |
| `langfuse/` | Langfuse adapter (versioning, labels, A/B) |
| `local/` | File-based fallback for offline development |
| `templates/` | Seed templates (synced to Langfuse on deploy) |
| `resolver.ts` | Resolve by `key + version + locale` |

### `rag/`

Retrieval-Augmented Generation pipeline.

| Subfolder | Responsibility |
|-----------|---------------|
| `retrieval/` | Vector search orchestration, `retrieveContext()` |
| `chunking/` | Chunk strategies (fixed, structural, semantic) |
| `ingestion/` | Content extractors and ingestion pipeline |
| `filters/` | Sensitivity and scope filters on retrieved chunks |
| `rerankers/` | Optional reranking (Phase 2+) |

### `embeddings/`

Embedding generation with caching.

| File/Folder | Responsibility |
|-------------|---------------|
| `pipeline.ts` | Embed → cache → persist flow |
| `cache/` | Redis embedding cache (`ai:embed:{hash}`) |
| `dimensions.ts` | Model dimension registry (1536 for text-embedding-3-small) |

### `memory/`

Dual-store memory system.

| Subfolder | Responsibility |
|-----------|---------------|
| `short-term/` | Redis session/working memory (5 min TTL) |
| `long-term/` | PostgreSQL durable facts (`ai_memory_facts`) |
| `conversation/` | Thread history assembly for prompt context |
| `ports/` | `MemoryStorePort`, `ConversationMemoryPort` |
| `summarizer/` | Context compression when token budget exceeded |

### `tools/`

Tool calling and MCP integration.

| Subfolder | Responsibility |
|-----------|---------------|
| `registry/` | Register, discover, validate tool schemas |
| `executor/` | Sandboxed execution with timeouts |
| `mcp/` | MCP client (stdio + HTTP transports) |
| `builtin/` | Platform-native tools (search, calculator) |
| `schemas/` | Zod/JSON Schema for tool I/O |

### `evaluation/`

Offline quality assurance.

| Subfolder | Responsibility |
|-----------|---------------|
| `ragas/` | Ragas metric runners (faithfulness, relevancy) |
| `deepeval/` | DeepEval assertion-based tests |
| `datasets/` | Golden datasets per product |
| `runners/` | Offline eval orchestration |
| `reports/` | Result persistence and comparison |

### `cost/`

Cost governance subsystem (Phase 2+). Extends the cost ledger with budgets, quotas, policies, and optimization.

| Subfolder | Responsibility |
|-----------|---------------|
| `domain/` | Budget, quota, policy models and ports |
| `application/services/` | `CostEngine`, `PricingService`, `BudgetService`, `QuotaService`, `CostForecastService` |
| `application/policies/` | Declarative cost policy evaluation |
| `infrastructure/persistence/` | Prisma repositories for `ai_cost_*` tables |
| `infrastructure/guards/` | `budget.guard.ts` — delegates to Cost Engine |

Phase 1 does not require this module. See [16-cost-engine.md](./16-cost-engine.md).

### `observability/`

Tracing, metrics, and cost analytics.

| Subfolder | Responsibility |
|-----------|---------------|
| `langsmith/` | Agent run trace export |
| `opentelemetry/` | OTEL span setup and helpers |
| `cost/` | Token/cost accounting → `ai_agent_runs` |
| `metrics/` | Platform counters and histograms |
| `tracing/` | Correlation ID propagation |
| `dashboard/` | Data layer for admin cost analytics UI |

### `indexing/`

Async content indexing pipelines.

| Subfolder | Responsibility |
|-----------|---------------|
| `pipelines/` | Course/lecture/document indexing flows |
| `outbox/` | Generic outbox (durability before enqueue) |
| `workers/` | Handler functions called from `src/server/workers/` |
| `hash/` | Content-hash dedup for incremental indexing |

### `shared/`

Cross-cutting utilities with no business logic.

| File | Responsibility |
|------|---------------|
| `constants.ts` | Key prefixes, TTLs, default dimensions |
| `errors.ts` | Base error classes |
| `types.ts` | Utility types |
| `streaming.ts` | SSE/token stream helpers |
| `language.ts` | Arabic/RTL prompt helpers |

---

## Import Rules

### Rule 1: Features import only `@/ai-platform`

```typescript
// ✅ Correct
import { runAgent, retrieveContext } from '@/ai-platform';

// ❌ Wrong — internal path
import { getLlmPort } from '@/ai-platform/infrastructure/di/ai-platform.container';
```

### Rule 2: Domain has zero infrastructure imports

```typescript
// domain/ports/llm.port.ts
// ✅ Only TypeScript types and interfaces
// ❌ No import from 'openai', '@prisma/client', 'ioredis'
```

### Rule 3: Capabilities import domain, not infrastructure directly

Capability modules receive dependencies via function parameters or the DI container. They do not instantiate Prisma clients directly except in infrastructure adapters.

### Rule 4: Infrastructure is the composition root

Only `infrastructure/di/ai-platform.container.ts` wires concrete implementations to ports.

### Rule 5: Workers import platform handlers, not features

```typescript
// src/server/workers/course-indexing.worker.ts
import { handleCourseIndexing } from '@/ai-platform/indexing/workers/course-indexing.handler';
```

### Rule 6: Platform never imports from features

If the platform needs something from a feature, the feature passes it as a parameter or defines a port that the platform implements.

---

## Dependency Matrix

| From ↓ / To → | domain | application | capabilities | infrastructure | features |
|---------------|--------|-------------|--------------|----------------|----------|
| **domain** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **application** | ✅ | ✅ | ✅ (via interfaces) | ❌ | ❌ |
| **capabilities** | ✅ | ✅ | ✅ (peer) | ❌ (use ports) | ❌ |
| **infrastructure** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **features** | via index.ts only | via index.ts only | via index.ts only | ❌ | ✅ |
| **workers** | ❌ | ❌ | ✅ (handlers) | ❌ | ❌ |

---

## Naming Conventions

Aligned with existing codebase patterns (`ai-tutor`, `payments`):

| Artifact | Convention | Example |
|----------|-----------|---------|
| Port interface | `*Port` or `*.port.ts` | `LlmPort`, `memory-store.port.ts` |
| Adapter | `*-adapter.ts` or `*.adapter.ts` | `openai-llm.adapter.ts` |
| Repository | `*.repository.ts` | `agent-run.repository.ts` |
| Use case | `*-use-case.ts` (exported function) | `run-agent.use-case.ts` |
| Service | `*.service.ts` | `cost-ledger.service.ts` |
| Graph node | `*.node.ts` | `retrieve-context.node.ts` |
| Agent definition | `*-agent.definition.ts` | `tutor-agent.definition.ts` |
| DTO | `*.dto.ts` with Zod schema | `agent-run.dto.ts` |
| Error | `*.error.ts` with error codes | `agent.error.ts` |
| Redis key prefix | `ai:` namespace | `ai:embed:`, `ai:session:` |
| Queue name | `ai-*` or product-specific | `course-indexing`, `ai-evaluation` |

---

## What Belongs Here vs in Features

| Concern | Platform (`ai-platform/`) | Feature (`features/ai-*/`) |
|---------|--------------------------|---------------------------|
| LLM provider adapters | ✅ | ❌ |
| Vector search | ✅ | ❌ |
| LangGraph orchestration | ✅ | ❌ |
| Prompt storage (Langfuse) | ✅ | ❌ (feature owns prompt *keys*) |
| Cost tracking | ✅ | ❌ |
| Tutor conversation UI | ❌ | ✅ |
| API route handlers | ❌ | ✅ |
| Enrollment authorization | ❌ | ✅ |
| Educational integrity rules | ❌ | ✅ (tutor-specific) |
| Product-specific graph edges | Shared nodes in platform; product graph in `graph/graphs/` | Product may extend |
| Prisma models for tutor messages | ❌ (feature repo) | ✅ |
| Prisma models for platform runs | ✅ | ❌ |

---

## Related Documentation

- [02-architecture.md](./02-architecture.md) — Layer model and flows
- [04-agents.md](./04-agents.md) — Agent and graph details
- [15-adrs.md](./15-adrs.md) — ADR-005 (direct TS API), ADR-011 (worker placement)
- [16-cost-engine.md](./16-cost-engine.md) — Cost governance module layout
