# 08 - Production Operations (Course Indexing)

Operational guide for the AI Tutor knowledge indexing pipeline. Use alongside [04-indexing-pipeline.md](./04-indexing-pipeline.md) for architecture context.

---

## Architecture Summary

```
Course Published
    ↓
publish-course.use-case → BullmqCourseKnowledgeIndexer
    ↓
Redis queue: course-indexing
    ↓
course-indexing.worker.ts
    ↓
knowledge-ingestion-pipeline → knowledge_chunks + knowledge_source_hashes
```

**Key files:**

| Component | Path |
|-----------|------|
| Worker | `src/server/workers/course-indexing.worker.ts` |
| Queue publisher | `src/features/ai-tutor/infrastructure/queue/course-indexing.publisher.ts` |
| Startup validation | `src/features/ai-tutor/infrastructure/startup/validate-indexing-infrastructure.ts` |
| Health endpoint | `GET /api/health/tutor` |
| Bootstrap backfill | `src/features/ai-tutor/infrastructure/queue/course-indexing-bootstrap.ts` |

---

## Local Development

### Prerequisites

- PostgreSQL with **pgvector** extension (`CREATE EXTENSION IF NOT EXISTS vector`)
- Redis (local Docker or Upstash)
- Node.js ≥ 20, pnpm ≥ 10

### Environment variables

```env
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
AI_TUTOR_ENABLED="true"
AI_PLATFORM_ENABLED="true"   # staging: enable platform module (delegates providers, guards, indexing)
OPENAI_API_KEY="sk-..."
# Optional overrides:
AI_TUTOR_EMBEDDING_MODEL="text-embedding-3-small"
AI_TUTOR_LLM_MODEL="gpt-3.5-turbo"
```

### Start services

```bash
# 1. Database migrations
npx prisma migrate dev

# 2. Redis (if using Docker Compose)
docker compose up -d

# 3. Next.js app
pnpm dev

# 4. Course indexing worker (separate terminal)
pnpm worker:course-indexing
```

### Verify

```bash
curl http://localhost:3000/api/health/tutor
```

Expected: `status: "healthy"` with `checks.database`, `checks.redis`, `checks.pgvector` all `"ok"`.

Publish a course and confirm worker logs:

- `[COURSE_INDEXING_ENQUEUED]`
- `[COURSE_INDEXING_WORKER_JOB_STARTED]`
- `[COURSE_INDEXING_WORKER_JOB_COMPLETED]`

Re-publish without content changes — confirm `sourcesUnchanged > 0` in completion logs.

---

## Production Deployment

### Checklist

1. **Install dependencies:** `pnpm install --frozen-lockfile`
2. **Run migrations:** `npx prisma migrate deploy` (requires pgvector on target Postgres)
3. **Set environment variables** (see above; `AI_TUTOR_ENABLED=true` and `AI_PLATFORM_ENABLED=true` in staging/production environments that use the tutor)
4. **Start Next.js:** `pnpm build && pnpm start`
5. **Start worker** as a supervised process: `pnpm worker:course-indexing`
6. **Verify health:** `GET /api/health/tutor` returns HTTP 200
7. **Verify queue:** health response `indexing.waiting` / `indexing.active` reflect expected load
8. **Smoke test:** publish a course; confirm chunks written to `knowledge_chunks`

### Worker process management

Run `pnpm worker:course-indexing` under systemd, Kubernetes Deployment, or PM2. The worker:

- Validates DB, Redis, pgvector, and OpenAI config at startup
- Exits `0` when `AI_TUTOR_ENABLED=false` (no crash loop)
- Exits `1` when critical dependencies are missing
- Handles `SIGTERM` / `SIGINT` with graceful drain (`COURSE_INDEXING_SHUTDOWN_GRACE_MS`, default 30s)

### Database migrations

| Migration | Purpose |
|-----------|---------|
| `20260729180000_add_knowledge_chunks_pgvector` | `knowledge_chunks`, pgvector, HNSW index |
| `20260730120000_add_knowledge_source_hashes` | Incremental indexing hashes |

Always use `prisma migrate deploy` in production — never `db push` (HNSW index lives in SQL only).

---

## Health Monitoring

### `GET /api/health/tutor`

