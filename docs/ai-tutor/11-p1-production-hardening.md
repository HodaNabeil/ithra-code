# AI Tutor — P1 Production Hardening

> Sprint documentation for P1-1 through P1-9.  
> **Status:** Complete  
> **Last updated:** August 2026

---

## P1-8 — Vector Infrastructure Validation

1. **Original problem:** `validatePlatformInfrastructure()` existed but was never called; HNSW index was migration-only with no runtime probe.
2. **Root cause:** Platform validation was implemented in Phase 1 but not wired to boot; Prisma cannot declare HNSW on `Unsupported("vector")`.
3. **Selected solution:** Extend validator with HNSW + vector probe checks; call from `instrumentation.ts` when platform enabled; document index in schema comment + idempotent migration.
4. **Alternatives:** Health-endpoint-only validation — rejected (too late).
5. **Why chosen:** Fail-fast at boot matches worker indexing validation pattern.
6. **Trade-offs:** Web process now depends on DB/pgvector at startup when AI platform enabled.
7. **Performance:** One-time probe query at boot; negligible.
8. **Security:** No user data involved.
9. **Backward compatibility:** No behavior change when `AI_PLATFORM_ENABLED=false`.
10. **Configuration:** None new.
11. **Modified files:** `validate-platform-infrastructure.ts`, `instrumentation.ts`, `schema.prisma`, migration `20260807140000_ensure_knowledge_chunks_hnsw_index`.

---

## P1-2 — Retrieval Quality

1. **Original problem:** Tutor retrieval ignored env-tuned `topK`/`minSimilarity`; threshold applied after SQL `LIMIT`; lecture fallback used magic `0`; `usedFallback` semantics incorrect.
2. **Root cause:** `content-retriever.service.ts` hardcoded `AI_PLATFORM_CONSTANTS`; adapter filtered in memory.
3. **Selected solution:** SQL `WHERE (1 - (embedding <=> query)) >= minScore`; centralize via `getRetrievalConfig()` including `lectureFallbackMinSimilarity`; fix `usedFallback` for lecture-relaxed strategy.
4. **Alternatives:** Over-fetch before filter — rejected (wasteful).
5. **Why chosen:** SQL threshold ensures `LIMIT` applies to qualifying rows.
6. **Trade-offs:** Slightly more complex SQL; lecture bias remains ORDER BY not score boost.
7. **Performance:** Better recall without extra round-trips.
8. **Security:** No change.
9. **Backward compatibility:** Env vars now effective on tutor path.
10. **Configuration:** `AI_PLATFORM_LECTURE_FALLBACK_MIN_SIMILARITY`, `AI_TUTOR_LECTURE_FALLBACK_MIN_SIMILARITY` (default 0.3).
11. **Modified files:** `postgres-vector-search.adapter.ts`, `content-retriever.service.ts`, `types.ts`, `retrieve-context.node.ts`, `ai-platform.config.ts`, `env.ts`, `constants.ts`.

---

## P1-1 — Search Tool Runtime Isolation

1. **Original problem:** LLM could supply `courseId` in search tool args; cross-course search possible.
2. **Root cause:** Tool schema exposed `courseId`; `tool-call.node` read undefined `state.courseId`.
3. **Selected solution:** Remove `courseId` from schema; bind from `runtime.courseId` / `ToolContext.scope`; enforce `requiresAuth` in executor.
4. **Alternatives:** Post-hoc validation of LLM-supplied ID — rejected (trusts attacker input).
5. **Why chosen:** Aligns with ADR-010 pre-authorized scope pattern.
6. **Trade-offs:** Tool unusable without runtime course scope (intended).
7. **Performance:** None.
8. **Security:** Eliminates cross-course search via tool args.
9. **Backward compatibility:** Breaking change for any caller passing `courseId` in tool args (none in production SSE path).
10. **Configuration:** None.
11. **Modified files:** `search.tool.ts`, `tool-call.node.ts`, `tool-executor.ts`.

---

## P1-3 — Assessment Indexing

1. **Original problem:** Full assessment bodies embedded; `sanitizeAssessmentBody()` unused.
2. **Root cause:** Extractors did not sanitize; ASSESSMENT chunks indexed with embeddings despite retrieval filter.
3. **Selected solution:** Wire `sanitizeAssessmentBody()` in quiz/assignment extractors; skip chunking for `ASSESSMENT` sensitivity (like `INSTRUCTOR`).
4. **Alternatives:** Embed but filter at retrieval — rejected (cost + leak surface).
5. **Why chosen:** Only PUBLIC educational content should be embedded.
6. **Trade-offs:** Assessment hint sources (PUBLIC) still indexed.
7. **Performance:** Reduced embedding API cost.
8. **Security:** Removes answer-line content from vector store.
9. **Backward compatibility:** Reindex recommended to purge existing ASSESSMENT embeddings.
10. **Configuration:** None.
11. **Modified files:** `base-extractor.ts`, `inline-extractors.ts`, `chunk-builder.service.ts`.

---

## P1-9 — Atomic Reindex

