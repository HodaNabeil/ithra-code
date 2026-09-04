# Deep Code Audit — GET `/api/courses/{courseIdOrSlug}/progress`

**Date:** 2026-09-04  
**Endpoint:** `GET /api/courses/{courseIdOrSlug}/progress`  
**Scope:** Verification audit (not a redesign)

---

## A. Executive Verdict

**PASS WITH MINOR ISSUES**

The implementation is **architecturally sound, secure against IDOR/BOLA, and satisfies the agreed business rules** for authentication, permissions, enrollment gating, ownership scoping, progress aggregation, and safe error masking. Core security and business logic are correctly placed in the handler and use case.

The issues found are **not blockers**, but they matter for completeness:

1. **Test gaps** — aggregation and repository behavior are largely mocked, not proven against real query logic.
2. **Publication filter ambiguity** — `totalLectures` uses `lecture.isPublished` only, while the student-facing course-sections API also filters `section.isPublished`. This matches lecture-progress completion logic, but not the full student content model.
3. **Minor timing side channel** — “course not found” (1 DB round-trip) vs “enrollment denied” (2 round-trips) may be distinguishable in theory.

No critical security or business-rule failures were found in the actual code.

---

## B. Business Rules Verification

| Rule | Status | Evidence | Risk |
|------|--------|----------|------|
| Authentication | **PASS** | `handleGetCourseProgressRequest` in `get-course-progress.handler.ts:19-23` calls `auth()` and returns `401` when `!session?.user?.id` | Unauthenticated access is blocked before use case runs |
| Permission | **PASS** | `get-course-progress.handler.ts:25-32` uses `hasPermission(..., Permission.PROGRESS_READ)` from `permissions.enum.ts` | Uses the app’s real RBAC system, not ad-hoc role checks |
| User ownership | **PASS** | Handler passes only `session.user.id` (`handler.ts:34-37`); use case calls `findEnrollment(input.userId, course.id)` (`get-course-progress.use-case.ts:56-58`); repo scopes by `enrollmentId` derived from that lookup (`course-progress.repository.ts:42-45`) | IDOR/BOLA protected — client cannot select another user |
| Course ID/slug | **PASS** | `PrismaCourseSectionsRepository.findCourseIdentity` uses `isCuid()` to choose `{ id }` vs `{ slug }` (`course-sections.repository.ts:53-55`) | Both identifiers resolve correctly |
| Enrollment status | **PASS** | `isProgressEligibleEnrollment` allows only `ACTIVE` / `COMPLETED` (`course-sections.repository.ts:44-47, 110-115`); use case denies otherwise (`get-course-progress.use-case.ts:61-67`) | `DROPPED` / `REVOKED` / missing enrollment are denied |
| No progress behavior | **PASS** | Use case always calls repo after valid enrollment (`use-case.ts:69`); repo returns zeros + `lastAccessedAt: null` when no progress rows match (`repository.ts:32-39`, `64-70`) | Enrolled-but-never-started users get `200`, not `404` |
| Published lectures | **PASS WITH NOTE** | `lecture.findMany({ isPublished: true, section: { courseId } })` (`repository.ts:21-27`); all aggregates filter `lectureId: { in: publishedLectureIds }` | Consistent lecture set; **does not filter `section.isPublished`** (see D) |
| Completion percentage | **PASS** | `computeCompletionPercentage(completedLectures, totalLectures)` (`repository.ts:65-68`, `progress-stats.ts:9-18`) | Returns `0` when `totalLectures = 0`; math keeps `<= 100` when filters are consistent |
| Time spent | **PASS** | `prisma.progress.aggregate({ _sum: { timeSpent } })` scoped to `enrollmentId` + published lecture IDs (`repository.ts:54-57`) | Correct aggregation, user-scoped via enrollment |
| Last accessed | **PASS** | `prisma.progress.aggregate({ _max: { lastAccessedAt } })` on same scope (`repository.ts:57, 69-70`) | Returns `null` when no records; not fabricated |

---

## C. Security Findings

### Finding 1 — Timing side channel between “course missing” and “enrollment denied”

```text
Issue: Enrollment-denied path performs more DB work than course-not-found path
Severity: Low
Exact file: src/features/courses/course-progress/use-cases/get-course-progress.use-case.ts
Exact function: getCourseProgress
Why it is a problem: Course-not-found returns after 1 query; enrollment-denied returns after 2 queries
Attack scenario: A patient attacker might infer course existence from response latency
Required correction: Optional — unify query count or add constant-time path; not required for MVP
Does it change business behavior?: No
```

### Finding 2 — Repository does not re-verify enrollment ownership

```text
Issue: findStatsByEnrollment(enrollmentId, courseId) trusts enrollmentId without DB join to course/user
Severity: Low (defense-in-depth only)
Exact file: src/features/courses/course-progress/repository/course-progress.repository.ts
Exact function: findStatsByEnrollment
Why it is a problem: If a future caller passed a wrong enrollmentId, repo would still aggregate
Attack scenario: Not exploitable today — only the use case calls this, with enrollment from findEnrollment(userId, courseId)
Required correction: Optional JOIN/where on enrollment.studentId + enrollment.courseId
Does it change business behavior?: No
```

