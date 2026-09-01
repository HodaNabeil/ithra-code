import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import type { z } from '@/lib/zod-openapi';

import { enrollmentListQueryOpenApiSchema } from './validation/enrollment-list-query';
import {
  enrollmentCourseSchema,
  enrollmentListDataSchema,
  enrollmentListItemSchema,
  enrollmentListPaginationSchema,
  enrollmentObjectSchema,
  enrollmentProgressSchema,
  enrollmentPurchaseSchema,
  enrollmentReviewSchema,
} from './openapi';

type ApiErrorSchema = z.ZodType;

type RegisterEnrollmentsOpenApiDeps = {
  registerApiSuccess: <T extends z.ZodType>(
    name: string,
    dataSchema: T,
  ) => z.ZodType;
  apiSuccessExample: <T>(
    message: string,
    data: T,
  ) => {
    success: true;
    message: string;
    data: T;
  };
  ApiErrorSchema: ApiErrorSchema;
  apiErrorExample: { success: false; message: string };
  authenticated: Array<Record<string, string[]>>;
  courseExample: Record<string, unknown>;
  courseId: string;
};

export function registerEnrollmentsOpenApi(
  registry: OpenAPIRegistry,
  deps: RegisterEnrollmentsOpenApiDeps,
) {
  registry.register('Enrollment', enrollmentObjectSchema);
  registry.register('EnrollmentCourse', enrollmentCourseSchema);
  registry.register('EnrollmentReview', enrollmentReviewSchema);
  registry.register('EnrollmentProgress', enrollmentProgressSchema);
  registry.register('EnrollmentPurchaseSnapshot', enrollmentPurchaseSchema);
  registry.register('EnrollmentListItem', enrollmentListItemSchema);
  registry.register('EnrollmentListPagination', enrollmentListPaginationSchema);
  registry.register('EnrollmentListData', enrollmentListDataSchema);
  registry.register('EnrollmentListQuery', enrollmentListQueryOpenApiSchema);

  const enrollmentListExample = {
    courses: [
      {
        enrollment: {
          id: 'clenroll2k4m00008l5d6e3k1n',
          studentId: 'clstudent2k4m0008l5d6e3k1n',
          courseId: deps.courseId,
          status: 'ACTIVE' as const,
          enrolledAt: '2026-02-01T10:00:00.000Z',
          completedAt: null,
          createdAt: '2026-02-01T10:00:00.000Z',
          updatedAt: '2026-02-01T10:00:00.000Z',
        },
        course: {
          id: deps.courseExample.id,
          title: deps.courseExample.title,
          description: deps.courseExample.description,
          shortDescription: deps.courseExample.shortDescription,
          slug: deps.courseExample.slug,
          thumbnailUrl: deps.courseExample.thumbnailUrl,
          previewVideo: deps.courseExample.previewVideo,
          instructorId: deps.courseExample.instructorId,
          price: deps.courseExample.price,
          compareAtPrice: deps.courseExample.compareAtPrice,
          currency: deps.courseExample.currency,
          level: deps.courseExample.level,
          status: deps.courseExample.status,
          visibility: deps.courseExample.visibility,
          isFeatured: deps.courseExample.isFeatured,
          hours: 30,
          requirements: deps.courseExample.requirements,
          objectives: deps.courseExample.objectives,
          targetAudience: deps.courseExample.targetAudience,
          tags: deps.courseExample.tags,
          prerequisiteIds: [],
          prerequisites: [],
          firstLectureId: 'cllecture2k4m00008l5d6e3k1n',
          lecturesCount: 12,
          sections: [],
          metaTitle: null,
          metaDescription: null,
          certificateEnabled: true,
          maxStudents: null,
          pathId: deps.courseExample.pathId,
          createdAt: deps.courseExample.createdAt,
          updatedAt: deps.courseExample.updatedAt,
          publishedAt: deps.courseExample.publishedAt,
        },
        review: null,
        progress: {
          totalLectures: 12,
          completedLectures: 5,
          totalTimeSpent: 3600,
          completionPercentage: 41.67,
        },
        purchase: {
          orderItemId: 'clitem2k4m000008l5d6e3k1n',
          status: 'ACTIVE' as const,
          refundStatus: null,
          refundedAt: null,
        },
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 5,
      totalItems: 48,
      itemsPerPage: 10,
    },
  };

  registry.registerPath({
    method: 'get',
    path: '/enrollments',
    tags: ['Enrollments'],
    operationId: 'listEnrollments',
    summary: 'List the authenticated student enrollments',
    description: [
      'Returns enrolled courses for the **currently authenticated user**.',
      '',
      'Each item includes `enrollment`, `course`, `review`, `progress`, and `purchase`.',
      '',
      '**Authentication:** session cookie (`authjs.session-token`). `401` when missing.',
      '**Authorization:** requires `enrollment:read`. `403` when missing.',
      '',
      '**Status filter:** defaults to `ACTIVE` + `COMPLETED`. `DROPPED` and `REVOKED` are never returned.',
      '**Rejected query params:** `progressState`, `sortBy=lastAccessedAt`, `status=DROPPED`, `status=REVOKED`, `page < 1`, `limit < 1`, `limit > 100`.',
      '**Student scope:** `session.user.id` is always used. `userId` query param is ignored.',
      '',
      '**Example:**',
      '`GET /api/enrollments?status=ACTIVE&search=JavaScript&sortBy=enrolledAt&sortOrder=desc&page=1&limit=10`',
    ].join('\n'),
    security: deps.authenticated,
    request: {
      query: enrollmentListQueryOpenApiSchema,
    },
    responses: {
      200: {
        description: 'تم جلب التسجيلات بنجاح',
        content: {
          'application/json': {
            schema: deps.registerApiSuccess(
              'EnrollmentListResponse',
              enrollmentListDataSchema,
            ),
            example: deps.apiSuccessExample(
              'تم جلب التسجيلات بنجاح',
              enrollmentListExample,
            ),
          },
        },
      },
      400: {
        description: 'Invalid query parameters',
        content: {
          'application/json': {
            schema: deps.ApiErrorSchema,
            example: {
              success: false,
              message: 'حالة التسجيل غير صالحة',
            },
          },
        },
      },
      401: {
        description: 'Unauthorized - user not logged in',
        content: {
          'application/json': {
            schema: deps.ApiErrorSchema,
            example: { success: false, message: 'Unauthorized' },
          },
        },
      },
      403: {
        description: 'Forbidden - missing enrollment:read permission',
        content: {
          'application/json': {
            schema: deps.ApiErrorSchema,
            example: { success: false, message: 'ليس لديك صلاحية' },
          },
        },
      },
      500: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: deps.ApiErrorSchema,
            example: deps.apiErrorExample,
          },
        },
      },
    },
  });
}
