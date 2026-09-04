import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { z } from '@/lib/zod-openapi';

import { courseProgressSchema } from './openapi';

type ApiErrorSchema = z.ZodType;

type RegisterCourseProgressOpenApiDeps = {
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
  courseSlug: string;
};

const courseProgressExample = {
  totalLectures: 10,
  completedLectures: 5,
  completionPercentage: 50,
  totalTimeSpent: 3600,
  lastAccessedAt: '2026-06-01T10:00:00.000Z',
} as const;

const zeroProgressExample = {
  totalLectures: 10,
  completedLectures: 0,
  completionPercentage: 0,
  totalTimeSpent: 0,
  lastAccessedAt: null,
} as const;

const getCourseProgressDescription = [
  'Returns aggregated course progress for the **authenticated user**.',
  '',
  '**Authentication:** session cookie (`authjs.session-token`). Returns `401` when missing.',
  '**RBAC:** requires `progress:read`. Returns `403` when the role lacks permission.',
  '',
  '**Authorization (after RBAC):**',
  '- Resolves the course by CUID or slug.',
  '- Requires enrollment for `session.user.id` + course with status `ACTIVE` or `COMPLETED`.',
  '- `DROPPED` / `REVOKED` enrollments and missing enrollments return `404` (masked).',
  '',
  '**Progress metrics:**',
  '- `totalLectures` counts published lectures only.',
  '- `completedLectures`, `totalTimeSpent`, and `lastAccessedAt` are scoped to the same published lecture set.',
  '- Enrolled users with no progress records receive zeros and `lastAccessedAt: null` (`200`).',
].join('\n');

function buildGetResponses(deps: RegisterCourseProgressOpenApiDeps) {
  const GetCourseProgressSuccess = deps.registerApiSuccess(
    'GetCourseProgressSuccess',
    courseProgressSchema,
  );

  return {
    200: {
      description: 'Course progress retrieved successfully',
      content: {
        'application/json': {
          schema: GetCourseProgressSuccess,
          examples: {
            withProgress: {
              summary: 'User with partial progress',
              value: deps.apiSuccessExample(
                'تم جلب تقدم الدورة بنجاح',
                courseProgressExample,
              ),
            },
            noProgress: {
              summary: 'Enrolled but never started',
              value: deps.apiSuccessExample(
                'تم جلب تقدم الدورة بنجاح',
                zeroProgressExample,
              ),
            },
          },
        },
      },
    },
    400: {
      description: 'Invalid course identifier',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          example: deps.apiErrorExample,
        },
      },
    },
    401: {
      description: 'Unauthenticated',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          example: { success: false, message: 'Unauthorized' },
        },
      },
    },
    403: {
      description: 'Missing progress:read permission',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          example: { success: false, message: 'ليس لديك صلاحية' },
        },
      },
    },
    404: {
      description: 'Course not found or access denied',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          example: deps.apiErrorExample,
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
  };
}

export function registerCourseProgressOpenApi(
  registry: OpenAPIRegistry,
  deps: RegisterCourseProgressOpenApiDeps,
) {
  registry.register('CourseProgress', courseProgressSchema);

  const courseParams = z.object({
    idOrSlug: z.string().openapi({
      param: { name: 'idOrSlug', in: 'path' },
      example: deps.courseSlug,
      description: 'Course CUID or slug',
    }),
  });

  registry.registerPath({
    method: 'get',
    path: '/courses/{idOrSlug}/progress',
    tags: ['Courses'],
    operationId: 'getCourseProgress',
    summary: 'Get course progress',
    description: getCourseProgressDescription,
    security: deps.authenticated,
    request: {
      params: courseParams,
    },
    responses: buildGetResponses(deps),
  });
}