**No critical security findings.**

Verified secure behaviors:

- **No `userId` from client** — `_req` is unused; handler never reads query/body/headers for identity.
- **IDOR/BOLA** — enrollment resolved via composite unique `(studentId, courseId)` (`schema.prisma:491`, `course-sections.repository.ts:79-84`).
- **Cross-user isolation** — progress keyed to enrollment derived from authenticated user only.
- **Error leakage** — client gets `{ success: false, message }` only (`api-response.ts:22-27`); Prisma/stack traces go to server logs only (`handler.ts:45`).
- **Info disclosure** — missing course and denied enrollment both return `404` + `courseNotFoundMessage(courseIdOrSlug)` (`use-case.ts:48-66`); error `code` is not exposed in HTTP body.

---

## D. Business-Rule Findings

### Finding 1 — `section.isPublished` not included in lecture set

```text
Current behavior:
  totalLectures counts lectures where lecture.isPublished = true,
  regardless of section.isPublished (repository.ts:21-27)

Expected behavior (ambiguous in app):
  Student course content in getCourseSections uses BOTH section.isPublished
  AND lecture.isPublished when publishedOnly = true (course-sections.select.ts:65-78)

Evidence:
  - course-progress.repository.ts:21-27
  - lecture-progress.repository.ts:171-177 (same lecture-only filter)
  - course-sections.select.ts:72-78 (section + lecture filter)

Impact:
  A published lecture inside an unpublished section could be counted in progress
  but hidden from the course-sections UI. Denominator may be slightly inflated.

Correction:
  Add section: { courseId, isPublished: true } to published lecture query
  IF product intent is to match student-visible content exactly.

  Smallest safe fix:
    where: { isPublished: true, section: { courseId, isPublished: true } }
```

**Assessment:** Minor inconsistency, not a security bug. The implementation follows the **lecture-progress completion** convention. It does **not** fully match the **course-sections student view** convention.

### Finding 2 — No course visibility/status check beyond enrollment

```text
Current behavior:
  Any user with ACTIVE/COMPLETED enrollment can read progress,
  regardless of Course.status or Course.visibility

Expected behavior (per spec):
  "Having valid enrollment + permission + auth → allows access"

Evidence:
  get-course-progress.use-case.ts has no assertCourseVisible / status check

Impact:
  Edge case only — e.g. enrollment on DRAFT/PRIVATE course still returns progress.
  Consistent with the written spec rule.

Correction:
  None required unless product policy changes.
```

### Finding 3 — Percentage uses 2-decimal rounding

```text
Current behavior:
  Math.round((completed / total) * 10000) / 100 (progress-stats.ts:17)

Expected behavior:
  (completedLectures / totalLectures) * 100

Impact:
  e.g. 1/3 → 33.33, not 33.3333. Acceptable and consistent with enrollments feature.

Correction:
  None required.
```

---

## E. Performance Findings

### Current query behavior (per request)

1. `course.findUnique` — identity lookup
2. `enrollment.findUnique` — by `(studentId, courseId)`
3. `lecture.findMany` — published lectures for course
4. `progress.count` + `progress.aggregate` — in parallel (`repository.ts:47-59`)

**Assessment:** Efficient and correctly scoped. No N+1, no full progress table load, no duplicate course/enrollment lookups.

### Indexes (schema)

- `Enrollment`: `@@unique([studentId, courseId])`, indexes on `studentId`, `courseId`, `status`
- `Progress`: `@@index([enrollmentId])`, `@@index([lectureId])`
- `Lecture`: `@@index([isPublished])`

These support the access pattern adequately. No confirmed performance defect.

### Optional optimization (not required)

Combine steps 3–4 with a subquery/join to avoid loading lecture IDs into memory for very large courses. **Risk of changing behavior** if done incorrectly; current approach is clear and correct.

---

## F. Test Coverage Gaps

**24 tests exist** (`get-course-progress-api.route.test.ts` + `get-course-progress.use-case.test.ts`). **No repository tests. No integration tests.**

| Requirement | Covered? | Gap |
|-------------|----------|-----|
| 401 unauthenticated | Yes | Route test |
| 403 missing permission | Yes | Route test |
| userId from session only | Yes | Route test |
| Error mapping | Yes | Route + route 500 test |
| Course slug / ID resolution | Partial | Use case verifies `findCourseIdentity` call, not real `isCuid` path |
| Missing course → 404 | Yes | Use case |
| ACTIVE / COMPLETED | Yes | Use case |
| DROPPED / REVOKED / no enrollment | Yes | Use case |
| Safe 404 masking | Yes | Use case |
| Cross-user isolation | Yes | Use case (mock-based) |
| No progress → 200 zeros | Partial | Route mocks use case; use case mocks repo |
| **Actual aggregation math** | **No** | Tests mock repo return values |
| **Published lecture filter** | **No** | No test proves `isPublished` / `section.courseId` filters |
| **completedLectures <= totalLectures** | **No** | Test uses pre-baked mock where relation already holds |
| **Repository query correctness** | **No** | Entire `PrismaCourseProgressRepository` untested |
| **Integration / DB-level** | **No** | Needed to prove aggregation against real data |

