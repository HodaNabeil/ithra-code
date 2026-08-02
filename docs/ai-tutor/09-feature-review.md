# AI Tutor — Production Feature Review

**Date:** August 2, 2026  
**Reviewer:** Staff Engineer design review (`/review-feature`)  
**Scope:** Full AI Tutor stack — chat/RAG runtime, indexing pipeline, frontend, and ops (`src/features/ai-tutor/`)

**Assumptions:**
- Scope is the full AI Tutor stack: chat/RAG runtime, indexing pipeline, frontend, and ops.
- Review is based on code and docs in the repo; tests were not executed in this session.
- Production deployment uses a separate `course-indexing` worker, Redis, pgvector, and `AI_TUTOR_ENABLED=true`.

---

# Executive Summary

The AI Tutor is architecturally strong: clean layering, port/adapter boundaries, streaming SSE, RAG with sensitivity filtering, educational-integrity controls, and a documented indexing pipeline. It is **not production-ready as-is**. There is at least one **critical conversation-history bug** that breaks LLM context on threads with 20+ messages, authorization gaps around enrollment status, and operational risks (silent indexing failures, Redis fail-open rate limiting, post-stream content leakage). Test coverage is solid for ingestion/RAG helpers but thin at the API, use-case, guard, worker, and frontend layers.

---

# Strengths

- **Clean Architecture** with clear domain ports (`LlmPort`, `VectorSearchPort`, `ConversationRepositoryPort`) and infrastructure adapters.
- **Course-scoped security model**: auth on all routes, enrollment check before context build, vector search restricted to `PUBLIC` sensitivity.
- **Educational integrity**: pre-LLM assessment-intent blocking plus post-stream `ContentFilterPort` validation.
- **Operational awareness**: health endpoint (`GET /api/health/tutor`), structured log tags, bootstrap backfill, incremental indexing via content hashes.
- **UX fundamentals**: SSE streaming, source citations, retry, RTL Arabic UI, feature flag gating.
- **Sensible limits**: message length caps, token budgeting in `prompt-builder`, concurrent stream slots, per-user rate limits.

---

# Critical Issues

## 1. Conversation history returns oldest messages, not most recent

**Description:** `getThreadMessages` orders ascending and takes the first N rows:

```typescript
// src/features/ai-tutor/infrastructure/repositories/PrismaConversationRepository.ts
async getThreadMessages(threadId: string, limit = 20): Promise<MessageDTO[]> {
  const messages = await prisma.tutorMessage.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
  return messages.map(mapMessage);
}
```

**Why it matters:** On threads with 20+ messages, the UI shows stale history and `askTutorUseCase` builds LLM context from old messages. After persisting the new user message, the current question can be **excluded entirely** from the prompt.

**Production impact:** Wrong or nonsensical answers on active threads; broken multi-turn tutoring for engaged students.

**Recommendation:** Fetch the most recent N messages (`orderBy: { createdAt: 'desc' }, take: limit`, then reverse), or use a cursor/subquery. Add integration tests for 25+ message threads.

---

## 2. Post-stream validation leaks filtered content to the client

**Description:** In `ask-tutor.use-case.ts`, invalid LLM output is streamed token-by-token, then a correction is **appended** after `---` rather than replacing the streamed content:

```typescript
// Replace streamed leaky content with a guided correction notice.
yield `\n\n---\n${finalResponse}`;
```

**Why it matters:** Students can see direct quiz/assignment answers before the correction block — undermining educational integrity.

**Production impact:** Academic integrity violation; reputational and product-trust risk.

**Recommendation:** Buffer tokens when strict validation is required and only stream after validation, or replace the assistant message client-side on `[META]` correction events. Never stream unvalidated assessment-sensitive content.

---

# High Priority Issues

## 3. Enrollment status not enforced

**Description:** `findEnrolledCourseWithProgress` matches any enrollment row, including `DROPPED` and `REVOKED`:

```typescript
// src/features/ai-tutor/infrastructure/repositories/PrismaCourseContextRepository.ts
enrollments: {
  some: {
    studentId: params.userId,
  },
},
```

**Production impact:** Revoked students retain tutor access and incur OpenAI cost.

