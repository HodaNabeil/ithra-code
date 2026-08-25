import { NextResponse } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import {
  requireAdminSession,
  AdminAccessError,
} from '@/lib/admin/require-admin-session';
import { updateTestimonialUseCase } from '@/features/testimonials/api/use-cases/update-testimonial.use-case';
import { deleteTestimonialUseCase } from '@/features/testimonials/api/use-cases/delete-testimonial.use-case';
import {
  TestimonialError,
  TestimonialNotFoundError,
  TestimonialValidationError,
} from '@/features/testimonials/api/errors/testimonial.errors';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * PATCH /api/testimonials/:id
 *
 * Admin-only endpoint to update an existing testimonial.
 * Requires admin authentication.
 *
 * Body (all fields optional):
 * - name: string
 * - avatarUrl: string
 * - content: string (10-1000 chars)
 * - rating: number (1-5)
 * - isActive: boolean
 */
export async function PATCH(
  req: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    await requireAdminSession();

    const { id } = await context.params;
    const body = await req.json();

    const result = await updateTestimonialUseCase(id, body);

    return apiSuccess(result, 'Testimonial updated successfully');
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return apiError('Unauthorized', 401);
    }
    if (error instanceof TestimonialNotFoundError) {
      return apiError(error.message, error.status);
    }
    if (error instanceof TestimonialValidationError) {
      return apiError(error.message, error.status);
    }
    if (error instanceof TestimonialError) {
      return apiError(error.message, error.status);
    }

    console.error('[TESTIMONIALS_UPDATE_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}

/**
 * DELETE /api/testimonials/:id
 *
 * Admin-only endpoint to delete a testimonial.
 * Requires admin authentication.
 */
export async function DELETE(
  _req: Request,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    await requireAdminSession();

    const { id } = await context.params;

    await deleteTestimonialUseCase(id);

    return apiSuccess({ id }, 'Testimonial deleted successfully');
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return apiError('Unauthorized', 401);
    }
    if (error instanceof TestimonialNotFoundError) {
      return apiError(error.message, error.status);
    }
    if (error instanceof TestimonialError) {
      return apiError(error.message, error.status);
    }

    console.error('[TESTIMONIALS_DELETE_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
