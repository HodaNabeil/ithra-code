# AI Tutor — Privacy & Compliance

> Data handling, third-party processors, and retention policy.  
> **Last updated:** August 2026

---

## Data Retained

| Data | Storage | Purpose | Retention |
|------|---------|---------|-----------|
| Tutor conversations | PostgreSQL (`tutor_messages`) | Multi-turn tutoring | Until user deletes conversation |
| Agent runs | PostgreSQL (`ai_agent_runs`) | Cost ledger, observability | 90 days (documented; cleanup job P2) |
| Tool invocations | PostgreSQL (`ai_tool_invocations`) | Audit | 90 days (documented; cleanup job P2) |
| Embeddings | PostgreSQL (`knowledge_chunks`) | RAG retrieval | Until course reindex/delete |
| LangSmith traces | LangSmith cloud | Debugging, eval | 90 days (project config) |
| Langfuse prompts | Langfuse cloud | Prompt management | Per Langfuse project policy |

---

## Third-Party Processors

| Processor | Data Sent | PII Controls |
|-----------|-----------|--------------|
| OpenAI | Prompts, embeddings | Input sanitization; no raw PII in prompts by design |
| Anthropic / Google AI | Prompts (when routed) | Same as OpenAI path |
| LangSmith | Redacted trace inputs, hashed userId | `trace-redactor.ts` before export |
| Langfuse | Prompt templates | No user content |

---

## PII Handling (P1-7)

- **Before LangSmith:** `redactTraceInputs()` scrubs emails/phones; `hashIdentifier()` for `userId`.
- **Logs:** Pino redacts `password`, `token`, `authorization`, `email`, cookies.
- **Tutor request logs:** Metadata only (no message body).

Configure `LANGSMITH_PII_SALT` in production for stable user hashing.

---

## User Rights

- **Delete conversation:** `DELETE /api/tutor/conversations` removes thread messages.
- **Account deletion:** `ai_agent_runs` anonymization documented for P2.

---

## Retention Policy Summary

1. Conversations: user-controlled deletion.
2. Traces: 90 days in LangSmith (external).
3. Cost/audit tables: 90 days (enforcement P2).
4. Knowledge chunks: lifecycle tied to course content.

See also [10-data-retention.md](./10-data-retention.md).
