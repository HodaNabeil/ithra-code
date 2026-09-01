import { NextResponse } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { requireAdminSession, AdminAccessError } from '@/lib/admin/require-admin-session';
import { parseTestimonialSearchParams } from '@/features/testimonials/api/lib/testimonial-query';
import { getTestimonials } from '@/features/testimonials/api/use-cases/get-testimonials.use-case';
import { createTestimonialUseCase } from '@/features/testimonials/api/use-cases/create-testimonial.use-case';
import {
  TestimonialError,
  TestimonialValidationError,
} from '@/features/testimonials/api/errors/testimonial.errors';

/**
 * GET /api/testimonials
 *
 * Public endpoint to retrieve testimonials (admin-created + platform reviews with rating >= 4).
 * No authentication required.
 *
 * Query params:
 * - page: optional, default = 1, minimum = 1
 * - limit: optional, default = 10, minimum = 1, maximum = 50
 *
 * Returns unified list sorted by createdAt DESC with pagination.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    const query = parseTestimonialSearchParams({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const data = await getTestimonials(query);

    return apiSuccess(data, 'Testimonials retrieved successfully');
  } catch (error) {
    console.error('[TESTIMONIALS_GET_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}

/**
 * POST /api/testimonials
 *
 * Admin-only endpoint to create a new testimonial.
 * Requires admin authentication.
 *
 * Body:
 * - name: string (required)
 * - avatarUrl: string (optional)
 * - content: string (required, 10-1000 chars)
 * - rating: number (required, 1-5)
 * - isActive: boolean (optional, default true)
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireAdminSession();

    const body = await req.json();
    const result = await createTestimonialUseCase(body);

    return apiSuccess(result, 'Testimonial created successfully', 201);
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return apiError('Unauthorized', 401);
    }
    if (error instanceof TestimonialValidationError) {
      return apiError(error.message, error.status);
    }
    if (error instanceof TestimonialError) {
      return apiError(error.message, error.status);
    }

    console.error('[TESTIMONIALS_CREATE_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