### Tests that should be added

1. **Repository unit/integration test** — seed published/unpublished lectures + progress; assert:
   - `totalLectures` counts only `isPublished: true`
   - `completedLectures` counts only completed published lectures
   - progress on unpublished lectures excluded from all fields
   - zero-progress enrolled user returns correct shape

2. **Repository test for `section.isPublished`** — if product decides sections matter

3. **`computeCompletionPercentage` integration** — via repository test: 5/10 → 50, 0/0 → 0

4. **Handler integration test** — optional; call handler with mocked auth but real use case + test DB

5. **Route test for 400** — invalid empty `courseIdOrSlug` through full stack (currently only use-case level)

> **Important:** Tests like “returns 50% when 5 of 10 completed” (`use-case.test.ts:188-210`) only assert mocked return values. They do **not** prove calculation correctness.

---

## G. Architecture Audit

| Layer | Assessment |
|-------|------------|
| Route (`route.ts`) | Thin — delegates only |
| Handler | Auth + `PROGRESS_READ` + HTTP mapping |
| Use case | Validation, course resolve, enrollment gate, orchestration |
| Repository | Prisma only, no business rules beyond aggregation scope |
| DTO | Plain TypeScript type — consistent with other features |
| Errors | `CourseProgressError` — same pattern as `LectureProgressError` |

**PASS** — responsibilities are correctly separated. No Prisma in route/handler; no auth bypass in use case when called from handler.

---

## H. Visibility and Publication Audit

| Concept | Schema | Used in progress API? |
|---------|--------|----------------------|
| `Course.status` | `DRAFT`, `PUBLISHED`, etc. | No — enrollment-only gate |
| `Course.visibility` | `PUBLIC`, `PRIVATE`, `UNLISTED` | No |
| `Section.isPublished` | Boolean | **No** |
| `Lecture.isPublished` | Boolean | **Yes** |

**Conclusion:** Per the spec (“valid enrollment grants access”), the implementation is **correct**. The only open question is whether the **lecture set** should also require `section.isPublished`, matching student-facing sections API.

---

## I. Final Recommendation

**Minor corrections recommended** — not a rewrite.

Priority:

1. **Add repository tests** (highest value) — current tests do not prove DB correctness.
2. **Clarify/fix `section.isPublished` filtering** if product wants parity with course-sections student view.
3. Optional defense-in-depth in repository (enrollment ownership join).

Security corrections: **not required** for the current threat model.

---

## J. Final Answer

> Does this implementation correctly reproduce the agreed business rules while fixing the security and implementation issues we identified?

**Yes, with minor caveats.**

It correctly implements:

- Authentication (`401`)
- `PROGRESS_READ` permission (`403`)
- User ownership via `session.user.id` only
- Course ID + slug resolution
- Enrollment status gating (`ACTIVE` / `COMPLETED` only)
- `200` for enrolled users with no progress
- Scoped aggregation preventing `completedLectures > totalLectures`
- Safe `404` masking for unauthorized access
- Clean architecture matching the application

**Exact changes recommended (smallest safe fixes):**

| # | Change | Required? |
|---|--------|-------------|
| 1 | Add `PrismaCourseProgressRepository` tests proving aggregation filters | **Yes** — tests currently over-mock |
| 2 | Decide whether to add `section.isPublished: true` to published lecture query | **Product decision** — only if parity with course-sections is required |
| 3 | Optional enrollment ownership join in repository | No — defense in depth only |

**No code changes are required for core security or spec compliance.** The implementation is safe to ship; add repository tests before treating aggregation behavior as fully verified.

---

## Files Inspected

| Path | Role |
|------|------|
| `src/app/api/courses/[idOrSlug]/progress/route.ts` | Thin route |
| `src/features/courses/course-progress/api/get-course-progress.handler.ts` | Auth, permission, HTTP mapping |
| `src/features/courses/course-progress/use-cases/get-course-progress.use-case.ts` | Business rules |
| `src/features/courses/course-progress/repository/course-progress.repository.ts` | DB aggregation |
| `src/features/courses/course-progress/dto/course-progress.dto.ts` | Response shape |
| `src/features/courses/course-progress/errors/course-progress.errors.ts` | Domain errors |
| `src/features/courses/course-progress/validation/course-progress.validation.ts` | Param validation |
| `src/features/courses/course-sections/repository/course-sections.repository.ts` | Course + enrollment lookup |
| `src/constants/permissions.enum.ts` | `PROGRESS_READ` definition |
| `src/features/enrollments/application/lib/progress-stats.ts` | Percentage helper |
| `prisma/schema.prisma` | `Enrollment`, `Progress`, `EnrollmentStatus` |
| `tests/unit/get-course-progress-api.route.test.ts` | Route tests (7) |
| `tests/unit/get-course-progress.use-case.test.ts` | Use-case tests (17) |