**Recommendation:** Restrict to `ACTIVE` and `COMPLETED` (or your product's allowed set).

---

## 4. Rate limiting and stream slots fail open on Redis errors

**Description:** Redis failures are logged and requests proceed:

```typescript
// src/features/ai-tutor/infrastructure/guards/tutor-request.guards.ts
} catch (error) {
  if (error instanceof AskTutorError) {
    throw error;
  }
  console.error('[TUTOR_RATE_LIMIT]', error);
}
```

**Production impact:** During Redis outages, unlimited LLM calls → cost spikes and abuse.

**Recommendation:** Fail closed for rate limits (or degrade with in-memory per-process limits). Alert on `[TUTOR_RATE_LIMIT]` errors.

---

## 5. Indexing enqueue failures are swallowed on publish

**Description:** `publish-course.use-case.ts` catches indexing enqueue errors and only logs `[PUBLISH_COURSE_INDEXING_ENQUEUE_FAILED]` — publish still succeeds.

**Production impact:** Courses go live without knowledge base; tutor returns empty/fallback answers with no user-visible signal.

**Recommendation:** Surface a warning to instructors, retry enqueue via outbox pattern, and alert when `knowledgeIndexedAt` stays null after publish.

---

## 6. No LLM retry despite documented retry strategy

**Description:** `OpenAILlmAdapter` maps 429/5xx to errors but does not retry. Docs (`03-runtime-pipeline.md`) describe exponential backoff.

**Production impact:** Transient OpenAI failures become user-visible 502s.

**Recommendation:** Add bounded retries with jitter for retryable `LlmError` codes; respect `Retry-After` on 429.

---

## 7. User message persisted before LLM success

**Description:** User message is saved before retrieval/LLM. Failures leave orphan user messages (no assistant reply).

**Production impact:** Confusing history, inflated message counts, poor retry UX.

**Recommendation:** Persist user message in the same transaction as assistant message, or mark messages `pending` until completion.

---

# Medium Priority Issues

## 8. Regex-only educational integrity is bypassable

Assessment detection relies on pattern matching (`educational-integrity-rules.ts`). Paraphrased or non-English requests can slip through pre-LLM checks.

**Recommendation:** Combine heuristics with retrieval sensitivity signals and post-hoc groundedness checks.

---

## 9. `GET /api/tutor/threads` has write side effects

`getTutorThreadMessagesUseCase` calls `getOrCreateConversation` / `getOrCreateThread` on every history load — not idempotent read semantics.

**Recommendation:** Split "load thread" from "create thread"; create only on first message send.

---

## 10. General threads (`lectureId = null`) can duplicate

`@@unique([conversationId, lectureId])` allows multiple NULL `lectureId` rows in PostgreSQL. `getOrCreateThread` uses `findFirst` by topic — race conditions can create duplicates.

**Recommendation:** Partial unique index on `(conversationId) WHERE lecture_id IS NULL`, or use a sentinel lecture ID.

---

## 11. No structured observability for runtime chat

Indexing has log tags; chat path relies on dev-only `console.info`. No metrics for latency, token usage, fallback rate, filter triggers, or cost per course/user.

**Recommendation:** Add counters/histograms: `tutor.request.duration`, `tutor.rag.fallback`, `tutor.filter.triggered`, `tutor.openai.tokens`.

---

## 12. Health endpoint exposes infrastructure state without auth

`GET /api/health/tutor` is unauthenticated and returns Redis/queue/DB status.

**Recommendation:** Restrict to internal networks or admin auth in production.

---

## 13. Documentation drift

- README still says "Next: Automatic indexing pipeline" — already implemented.
- Runtime docs cite 5000 messages/day; code uses **1000/day** (`shared/index.ts`).
- Cache key documented as `v1`; code uses `v2`.

---

# Low Priority Improvements

- Expose `cancel()` from `useAITutorChat` in `AITutorChat` UI (stop button during streaming).
- `indexBatch` in `PostgresVectorSearchAdapter` is sequential — slow for large reindexes.
- Planned APIs (`GET /conversations`, `DELETE /messages/:id`) documented but not implemented.
- `courseTitle` accepted in DTO but appears unused server-side.
- No per-course rate limits (only per-user).

---

# Missing Requirements

- Data retention / deletion policy for tutor conversations (GDPR/right-to-erasure).
- Instructor visibility into indexing status from the course UI.
- Explicit SLA for "course published → tutor ready".
- User-facing message when knowledge base is empty vs. low-confidence retrieval.
- Audit log for manual reindex (`POST /api/tutor/index`) beyond console logs.
- Accessibility requirements for streaming chat (screen reader announcements).
- Cost budgets / alerts per environment.

---

# Edge Cases

| Scenario | Current behavior | Risk |
|----------|------------------|------|
| Thread with 21+ messages | Oldest 20 loaded; current question may be missing from LLM | Critical |
| Redis down | Rate limits disabled | High |
| Double-tab streaming | Up to 2 concurrent streams allowed | Medium |
| Browser refresh mid-stream | Partial assistant message may persist or be lost | Medium |
| Revoked enrollment | Access still granted | High |
| Empty knowledge base | Fallback message; no instructor alert | Medium |
| Concurrent thread creation | Possible duplicate general threads | Low |
| Slow network / 60s timeout | AbortError → 502; user message already saved | Medium |
| Assessment question in Arabic slang | May bypass regex pre-filter | Medium |
| Re-publish same course rapidly | Job dedup by contentVersion helps | Low |
| Lecture deleted after indexing | Chunks may remain (`onDelete: SetNull`) | Low |

---

# Security Risks

- **Authorization:** DROPPED/REVOKED enrollments not blocked.
- **Educational integrity:** Post-stream leakage of assessment answers.
- **Abuse:** Fail-open rate limiting during Redis failure.
- **Cost abuse:** 1000 messages/day/user × OpenAI embedding + completion = significant spend; no global circuit breaker.
- **IDOR:** Low risk — access scoped by session `userId` + enrollment.
- **Injection:** Vector search uses parameterized queries; Zod validates input. Low SQL injection risk.
- **XSS:** `TutorMessageContent` renders markdown lightly — verify no raw HTML injection from LLM output.
- **CSRF:** Cookie-based auth on POST endpoints — ensure SameSite cookies and origin checks if applicable.

---

# Performance Risks

- Every question triggers embedding API call (~100–150ms) + vector search — no embedding cache for identical questions.
- Session context built from DB on cache miss (multiple joins).
- `getOrCreateConversation` loads all threads + messages on upsert — grows with conversation size.
- Indexing worker default concurrency 1 — large courses index slowly.
- Sequential `indexBatch` updates — bottleneck for bulk reindex.
- Frontend re-fetches full thread history on `lectureTitle` change.

---

# Scalability Risks

- OpenAI rate limits under load; no centralized token bucket for org-wide limits.
- Redis single point for rate limits, stream slots, session cache, BullMQ.
- `knowledge_chunks` HNSW index not in Prisma schema — migration discipline required.
- Conversation tables grow unbounded — no archival/TTL strategy.
- Worker liveness not in health check — silent worker death leaves queue backing up.

---

# Reliability Risks

- Silent indexing enqueue failure after publish.
- No outbox for at-least-once indexing triggers.
- LLM timeouts without retry.
- Partial indexing logged as `[COURSE_INDEXING_WORKER_PARTIAL_FAILURE]` but course may still be marked indexed.
- Stream slot leak if process crashes before `releaseStreamSlot` (mitigated by Redis TTL).

---

# Testing Gaps

**Covered:** knowledge ingestion, RAG helpers, prompt builder, educational integrity rules, learning analytics, publisher job ID dedup, publish→enqueue wiring.

**Missing:**
- `askTutorUseCase` end-to-end (especially 20+ message history)
- API handler tests (SSE protocol, error mapping)
- Redis guard integration tests (including fail-open behavior)
- `PrismaConversationRepository.getThreadMessages` correctness
- Worker job processing tests
- `AITutorChat` / `useAITutorChat` component tests
- Load tests for concurrent streaming
- Security tests for revoked enrollment access

---

# Production Readiness Score

**Score: 62/100**

**Reasoning:** Strong foundation (+25 architecture, +15 security design, +12 indexing ops, +10 feature completeness) offset by critical history bug (−15), integrity leakage (−10), auth/ops gaps (−10), and thin integration/E2E test coverage (−10). Fix the history bug and post-stream validation before any broad rollout.

---

# Top 10 Actions Before Shipping

1. **Fix `getThreadMessages`** to return the most recent N messages; add regression test for 25+ message threads.
2. **Stop streaming unvalidated LLM output** when educational-integrity strict mode applies.
3. **Enforce enrollment status** (`ACTIVE`/`COMPLETED` only) in `PrismaCourseContextRepository`.
4. **Fail closed on rate-limit Redis errors** (or add fallback limiter) with alerting.
5. **Make indexing enqueue failures visible** — instructor warning + monitoring on `knowledgeIndexedAt`.
6. **Add LLM retry with backoff** for transient OpenAI errors.
7. **Add runtime observability** — latency, fallback rate, filter triggers, token/cost metrics.
8. **Integration tests** for `askTutorUseCase` and SSE handler protocol.
9. **Wire cancel/stop** in chat UI; handle orphan user messages on failure.
10. **Update docs** (README, rate limits, cache key) and restrict health endpoint in production.

---

## Remediation Status (August 2026)

| Item | Status |
|------|--------|
| Recent message history query | Done |
| Buffer-then-stream integrity | Done |
| Enrollment status filter | Done |
| Fail-closed rate limits + cost cap | Done |
| Deferred turn persistence | Done |
| LLM retry adapter | Done |
| Indexing enqueue retry + warning | Done |
| Read-only thread history | Done |
| General thread unique index + outbox | Done |
| Structured request logging | Done |
| Protected health endpoint | Done |
| Docs + retention policy | Done |
| Cancel UI + a11y live region | Done |
| Embedding cache + batch vector updates | Done |
| Instructor indexing banner component | Done |
| Planned tutor APIs + load smoke script | Done |
