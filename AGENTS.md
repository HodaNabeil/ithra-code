# AGENTS.md

This file provides guidance to AI coding agents (Claude Code, Cursor, etc.) when working with code
in this repository.

## Project Overview

Next.js (App Router) full-stack app for **IthraCode** — an Arabic-first (RTL) online learning
platform for programming & web development courses. Built on **Next.js 16** + **React 19**,
**Prisma ORM 7** with PostgreSQL, **NextAuth v5** for auth, **Stripe** and **Paymob** for payments,
**Mux** for video, **BullMQ + Redis** for background jobs, and an internal **AI Platform**
(LangGraph-based) powering the AI Tutor feature. Package manager is **pnpm**.

## Forbidden Actions

These are hard restrictions. Never perform any of the following, even if asked:

- **Package installs**: Do NOT run `npm install`, `yarn install`, `pnpm install`, `pnpm add`,
  `yarn add`, or any variant in the terminal.
- **`node_modules/`**: Do NOT read, search, list, or open any file inside `node_modules/` for any
  reason (including checking a dependency's source or types). If you need to know a package's API,
  rely on its documentation/types you already know, or ask the user — never inspect
  `node_modules/`.
- **Read locked/generated dirs**: Do NOT read files inside `.next/`, `dist/`, or `build/`. Do NOT
  read `pnpm-lock.yaml` or `tsconfig.tsbuildinfo`.
- **Prisma client**: Do NOT hand-edit files under `src/generated/prisma` — it is generated via
  `pnpm prisma:generate`.
- **Docker**: Do NOT run `docker compose up` / `docker-compose up` or `docker build`.
- **Dev/build server**: Do NOT run `pnpm dev`, `pnpm build`, or `pnpm start` unless explicitly
  asked.
- **Git commands**: Do NOT run any `git` commands in the terminal unless explicitly asked.
- **Secrets**: Do NOT read or print `.env` contents; use `.env.example` as the reference for
  variable names.

## Common Commands

```bash
pnpm dev                          # Start dev server (Next.js, port 3000)
pnpm build                        # Production build
pnpm start                        # Start production server
pnpm lint                         # ESLint
pnpm format                       # Prettier --write
pnpm format:check                 # Prettier --check (CI)
pnpm type-check                   # tsc --noEmit
pnpm seed                         # Seed the database (prisma/seeds/seed.ts)
pnpm db:push                      # Push Prisma schema to DB
pnpm db:reset                     # Reset DB (force)
pnpm db:studio                    # Open Prisma Studio
pnpm worker:order-completed       # Post-payment fulfillment worker (BullMQ)
pnpm worker:course-indexing       # AI Tutor course knowledge indexing worker
pnpm worker:ai-cost-aggregation   # AI cost ledger aggregation worker
pnpm worker:reconcile             # Payment reconciliation scheduler
pnpm worker:reconcile-consumer    # Payment reconciliation queue consumer
```

## Architecture

### Feature-Based / Hexagonal-Lite Structure

Each module under `src/features/{feature}/` generally follows a layered structure (not every
feature has every layer — simpler features may only have `actions/`, `components/`, `lib/`):

```
features/{feature}/
  domain/             # Entities, value objects, domain events (framework-free)
  application/
    use-cases/        # One class/function per action (CreateCourseUseCase, etc.)
    dto/              # Request/response shapes
    ports/            # Interfaces the application depends on (repositories, gateways, publishers)
    services/         # Cross-cutting application services
    contracts/        # Request/response contracts for use-cases
    errors/           # Typed error classes
  infrastructure/
    prisma/           # Prisma repository implementations, `.select.ts` field-selection helpers
    redis/             # Redis-backed adapters (locks, rate limiters)
    queue/             # BullMQ publishers/consumers
    gateways/          # External providers (Stripe, Paymob, ...)
    di/                # Manual DI containers (e.g. `payments.container.ts`)
  actions/            # Next.js Server Actions (the primary entry point from the UI)
  api/                # Route-handler-facing logic (used by `src/app/api/**`)
  components/         # Feature-scoped React components
  hooks/              # Feature-scoped React hooks
```

More mature features (**payments**, **ai-tutor**) fully implement the domain → application →
infrastructure split with ports/adapters. Newer or simpler features (**cart**, **courses**,
**learning-paths**) mix in lighter patterns (services, repositories, policies) as needed — match
the existing pattern of the feature you're editing rather than forcing a rewrite.

### Entry Points: Server Actions + Route Handlers

- **Server Actions** (`src/features/{feature}/actions/*.ts`, marked `'use server'`) are the
  primary way pages and client components call into business logic.
- **API route handlers** (`src/app/api/**/route.ts`) are used for webhooks (Stripe, Paymob),
  external integrations, health checks, and admin endpoints.
- Both should stay thin: validate input (Zod), call a use-case/service, map errors, return.

### AI Platform (`src/ai-platform/`)

Internal, shared AI module. **Features must only import from `@/ai-platform`** (its public
barrel), never reach into its internals directly. It provides:

- `ai.chat()` / `ai.chatStream()` — provider-agnostic LLM runtime with cost ledger and guards.
- `streamAgent()` — LangGraph-based agent runtime (sanitize → retrieve → generate → validate),
  used by the AI Tutor feature (`src/features/ai-tutor/`).
- RAG pipeline: embeddings, `PostgresVectorSearchAdapter`, ingestion/indexing pipeline, BullMQ
  outbox/queue for course knowledge indexing.
- Observability: cost ledger, Langfuse prompt management, LangSmith tracing, OpenTelemetry
  metrics.

Gated behind `AI_PLATFORM_ENABLED` and `AI_TUTOR_ENABLED` env
flags. See `src/ai-platform/README.md` and `docs/ai-platform/` / `docs/ai-tutor/` for the full
design docs (blueprint, folder structure, agents, RAG, security, evaluation, ADRs).

### Authorization: Role-Based Access Control

- Three roles on `Role` enum (Prisma): `STUDENT`, `INSTRUCTOR`, `ADMIN`.
- Auth is handled by **NextAuth v5** (`src/lib/auth.ts`, `src/lib/auth.config.ts`) with the Prisma
  adapter; role is attached to the JWT/session via callbacks.
- Route groups under `src/app/` (e.g. `(admin)`, `(student)`, instructor areas) plus per-action
  checks (e.g. `require-auth` helpers, ownership/ visibility policy files like
  `course-visibility.policy.ts`, `course-authorization.service.ts`) enforce access — there isn't a
  single global `PermissionGuard`; authorization is composed per feature.

### Payments: Multi-Provider (Stripe + Paymob)

`src/features/payments/` is the most fully hexagonal feature: domain entities (`payment.entity.ts`,
`checkout-session.entity.ts`, `refund.entity.ts`), application ports/use-cases, and infrastructure
adapters per provider (`infrastructure/gateways/paymob/`, Stripe via `src/app/api/webhook/stripe`).
Key concerns already implemented: idempotent webhook processing, checkout locks (Redis),
reconciliation with backoff (`payment:reconcile*` scripts/workers), circuit breaker + retry for
Paymob HTTP calls, and pluggable metrics recorders / email senders behind ports.

### Prisma

- Schema at `prisma/schema.prisma`.
- Generated client outputs to `src/generated/prisma` (do not hand-edit; regenerate via
  `pnpm prisma:generate`, which also runs on `postinstall`).
- IDs are CUIDs (`@default(cuid())`); DB columns use `@map("snake_case")`, TypeScript stays
  camelCase.
- Prefer feature-scoped `*.select.ts` files for centralizing Prisma `select`/`include` shapes
  instead of inlining large selects in repositories.

### Background Jobs (BullMQ + Redis)

Workers live in `src/server/workers/` and are started as separate processes (`pnpm worker:*`):
order fulfillment, course knowledge indexing, AI cost aggregation, and payment reconciliation
(scheduler + consumer). Producers/publishers live inside each feature's
`infrastructure/queue/` folder.

### TypeScript Path Aliases

Defined in `tsconfig.json` (extends `configs/typescript/nextjs.json`):

- `@/*` -> `src/*`

Within `src/`, conventional top-level folders include `app/` (routes), `features/` (feature
modules), `ai-platform/` (shared AI module), `components/` (shared UI), `lib/` (cross-cutting
utilities: auth, prisma, stripe, redis), `config/` (env validation via `@t3-oss/env-nextjs`),
`server/` (workers, server-only services), `hooks/`, `store/` (Zustand), `validation/` (Zod
schemas), `types/`, `constants/`.

## Code Style

- **Prettier**: 80 char width (100 for JSON/Markdown), single quotes, trailing commas, semicolons,
  2-space indent, LF line endings. Config in `prettier.config.js`.
- **ESLint**: extends `eslint-config-next` (core-web-vitals + typescript). `no-explicit-any` is a
  warning, unused vars with `_` prefix are allowed, `no-console` warns except `console.warn` /
  `console.error`. Config in `eslint.config.mjs`.
- **Commits**: Conventional commits enforced by commitlint + husky. Types: `feat`, `fix`, `docs`,
  `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Header max 100 chars,
  lower-case type/scope, subject not sentence/start/pascal/upper-case and no trailing period.

## Environment

- Node >= 20, pnpm >= 10.
- `.env.example` documents all variables; env validation happens centrally in `src/config/env.ts`
  via `@t3-oss/env-nextjs` (fails fast on missing/invalid vars unless `SKIP_ENV_VALIDATION=true`).
- `PAYMOB_*` vars are optional — the Paymob gateway only registers when configured; Stripe is the
  default provider.
- `AI_PLATFORM_ENABLED` and `AI_TUTOR_ENABLED` gate the AI
  features; leave `false` unless working on AI Tutor / AI Platform.
- Default dev port: 3000.