```json
{
  "status": "healthy",
  "aiTutorEnabled": true,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "pgvector": "ok",
    "aiTutorConfigured": "ok",
    "queueConnectivity": "ok"
  },
  "indexing": {
    "queue": "course-indexing",
    "active": 0,
    "waiting": 2,
    "completed": 0,
    "failed": 0,
    "delayed": 0
  }
}
```

- HTTP **200** = healthy
- HTTP **503** = degraded (check `checks` for failing component)

### Log tags to monitor

| Tag | Meaning |
|-----|---------|
| `[COURSE_INDEXING_WORKER_JOB_FAILED]` | Job exhausted retries |
| `[COURSE_INDEXING_BOOTSTRAP_FAILED]` | Startup backfill error |
| `[PUBLISH_COURSE_INDEXING_ENQUEUE_FAILED]` | Publish succeeded but queue enqueue failed |
| `[KNOWLEDGE_INGESTION_RESOURCE_ERROR]` | Per-source extraction/embedding failure |
| `[COURSE_INDEXING_WORKER_PARTIAL_FAILURE]` | Some sources failed; job may still complete |

---

## Operational Runbook

### Restart workers

```bash
# systemd example
sudo systemctl restart course-indexing

# or kill gracefully (worker drains in-flight job)
kill -TERM <pid>
```

After restart, bootstrap runs once (Redis lock prevents duplicate bootstrap across workers).

### Inspect failed jobs

Failed jobs are retained in Redis (`removeOnFail: false`).

1. Check health endpoint: `indexing.failed` count
2. Inspect Redis keys: `bull:course-indexing:failed`
3. Review worker logs for `[COURSE_INDEXING_WORKER_JOB_FAILED]` with `jobId`, `attemptsMade`, `err`

To replay: re-publish the course/lecture or call `POST /api/tutor/index` (course-scoped manual reindex).

### Reindex a course

| Method | When to use |
|--------|-------------|
| Re-publish course | Triggers new job if `contentVersion` (`updatedAt`) changed |
| `POST /api/tutor/index` | Instructor/admin manual full-course reindex |
| Restart worker + bootstrap | Only for courses with `knowledgeIndexedAt IS NULL` |

Incremental reindex skips unchanged sources via SHA-256 content hashes in `knowledge_source_hashes`.

### Recover after Redis outage

1. Restore Redis connectivity
2. Restart worker — startup validation must pass
3. Failed/waiting jobs resume from Redis once worker is running
4. Check `indexing.failed` in health endpoint; re-publish or manual reindex if needed

### Recover after database migration

1. Run `npx prisma migrate deploy`
2. Confirm pgvector extension exists
3. Restart Next.js and worker
4. Bootstrap enqueues jobs for published courses missing `knowledgeIndexedAt`

### Common failures

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Worker exits immediately | `AI_TUTOR_ENABLED=false` | Expected; enable feature or don't run worker |
| Worker exits code 1 at startup | Missing `OPENAI_API_KEY`, DB, Redis, or pgvector | Fix env; check `[INDEXING_STARTUP_VALIDATION]` logs |
| `NO_CONTENT` job failure | No published lecture text to index | Publish lectures with content; non-retryable |
| High `indexing.failed` | OpenAI rate limits or bad attachments | Check `[KNOWLEDGE_INGESTION_RESOURCE_ERROR]`; fix content |
| Publish OK but no indexing | Enqueue failed silently | Search `[PUBLISH_COURSE_INDEXING_ENQUEUE_FAILED]` |
| Duplicate indexing work | Same `contentVersion` re-published rapidly | Queue dedupes by job id; ingestion also skips unchanged hashes |

---

## Queue Configuration

| Setting | Value |
|---------|-------|
| Queue name | `course-indexing` |
| Job types | `index-course`, `index-lecture` |
| Retries | 5 attempts, exponential backoff (60s base) |
| Job id | `index-course_{courseId}_{contentVersion}` or `index-lecture_{lectureId}_{contentVersion}` |
| Completed jobs | Removed from Redis |
| Failed jobs | Retained for inspection |

---

## Remaining Production Risks

- **Enqueue failures on publish are swallowed** — monitor `[PUBLISH_COURSE_INDEXING_ENQUEUE_FAILED]`
- **No worker heartbeat in health endpoint** — queue metrics only; process liveness requires external supervisor
- **Default worker concurrency is 1** — large courses index sequentially
- **OpenAI rate limits** — retries help but no dedicated rate limiter in pipeline
- **HNSW index not in Prisma schema** — always use `migrate deploy`, not `db push`
