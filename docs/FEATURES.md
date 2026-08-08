# IthraCode — Product Features

> Arabic-first online learning platform for programming and web development.  
> This document catalogs all product features — what the platform does, who can use them, and their current status.

**Last updated:** July 2026

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [User Roles](#user-roles)
3. [Public & Marketing](#public--marketing)
4. [Authentication](#authentication)
5. [Course Catalog & Discovery](#course-catalog--discovery)
6. [Learning Paths](#learning-paths)
7. [Shopping Cart](#shopping-cart)
8. [Payments & Orders](#payments--orders)
9. [Student Learning Experience](#student-learning-experience)
10. [Instructor Features](#instructor-features)
11. [Admin Features](#admin-features)
12. [API Reference](#api-reference)
13. [System & Infrastructure](#system--infrastructure)
14. [Planned & Roadmap](#planned--roadmap)
15. [Role Access Matrix](#role-access-matrix)

---

## Platform Overview

IthraCode is a full-featured e-learning platform that enables students to discover, purchase, and complete programming courses. Instructors can create and manage course content, and administrators oversee the platform.

### Core User Journeys (Live Today)

| Journey | Flow |
|---|---|
| **Discover** | Browse courses or learning paths → view detail pages with curriculum, pricing, and testimonials |
| **Purchase** | Add to cart (guest or logged-in) → sign in if needed → checkout → payment → automatic enrollment |
| **Learn** | Open My Courses → select a course → watch lectures → navigate between lessons → track progress |
| **Create content** | Admin creates draft courses via dashboard; instructors create drafts via API |

---

## User Roles

| Role | Description |
|---|---|
| **Public / Guest** | Unauthenticated visitors; can browse catalog, use local cart, and sign in |
| **Student** | Default role for new accounts; can purchase courses, access enrolled content, and track progress |
| **Instructor** | Can create and manage own courses; sees own drafts in catalog |
| **Admin** | Full platform access including admin dashboard, course management, and payment operations |

---

## Public & Marketing

| Feature | Description | Status |
|---|---|---|
| Landing page | Brand introduction and call-to-action to course catalog | ✅ Live |
| Contact form | Submit inquiries via email and message | ✅ Live |
| API documentation | Interactive Swagger/OpenAPI docs at `/docs` | ✅ Live |
| SEO | Sitemap, robots.txt, meta tags, JSON-LD structured data | ✅ Live |
| Dark / light mode | Theme toggle across the application | ✅ Live |
| RTL Arabic interface | Full right-to-left layout support | ✅ Live |

### Routes

| Route | Page |
|---|---|
| `/` | Landing page |
| `/contact` | Contact form |
| `/docs` | API documentation |

---

## Authentication

| Feature | Description | Status |
|---|---|---|
| Google OAuth | Sign in with Google account | ✅ Live |
| GitHub OAuth | Sign in with GitHub account | ✅ Live |
| Session management | JWT-based sessions via NextAuth v5 with Prisma adapter | ✅ Live |
| Role-based redirects | Redirect to role-appropriate area after sign-in | ✅ Live |
| Guest cart sync | Merge localStorage cart into server cart on sign-in | ✅ Live |
| New user onboarding | Auto-assign STUDENT role on account creation | ✅ Live |
| Unauthorized page | Access denied landing at `/unauthorized` | ✅ Live |

### Routes

| Route | Page |
|---|---|
| `/auth/signin` | OAuth sign-in |
| `/unauthorized` | Access denied |

### Not Yet Implemented

- Email/password registration and login
- Forgot password / reset password
- Email verification
- Onboarding password setup (`/onboarding/set-password`)

---

## Course Catalog & Discovery

| Feature | Description | Status |
|---|---|---|
| Course catalog | Browse, search, filter, and sort courses | ✅ Live |
| Filters | By learning path, level, featured status | ✅ Live |
| Pagination | Paginated course listings | ✅ Live |
| Course detail page | Full course information and purchase CTA | ✅ Live |
| Course overview stats | Hours, lecture count, ratings, last updated | ✅ Live |
| Curriculum preview | Sections and lectures visible on detail page | ✅ Live |
| Course objectives | Learning goals listed on detail page | ✅ Live |
| Requirements | Prerequisites and requirements | ✅ Live |
| Target audience | Who the course is for | ✅ Live |
| Testimonials | Curated social proof on detail page | ✅ Live |
| Video preview | Preview video on course detail | ✅ Live |
| Add to cart | Add course to shopping cart | ✅ Live |
| Enrollment check | Enrolled users see "Go to course" instead of cart | ✅ Live |
| Course creation (API) | Create draft course shell with slug, path, track | ✅ Live |
| Course update (API) | Update course metadata | ✅ Live |
| Course archive (API) | Soft-archive course (status → ARCHIVED) | ✅ Live |
| Visibility control | PUBLIC / PRIVATE / UNLISTED visibility | ✅ Live |
| Status workflow | DRAFT / PUBLISHED / ARCHIVED / UNDER_REVIEW | ✅ Live |
| Role-based catalog filtering | Instructors see own drafts; admins see all | ✅ Live |

### Course Levels

`BEGINNER` · `INTERMEDIATE` · `ADVANCED` · `ALL_LEVELS`

### Routes

| Route | Page |
|---|---|
| `/courses` | Course catalog |
| `/courses/[slug]` | Course detail |

---

## Learning Paths

| Feature | Description | Status |
|---|---|---|
| Path catalog | List, search, filter, and sort learning paths | ✅ Live |
| Path detail page | Path description, tracks, and associated courses | ✅ Live |
| Downloadable resources | Resources linked from path detail | ✅ Live |
| Path admin actions | Create, update, delete paths (server actions) | ✅ Live |
| SEO | JSON-LD and metadata for paths | ✅ Live |

### Routes

| Route | Page |
|---|---|
| `/learning-paths` | Learning paths listing |
| `/learning-paths/[slug]` | Learning path detail |

---

## Shopping Cart

| Feature | Description | Status |
|---|---|---|
| Guest cart | localStorage-based cart for unauthenticated users | ✅ Live |
| Authenticated cart | Server-persisted cart per user | ✅ Live |
| Add to cart | Add a course; prevent duplicates | ✅ Live |
| Remove from cart | Remove a course from cart | ✅ Live |
| Clear cart | Remove all items | ✅ Live |
| Guest → auth sync | Stage and merge guest cart on sign-in | ✅ Live |
| Cart page | View items, subtotal, and checkout CTA | ✅ Live |
| Coupon input | Coupon code form on cart page | 🔶 UI only |
| Checkout button | Navigate to payment checkout | ✅ Live |

### Routes

| Route | Page |
|---|---|
| `/cart` | Shopping cart |

---

## Payments & Orders

| Feature | Description | Status |
|---|---|---|
| Checkout | Create order from cart and initiate payment | ✅ Live |
| Paymob checkout | Embedded Paymob Pixel payment form (primary provider) | ✅ Live |
| Stripe checkout | Stripe payment support | ✅ Live |
| PayPal support | Provider enum defined | 🔶 Schema only |
| Cash payments | Provider enum defined | 🔶 Schema only |
| Payment success page | Poll order status until completed; confirm enrollment | ✅ Live |
| Payment cancel page | Cancelled checkout landing | ✅ Live |
| Webhook processing | Paymob and Stripe webhooks with idempotent fulfillment | ✅ Live |
| Order fulfillment | On success: complete order, create enrollments, clear cart | ✅ Live |
| Post-order fulfillment | Confirmation email, invoice generation, analytics (async) | ✅ Live |
| Payment reconciliation | Poll provider for stuck payments; manual review queue | ✅ Live |
| Payment health check | DB, Redis, Paymob config, reconcile metrics | ✅ Live |
| Order lookup | Get order by ID with line items | ✅ Live |
| Async processing | BullMQ worker for payment jobs | ✅ Live |

### Supported Currencies

`EGP` (default) · `USD`

### Routes

| Route | Page |
|---|---|
| `/payment/checkout` | Checkout with payment embed |
| `/payment/success` | Payment confirmation |
| `/payment/cancel` | Payment cancelled |
| `/success` | Generic success page |

---

## Student Learning Experience

| Feature | Description | Status |
|---|---|---|
| My courses list | All enrolled courses with progress percentage | ✅ Live |
| Search & filters | Filter by track, category, progress state, instructor | ✅ Live |
| Sort | Sort by recent access | ✅ Live |
| Course learning layout | Full-screen study shell with sidebar and header | ✅ Live |
| Curriculum sidebar | Sections and lectures accordion with completion state | ✅ Live |
| Lecture player | Video playback with title and description | ✅ Live |
| Lecture navigation | Previous / next lecture buttons | ✅ Live |
| Progress tracking | Mark lecture complete or incomplete | ✅ Live |
| Overview tab | Lecture description and last updated date | ✅ Live |
| Q&A tab | Questions and answers panel | 🔶 UI shell |
| Notes tab | Personal notes panel | 🔶 UI shell |
| Announcements tab | Course announcements panel | 🔶 UI shell |
| Reviews tab | Course reviews panel | 🔶 UI shell |
| Learning tools tab | Additional learning resources panel | 🔶 UI shell |
| AI assistant tab | Course AI help chat CTA | 🔶 UI shell |
| Progress dashboard | Dedicated progress page | 🔶 Stub |

### Routes

| Route | Page |
|---|---|
| `/my-courses` | Enrolled courses library |
| `/my-courses/progress` | Progress dashboard (stub) |
| `/my-courses/[courseSlug]/lecture/[lectureId]` | Lecture study view |
| `/my-courses/[courseSlug]/learn/lecture/[lectureId]` | Alternate learn URL |

---

## Instructor Features

| Feature | Description | Status |
|---|---|---|
| Create course draft (API) | `POST /api/courses` — create draft with slug, path, track | ✅ Live |
| Archive own course (API) | `DELETE /api/courses/[idOrSlug]` — ownership check | ✅ Live |
| Own courses in catalog | Instructors see their drafts plus public courses | ✅ Live |
| Assigned as instructor | `instructorId` set on created courses | ✅ Live |
| Instructor dashboard | `/instructor` landing page | 🔶 Stub |
| Create course page | `/instructor/courses/create` | 🔶 Stub |
| Course authoring UI | Sections, lectures, pricing, publish workflow | 🔶 Partial |
| Consultation booking | Availability slots and 1:1 sessions | 📋 Planned |
| Google Calendar integration | Calendar sync for consultations | 📋 Planned |
| Earnings & payouts | Revenue share tracking per sale | 📋 Planned |
| Student management | View and manage enrolled students | 📋 Planned |
| Analytics dashboard | Course and revenue analytics | 📋 Planned |

### Routes (Defined)

| Route | Status |
|---|---|
| `/instructor` | Stub |
| `/instructor/courses/create` | Stub |
| `/instructor/dashboard` | Not built |
| `/instructor/courses` | Not built |
| `/instructor/students` | Not built |
| `/instructor/analytics` | Not built |

---

## Admin Features

| Feature | Description | Status |
|---|---|---|
| Admin dashboard | Welcome page with role check | ✅ Live |
| Create course | Form: select path and slug → create DRAFT course | ✅ Live |
| Update course | Update course metadata via server actions | ✅ Live |
| Delete course | Hard delete own courses | ✅ Live |
| Course goals page | `/admin/courses/[slug]/manage/goals` | 🔶 Stub |
| Payment reconciliation API | List manual-review payments; run/requeue reconciliation | ✅ Live |
| User management | Manage platform users | 📋 Planned |
| Platform analytics | Usage and revenue analytics | 📋 Planned |
| Platform settings | Global configuration | 📋 Planned |

### Routes

| Route | Page |
|---|---|
| `/admin` | Admin dashboard |
| `/admin/courses/new` | New course form |
| `/admin/courses/[slug]/manage/goals` | Course goals editor (stub) |

---

## API Reference

### Courses

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/courses` | GET | List course catalog | Public |
| `/api/courses` | POST | Create draft course | Instructor, Admin |
| `/api/courses/[idOrSlug]` | GET | Course detail | Public (visibility-filtered) |
| `/api/courses/[idOrSlug]` | PUT | Update course | Instructor (own), Admin |
| `/api/courses/[idOrSlug]` | DELETE | Archive course | Instructor (own), Admin |
| `/api/courses/[idOrSlug]/access` | GET | Check enrollment status | Student |
| `/api/courses/[idOrSlug]/overview` | GET | Course overview stats | Public |

### Learning Paths

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/paths` | GET | List learning paths | Public |
| `/api/paths/[slug]` | GET | Path detail | Public |

### Cart

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/cart` | GET | Get cart | Student |
| `/api/cart` | DELETE | Clear cart | Student |
| `/api/cart/items` | POST | Add item to cart | Student |
| `/api/cart/items/[courseId]` | DELETE | Remove item | Student |

### Payments & Orders

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/payment/checkout` | POST | Initiate checkout session | Student |
| `/api/payment/webhooks/paymob` | POST | Paymob webhook handler | System |
| `/api/webhook/stripe` | POST | Stripe webhook handler | System |
| `/api/orders/[id]` | GET | Order details | Authenticated |
| `/api/admin/payment/reconcile` | GET, POST | Payment reconciliation ops | Admin (secret) |
| `/api/health/payment` | GET | Payment subsystem health | Ops |
| `/api/health/tutor` | GET | AI Tutor / indexing health (DB, Redis, pgvector, queue metrics) | Ops |

### Auth & Docs

| Endpoint | Method | Description | Access |
|---|---|---|---|
| `/api/auth/[...nextauth]` | * | NextAuth handlers | Public |
| `/api/openapi` | GET | OpenAPI specification | Public |
| `/api/docs` | GET | API docs metadata | Public |

---

## System & Infrastructure

| Feature | Description | Status |
|---|---|---|
| PostgreSQL database | Primary data store via Prisma ORM | ✅ Live |
| Redis | Queue backend for BullMQ (Upstash) | ✅ Live |
| BullMQ workers | Async payment processing + course indexing workers | ✅ Live |
| AI Tutor indexing | Background knowledge indexing via `pnpm worker:course-indexing` | ✅ Live |
| Tutor health check | `GET /api/health/tutor` — DB, Redis, pgvector, queue metrics | ✅ Live |
| Bunny Stream | Video hosting and streaming | ✅ Live |
| Role-based access control | Route guards via proxy middleware | ✅ Live |
| Rate limiting | API rate limiting on sensitive endpoints | ✅ Live |
| Idempotent webhooks | Webhook event deduplication | ✅ Live |
| Payment outbox | Domain event outbox pattern | ✅ Live |
| Structured logging | Pino logger | ✅ Live |
| OpenAPI spec | Auto-generated API documentation | ✅ Live |

### Database Domain Models

#### Learning Content
- **Course** — Sellable learning product with pricing, visibility, SEO
- **Section** — Course chapter/module
- **Lecture** — Individual lesson (video, text, quiz, assignment, live session, etc.)
- **Video** — Bunny Stream video asset
- **VideoCollection** — Per-course Bunny collection
- **Attachment** — Downloadable lecture files (PDF, DOC, CODE, ZIP, etc.)
- **Path** — Top-level learning path
- **Track** — Sub-path within a learning path

#### Users & Auth
- **User** — Account with role, profile, security fields
- **Account** — OAuth provider linkage
- **Session** — NextAuth sessions
- **UserSession** — Extended session tracking (IP, user agent)
- **TrackedDevice** — Device fingerprinting and trust
- **TokenFamily** — Refresh token families
- **VerificationToken** — Email verification tokens

#### Enrollment & Progress
- **Enrollment** — Student ↔ course access grant
- **Progress** — Per-lecture completion and time spent

#### Commerce
- **Cart / CartItem** — Pre-purchase basket
- **Coupon / CouponCourse** — Discount codes
- **Order / OrderItem** — Purchase record
- **Payment** — Provider payment state
- **CheckoutSession** — Provider checkout session
- **Invoice** — PDF invoice storage
- **WebhookEvent** — Idempotent webhook log
- **PaymentReconcileAttempt** — Reconciliation audit trail
- **PaymentDomainOutbox** — Event outbox
- **PaymentDispute** — Chargeback tracking
- **Refund / RefundRequest** — Refund workflow
- **InstructorEarning** — Revenue share per sale

#### Social & Content
- **Review** — Course ratings and comments
- **Testimonial** — Curated social proof
- **Faq** — FAQ content

#### Consultations (Schema Only)
- **InstructorAvailability** — Bookable time slots
- **AvailabilityDateOverride** — Per-date schedule overrides
- **InstructorScheduleSettings** — Booking policies
- **ConsultationBooking** — Paid 1:1 sessions
- **GoogleCalendarToken** — Calendar sync for instructors

---

## Planned & Roadmap

Features defined in routes, schema, or UI shells but not yet fully implemented:

| Feature | Evidence |
|---|---|
| User profile & settings | `/profile/*`, `/settings` routes in constants |
| Certificates | `STUDENT_ROUTES.CERTIFICATES`, `certificateEnabled` on Course |
| Consultation booking | Full Prisma consultation models |
| Refund requests (student-facing) | `RefundRequest` model |
| Coupon redemption | Cart UI stub; Coupon model exists |
| Instructor earnings & payouts | `InstructorEarning` model |
| Functional Q&A, notes, announcements | Study view panels are UI shells |
| AI course assistant | Sidebar tab UI only |
| Wishlist & messages | `PUBLIC_ROUTES.WISHLIST`, `MESSAGES` |
| Email/password authentication | Only OAuth today |
| Purchase history page | Route constant exists |
| Orders list page | `/orders` in constants |
| About, privacy, terms, FAQ pages | Route constants exist |
| Lifetime access offering | Route constant exists |

### Status Legend

| Symbol | Meaning |
|---|---|
| ✅ Live | Fully implemented and functional |
| 🔶 Partial | UI shell, stub page, or schema-only |
| 📋 Planned | Defined in schema or constants, not yet built |

---

## Role Access Matrix

| Area | Public | Student | Instructor | Admin |
|---|---|---|---|---|
| Landing, contact, docs | ✅ | ✅ | ✅ | ✅ |
| Course/path catalog & detail | ✅ | ✅ | ✅ | ✅ |
| Cart (guest / local) | ✅ | — | — | — |
| Cart (server-persisted) | — | ✅ | — | — |
| Checkout & payment | — | ✅ | — | — |
| My courses & lecture player | — | ✅ | — | — |
| Create course (API) | — | — | ✅ | ✅ |
| Admin course UI | — | — | — | ✅ |
| Instructor dashboard | — | — | ✅ (stub) | — |
| Payment reconciliation API | — | — | — | ✅ |
| Consultations | — | — | 📋 | — |

### Auth Enforcement

- **Proxy middleware** (`src/proxy.ts`): `/admin/*` → Admin only; `/instructor/*` → Instructor only; `/student/*` → Student only
- **Page-level guards**: `/my-courses/*`, `/payment/*` require authentication
- **Public whitelist**: `/`, `/courses*`, `/cart`, `/docs`, `/learning-paths*`, `/contact`

---

## Feature Modules

The codebase is organized into feature modules under `src/features/`:

| Module | Responsibility |
|---|---|
| `home` | Marketing landing page |
| `auth` | Authentication and session management |
| `courses` | Course catalog, detail, creation, and management |
| `learning-paths` | Learning path catalog and detail |
| `cart` | Shopping cart (guest and authenticated) |
| `payments` | Checkout, webhooks, fulfillment, reconciliation |
| `my-courses` | Enrolled courses library and study view |
| `admin` | Admin dashboard and course management |
| `contact` | Public contact form |
| `user` | User utilities (role management) |

---

<p align="center">
  <em>IthraCode — Learn programming in Arabic</em>
</p>
