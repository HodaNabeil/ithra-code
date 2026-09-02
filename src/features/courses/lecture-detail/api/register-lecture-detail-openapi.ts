import type { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import { z } from '@/lib/zod-openapi';

import {
  getLectureResponseSchema,
  lectureDetailCourseApiSchema,
  lectureDetailDtoSchema,
} from './openapi';

type ApiErrorSchema = z.ZodType;

const lectureIdParams = z.object({
  lectureId: z.string().cuid().openapi({
    example: 'cllecture2k4m00008l5d6e3k1n',
    description: 'Lecture UUID (CUID)',
  }),
});

type RegisterLectureDetailOpenApiDeps = {
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
  courseExample: {
    id: string;
    instructorId: string;
    title: string;
    description: string;
    shortDescription: string | null;
    slug: string;
    thumbnailUrl: string;
    previewVideo: string | null;
    price: number;
    compareAtPrice: number | null;
    currency: 'USD';
    level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL_LEVELS';
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'UNDER_REVIEW';
    visibility: 'PUBLIC' | 'PRIVATE' | 'UNLISTED';
    isFeatured: boolean;
    requirements: string[];
    objectives: string[];
    targetAudience: string[];
    tags: string[];
    pathId: string;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
  };
};

export function registerLectureDetailOpenApi(
  registry: OpenAPIRegistry,
  deps: RegisterLectureDetailOpenApiDeps,
) {
  registry.register('LectureDetailDto', lectureDetailDtoSchema);
  registry.register('LectureDetailCourseApi', lectureDetailCourseApiSchema);
  registry.register('GetLectureData', getLectureResponseSchema);

  const lectureDetailExample = {
    id: 'cllecture2k4m00008l5d6e3k1n',
    sectionId: 'clsection2k4m00008l5d6e3k1n',
    title: 'مقدمة إلى Node.js',
    description:
      'في هذه المحاضرة سنتعرف على Node.js وكيفية استخدامه في بناء التطبيقات',
    type: 'VIDEO' as const,
    content: null,
    videoId: 'clvideo2k4m00008l5d6e3k1n',
    videoHlsUrl:
      'https://vz-xxxxx.b-cdn.net/a1b2c3d4-e5f6-7890-abcd-ef1234567890/playlist.m3u8?token=abc&expires=1234567890',
    position: 1,
    isPublished: true,
    isFree: false,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  };

  const getLectureExample = {
    lecture: lectureDetailExample,
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
      firstLectureId: undefined,
      lecturesCount: 0,
      sections: [],
      rating: 4.7,
      ratingCount: 128,
      metaTitle: null,
      metaDescription: null,
      certificateEnabled: true,
      maxStudents: null,
      pathId: deps.courseExample.pathId,
      createdAt: deps.courseExample.createdAt,
      updatedAt: deps.courseExample.updatedAt,
      publishedAt: deps.courseExample.publishedAt,
      isPurchased: true,
      isInCart: false,
    },
    hasPurchased: true,
    hasRated: false,
  };

  registry.registerPath({
    method: 'get',
    path: '/lectures/{lectureId}',
    tags: ['Lectures'],
    operationId: 'getLecture',
    summary: 'Get lecture details for the lecture player',
    description: [
      'Returns a single lecture with course metadata required by the lecture player.',
      '',
      '**Authentication:** session cookie (`authjs.session-token`). Returns `401` when missing.',
      '**RBAC:** requires `lecture:read`. Returns `403` when the role lacks permission.',
      '',
      '**Resource access (after RBAC):**',
      '- Admin and course instructor: full access; `hasPurchased = true`.',
      '- Free lecture (`isFree = true`): any authenticated user.',
      '- Paid lecture: requires enrollment with status `ACTIVE` or `COMPLETED`.',
      '- Missing or ineligible enrollment (`DROPPED`, `REVOKED`): `403`.',
      '',
      '**Publication masking:** unpublished course/lecture returns `404` for normal users to avoid leaking existence. Admin and owning instructor may access unpublished content.',
      '',
      '**Video:** `videoHlsUrl` is a signed Bunny Stream HLS URL when `type = VIDEO` and video status is `ready`; otherwise `null`. Signing failures are non-fatal and also return `null`.',
      '',
      '**User signals:** `hasPurchased` reflects enrollment/ownership; `hasRated` indicates whether the user already reviewed the course.',
      '',
      '**Note:** course payload is a lightweight projection (`sections: []`, `lecturesCount: 0`) — not the full curriculum tree.',
    ].join('\n'),
    security: deps.authenticated,
    request: {
      params: lectureIdParams,
    },
    responses: {
      200: {
        description: 'تم جلب المحاضرة بنجاح',
        content: {
          'application/json': {
            schema: deps.registerApiSuccess(
              'GetLectureResponse',
              getLectureResponseSchema,
            ),
            example: deps.apiSuccessExample(
              'تم جلب المحاضرة بنجاح',
              getLectureExample,
            ),
          },
        },
      },
      400: {
        description: 'Invalid lectureId (must be a CUID)',
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
        description:
          'Forbidden - missing lecture:read permission or paid lecture without eligible enrollment',
        content: {
          'application/json': {
            schema: deps.ApiErrorSchema,
            examples: {
              missingPermission: {
                summary: 'Missing RBAC permission',
                value: { success: false, message: 'ليس لديك صلاحية' },
              },
              purchaseRequired: {
                summary: 'Paid lecture without enrollment',
                value: {
                  success: false,
                  message: 'يجب شراء هذه الدورة للوصول إلى محاضراتها',
                },
              },
            },
          },
        },
      },
      404: {
        description:
          'Lecture not found, course unresolved, or hidden unpublished content',
        content: {
          'application/json': {
            schema: deps.ApiErrorSchema,
            examples: {
              lectureNotFound: {
                summary: 'Lecture not found',
                value: {
                  success: false,
                  message:
                    'المحاضرة ذات المعرف cllecture2k4m00008l5d6e3k1n غير موجودة',
                },
              },
              courseUnresolved: {
                summary: 'Course could not be resolved',
                value: {
                  success: false,
                  message: 'تعذر تحديد الدورة لهذه المحاضرة',
                },
              },
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
    },
  });
}
