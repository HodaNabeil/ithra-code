import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { z } from '@/lib/zod-openapi';

import {
  getLectureProgressDataSchema,
  progressRecordSchema,
  updateLectureProgressBodyOpenApiSchema,
  updateLectureProgressDataSchema,
} from './openapi';

type ApiErrorSchema = z.ZodType;

type RegisterLectureProgressOpenApiDeps = {
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
  lectureId: string;
};

const progressRecordExample = {
  id: 'clprogress2k4m00008l5d6e3k1n',
  enrollmentId: 'clenroll2k4m00008l5d6e3k1n',
  lectureId: 'cllecture2k4m00008l5d6e3k1n',
  isCompleted: false,
  completedAt: null,
  lastAccessedAt: '2026-06-01T10:00:00.000Z',
  timeSpent: 330,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
};

const updateProgressDescription = [
  'Upserts lecture progress for the **authenticated student**.',
  '',
  '**Authentication:** session cookie (`authjs.session-token`). Returns `401` when missing.',
  '**RBAC:** requires `progress:update`. Returns `403` when the role lacks permission.',
  '',
  '**Authorization (after RBAC):**',
  '- Resolves the lecture’s actual course from `lectureId` (not from the URL alone).',
  '- The URL course identifier must match the lecture’s course; otherwise returns `404`.',
  '- Requires enrollment for `session.user.id` + lecture course with status `ACTIVE` or `COMPLETED`.',
  '- `DROPPED` / `REVOKED` enrollments return `403`.',
  '',
  '**Body:**',
  '- `incrementTime` is **additive** (seconds to add to `timeSpent`), not an absolute value.',
  '- Unknown fields are rejected (`400`). `userId`, `enrollmentId`, and `studentId` are not accepted.',
  '- Empty body `{}` is valid (`incrementTime = 0`, `isCompleted = false`) and still updates `lastAccessedAt`.',
  '',
  '**Completion:**',
  '- `isCompleted: true` sets `completedAt` to now.',
  '- Already-completed progress is immutable; further updates return `409`.',
  '- When all **published** lectures are completed, enrollment status becomes `COMPLETED` atomically.',
  '',
  '**Time cap:** when the lecture has a video duration, `timeSpent` is capped at `ceil(duration * 1.1)`. Excess `incrementTime` is silently reduced.',
].join('\n');

const getProgressDescription = [
  'Returns lecture progress for the **authenticated user’s enrollment**.',
  '',
  '**Authentication:** session cookie (`authjs.session-token`). Returns `401` when missing.',
  '**RBAC:** requires `progress:read`. Returns `403` when the role lacks permission.',
  '',
  '**Authorization (after RBAC):**',
  '- Resolves the lecture’s actual course from `lectureId` (not from the URL alone).',
  '- The URL course identifier must match the lecture’s course; otherwise returns `404`.',
  '- Requires enrollment for `session.user.id` + lecture course with status `ACTIVE` or `COMPLETED`.',
  '- Missing or ineligible enrollment (`DROPPED` / `REVOKED`) returns `404` (masked as lecture not found) to reduce lecture-ID probing.',
  '',
  '**Read-only:** does not create, update, or mutate progress or enrollment.',
  '',
  '**Missing progress:** returns `200` with `progress: null` when the user is authorized but has not started tracking the lecture yet.',
  '',
  '**Visibility:** no publish-state gate for enrolled users (consistent with PATCH progress writes).',
  '',
  '**Scope:** returns only the authenticated user’s own progress; no instructor/admin analytics bypass.',
].join('\n');

