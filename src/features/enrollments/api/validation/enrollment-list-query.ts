import { z } from '@/lib/zod-openapi';

import {
  ENROLLMENT_LIST_SORT_BY,
  ENROLLMENT_LIST_SORT_ORDER,
  ENROLLMENT_LIST_STATUS,
  ENROLLMENTS_DEFAULT_LIMIT,
  ENROLLMENTS_DEFAULT_PAGE,
  ENROLLMENTS_MAX_LIMIT,
} from '../../application/constants';
import type { EnrollmentListQuery } from '../../application/dto/enrollment-list.dto';
import { EnrollmentValidationError } from '../../application/errors/enrollment.errors';

export type EnrollmentListQueryInput = {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  progressState?: string;
};

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
): number | null {
  if (raw === undefined || raw === '') {
    return fallback;
  }

  if (!/^\d+$/.test(raw)) {
    return null;
  }

  return Number(raw);
}

function rejectProgressStateParam(progressState: string | undefined): void {
  if (progressState !== undefined && progressState.trim() !== '') {
    throw new EnrollmentValidationError('حالة التقدم غير صالحة');
  }
}

export const enrollmentListQueryOpenApiSchema = z.object({
  page: z.string().optional().openapi({
    example: '1',
    description: 'Page number (1-based). Defaults to 1.',
  }),
  limit: z
    .string()
    .optional()
    .openapi({
      example: '10',
      description: `Items per page (1–${ENROLLMENTS_MAX_LIMIT}). Defaults to ${ENROLLMENTS_DEFAULT_LIMIT}.`,
    }),
  search: z.string().optional().openapi({
    example: 'JavaScript',
    description: 'Case-insensitive substring match against course title.',
  }),
  sortBy: z.enum(ENROLLMENT_LIST_SORT_BY).optional().openapi({
    example: 'enrolledAt',
    description: 'Sort field. Defaults to enrolledAt.',
  }),
  sortOrder: z.enum(ENROLLMENT_LIST_SORT_ORDER).optional().openapi({
    example: 'desc',
    description: 'Sort direction. Defaults to desc.',
  }),
  status: z.enum(ENROLLMENT_LIST_STATUS).optional().openapi({
    example: 'ACTIVE',
    description:
      'Filter by enrollment status. Defaults to ACTIVE and COMPLETED. DROPPED and REVOKED are never returned.',
  }),
});

export function parseEnrollmentListQuery(
  input: EnrollmentListQueryInput,
): EnrollmentListQuery {
  rejectProgressStateParam(input.progressState);

  const page = parsePositiveInt(input.page, ENROLLMENTS_DEFAULT_PAGE);
  if (page === null || page < 1) {
    throw new EnrollmentValidationError(
      'رقم الصفحة يجب أن يكون عدداً صحيحاً أكبر من أو يساوي 1',
    );
  }

  const limit = parsePositiveInt(input.limit, ENROLLMENTS_DEFAULT_LIMIT);
  if (limit === null || limit < 1 || limit > ENROLLMENTS_MAX_LIMIT) {
    throw new EnrollmentValidationError('عدد العناصر يجب أن يكون بين 1 و 100');
  }

  const sortBy = input.sortBy?.trim() || 'enrolledAt';
  if (!ENROLLMENT_LIST_SORT_BY.includes(sortBy as (typeof ENROLLMENT_LIST_SORT_BY)[number])) {
    throw new EnrollmentValidationError('قيمة الترتيب غير صالحة');
  }

  const sortOrder = input.sortOrder?.trim() || 'desc';
  if (
    sortOrder !== ENROLLMENT_LIST_SORT_ORDER[0] &&
    sortOrder !== ENROLLMENT_LIST_SORT_ORDER[1]
  ) {
    throw new EnrollmentValidationError('اتجاه الترتيب غير صالح');
  }

  const statusRaw = input.status?.trim();
  let status: EnrollmentListQuery['status'];
  if (statusRaw) {
    if (
      statusRaw !== ENROLLMENT_LIST_STATUS[0] &&
      statusRaw !== ENROLLMENT_LIST_STATUS[1]
    ) {
      throw new EnrollmentValidationError('حالة التسجيل غير صالحة');
    }
    status = statusRaw;
  }

  const search = input.search?.trim() || undefined;

  return {
    page,
    limit,
    search,
    sortBy: sortBy as EnrollmentListQuery['sortBy'],
    sortOrder,
    status,
  };
}

export function parseEnrollmentListQueryFromSearchParams(
  searchParams: URLSearchParams,
): EnrollmentListQuery {
  return parseEnrollmentListQuery({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    sortBy: searchParams.get('sortBy') ?? undefined,
    sortOrder: searchParams.get('sortOrder') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    progressState: searchParams.get('progressState') ?? undefined,
  });
}