1. **Original problem:** Delete-then-insert was non-atomic; outbox tracked enqueue only; sequential per-row inserts.
2. **Root cause:** Separate repository calls; outbox designed for queue durability not indexing completion.
3. **Selected solution:** `replaceSourceChunks()` transactional replace; batched inserts; parallel source ingestion; `COMPLETED` outbox status after worker success.
4. **Alternatives:** Version-swap — rejected (schema complexity).
5. **Why chosen:** Matches per-source hash model with minimal change.
6. **Trade-offs:** Course-level reindex still not one global transaction.
7. **Performance:** Parallel ingestion + batching improves throughput.
8. **Security:** No change.
9. **Backward compatibility:** New outbox enum value via migration.
10. **Configuration:** `KNOWLEDGE_INGESTION_SOURCE_CONCURRENCY` (default 3).
11. **Modified files:** `PrismaKnowledgeChunkRepository.ts`, `knowledge-ingestion-pipeline.service.ts`, `indexing-outbox.service.ts`, `course-indexing.handler.ts`, `enqueue.ts`, `constants.ts`, schema + migration.

---

## P1-4 — Conversation History Management

1. **Original problem:** Full history sent to LLM; summarizer existed but unwired.
2. **Root cause:** No graph node or policy integration.
3. **Selected solution:** `prepare-history` graph node after retrieval; `token-budget.policy.ts`; wire `summarizeConversationIfNeeded()`.
4. **Alternatives:** Feature-layer trimming only — rejected (platform owns LLM context).
5. **Why chosen:** Retrieval uses full history; generation uses budgeted history.
6. **Trade-offs:** Summarization adds latency/cost on long threads.
7. **Performance:** Reduces prompt tokens on long conversations.
8. **Security:** No change.
9. **Backward compatibility:** Behavior change for 20+ turn threads (intended improvement).
10. **Configuration:** `AI_PLATFORM_HISTORY_TOKEN_BUDGET` (default 8000).
11. **Modified files:** `token-budget.policy.ts`, `prepare-history.node.ts`, `tutor.graph.ts`, `context-summarizer.ts` (used), `env.ts`.

---

## P1-5 — Provider Streaming

1. **Original problem:** Anthropic/Gemini fake-streamed; abort signal ignored.
2. **Root cause:** Adapters called `complete()` then yielded single chunk.
3. **Selected solution:** Native SSE streaming for Anthropic and Gemini; `createLinkedAbortController` for abort+timeout; resilient wrapper skips retry on abort/partial output.
4. **Alternatives:** Buffered single-chunk with metadata flag — kept as implicit fallback only when streaming fails.
5. **Why chosen:** Real incremental tokens for multi-provider routing.
6. **Trade-offs:** More complex SSE parsing.
7. **Performance:** Lower time-to-first-token on non-OpenAI providers.
8. **Security:** Abort cancels in-flight requests.
9. **Backward compatibility:** API unchanged.
10. **Configuration:** None new.
11. **Modified files:** `anthropic-llm.adapter.ts`, `gemini-llm.adapter.ts`, `resilient-llm.adapter.ts`.

---

## P1-7 — Privacy & Compliance

1. **Original problem:** Raw user input and `userId` sent to LangSmith; logger redaction documented but missing.
2. **Root cause:** No pre-export redaction layer.
3. **Selected solution:** `trace-redactor.ts`; Pino `redact` paths; privacy compliance doc.
4. **Alternatives:** LangSmith-side-only redaction — rejected (defense in depth).
5. **Why chosen:** Application controls data before third-party export.
6. **Trade-offs:** Hashed IDs harder to correlate manually in LangSmith UI.
7. **Performance:** Negligible hashing cost.
8. **Security:** Reduced PII exposure in traces/logs.
9. **Backward compatibility:** Trace shape changes (hashed userId).
10. **Configuration:** `LANGSMITH_PII_SALT`.
11. **Modified files:** `trace-redactor.ts`, `langsmith-tracer.ts`, `logger.ts`, `12-privacy-compliance.md`, `env.ts`.

---

## P1-6 — Evaluation Pipeline

1. **Original problem:** Broken Ragas Python API; no agent E2E; `mustNotContain` unenforced; CI missing Postgres.
2. **Root cause:** Scaffold implementation; placeholder metrics.
3. **Selected solution:** Fix `ragas_eval.py` Dataset schema; `tutor-agent-eval.runner.ts`; `must-not-contain.ts`; CI Postgres service; expand golden datasets.
4. **Alternatives:** Static-only eval — rejected (doesn't test live agent).
5. **Why chosen:** Real Ragas + integrity assertions + DB persistence in CI.
6. **Trade-offs:** Live agent eval requires API key when enabled.
7. **Performance:** Nightly job duration increases with agent invocation.
8. **Security:** Eval uses isolated test DB.
9. **Backward compatibility:** CI fails on fallback (intended guard).
10. **Configuration:** `AI_PLATFORM_ENABLED` for live agent eval.
11. **Modified files:** `ragas_eval.py`, `tutor-agent-eval.runner.ts`, `must-not-contain.ts`, `offline-eval.runner.ts`, `evaluator-golden.json`, `ai-evaluation.yml`.

---

## Related

- [12-privacy-compliance.md](./12-privacy-compliance.md)
- [13-p1-engineering-report.md](./13-p1-engineering-report.md)
- [AI Platform ADRs](../ai-platform/15-adrs.md) — ADR-011 through ADR-015