function buildUpdateResponses(deps: RegisterLectureProgressOpenApiDeps) {
  return {
    200: {
      description: 'تم تحديث تقدم المحاضرة بنجاح',
      content: {
        'application/json': {
          schema: deps.registerApiSuccess(
            'UpdateLectureProgressResponse',
            updateLectureProgressDataSchema,
          ),
          example: deps.apiSuccessExample('تم تحديث تقدم المحاضرة بنجاح', {
            progress: progressRecordExample,
          }),
        },
      },
    },
    400: {
      description:
        'Invalid lectureId, invalid body, negative/decimal incrementTime, or unknown fields',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          examples: {
            invalidLectureId: {
              summary: 'Invalid lectureId CUID',
              value: {
                success: false,
                message: 'تنسيق المعرف غير صالح: "invalid-id"',
              },
            },
            unknownField: {
              summary: 'Unknown body field',
              value: {
                success: false,
                message: 'Unrecognized key(s) in object: \'timeSpent\'',
              },
            },
            negativeIncrement: {
              summary: 'Negative incrementTime',
              value: {
                success: false,
                message: 'Number must be greater than or equal to 0',
              },
            },
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
      description:
        'Forbidden - missing progress:update permission or ineligible/missing enrollment',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          examples: {
            missingPermission: {
              summary: 'Missing RBAC permission',
              value: { success: false, message: 'ليس لديك صلاحية' },
            },
            notEnrolled: {
              summary: 'Not enrolled or ineligible status',
              value: {
                success: false,
                message: 'أنت غير مسجل في هذا الكورس',
              },
            },
          },
        },
      },
    },
    404: {
      description:
        'Lecture not found, or URL course does not match the lecture’s actual course',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          example: {
            success: false,
            message:
              'المحاضرة ذات المعرف cllecture2k4m00008l5d6e3k1n غير موجودة',
          },
        },
      },
    },
    409: {
      description: 'Lecture progress is already completed',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          example: {
            success: false,
            message: 'تم إكمال هذه المحاضرة مسبقاً',
          },
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

function buildGetResponses(deps: RegisterLectureProgressOpenApiDeps) {
  return {
    200: {
      description: 'تم جلب تقدم المحاضرة بنجاح',
      content: {
        'application/json': {
          schema: deps.registerApiSuccess(
            'GetLectureProgressResponse',
            getLectureProgressDataSchema,
          ),
          examples: {
            withProgress: {
              summary: 'Progress record exists',
              value: deps.apiSuccessExample('تم جلب تقدم المحاضرة بنجاح', {
                progress: progressRecordExample,
              }),
            },
            noProgress: {
              summary: 'No progress yet',
              value: deps.apiSuccessExample('تم جلب تقدم المحاضرة بنجاح', {
                progress: null,
              }),
            },
          },
        },
      },
    },
    400: {
      description: 'Invalid lectureId CUID or course identifier',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          example: {
            success: false,
            message: 'تنسيق المعرف غير صالح: "invalid-id"',
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
      description: 'Forbidden - missing progress:read permission',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          example: { success: false, message: 'ليس لديك صلاحية' },
        },
      },
    },
    404: {
      description:
        'Lecture not found, URL course mismatch, or missing/ineligible enrollment (masked)',
      content: {
        'application/json': {
          schema: deps.ApiErrorSchema,
          example: {
            success: false,
            message:
              'المحاضرة ذات المعرف cllecture2k4m00008l5d6e3k1n غير موجودة',
          },
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

export function registerLectureProgressOpenApi(
  registry: OpenAPIRegistry,
  deps: RegisterLectureProgressOpenApiDeps,
) {
  registry.register('ProgressRecord', progressRecordSchema);
  registry.register(
    'UpdateLectureProgressBody',
    updateLectureProgressBodyOpenApiSchema,
  );
  registry.register(
    'UpdateLectureProgressData',
    updateLectureProgressDataSchema,
  );
  registry.register('GetLectureProgressData', getLectureProgressDataSchema);

  const courseParams = z.object({
    idOrSlug: z.string().openapi({
      param: { name: 'idOrSlug', in: 'path' },
      example: deps.courseSlug,
      description: 'Course CUID or slug (must match the lecture’s course)',
    }),
    lectureId: z.string().cuid().openapi({
      param: { name: 'lectureId', in: 'path' },
      example: deps.lectureId,
      description: 'Lecture CUID',
    }),
  });

  const updateResponses = buildUpdateResponses(deps);
  const getResponses = buildGetResponses(deps);

  registry.registerPath({
    method: 'get',
    path: '/courses/{idOrSlug}/lectures/{lectureId}/progress',
    tags: ['Courses'],
    operationId: 'getLectureProgress',
    summary: 'Get lecture progress',
    description: getProgressDescription,
    security: deps.authenticated,
    request: {
      params: courseParams,
    },
    responses: getResponses,
  });

  registry.registerPath({
    method: 'patch',
    path: '/courses/{idOrSlug}/lectures/{lectureId}/progress',
    tags: ['Courses'],
    operationId: 'updateLectureProgress',
    summary: 'Update lecture progress',
    description: updateProgressDescription,
    security: deps.authenticated,
    request: {
      params: courseParams,
      body: {
        required: false,
        content: {
          'application/json': {
            schema: updateLectureProgressBodyOpenApiSchema,
            examples: {
              heartbeat: {
                summary: 'Heartbeat / last accessed only',
                value: {},
              },
              incrementTime: {
                summary: 'Add watch time',
                value: { incrementTime: 30 },
              },
              complete: {
                summary: 'Mark lecture complete',
                value: { isCompleted: true, incrementTime: 0 },
              },
            },
          },
        },
      },
    },
    responses: updateResponses,
  });
}
