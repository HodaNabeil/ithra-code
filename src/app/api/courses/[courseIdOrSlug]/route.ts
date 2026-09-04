import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import { Course, Prisma } from '@prisma/client';
import {
  CourseDetailError,
  getCourseDetail,
} from '@/features/courses/course-detail';
import { ArchiveCourseError } from '@/features/courses/errors/archive-course.errors';
import { CourseAuthorizationError } from '@/features/courses/errors/course-authorization.errors';
import { archiveCourseUseCase } from '@/features/courses/use-cases/archive-course.use-case';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseIdOrSlug: string }> },
): Promise<NextResponse> {
  const { courseIdOrSlug } = await params;

  try {
    const session = await auth();
    const course = await getCourseDetail({
      courseIdOrSlug,
      user: session?.user?.id
        ? { id: session.user.id, role: session.user.role }
        : null,
    });

    return apiSuccess({ course }, 'تم جلب الدورة بنجاح');
  } catch (error) {
    if (error instanceof CourseDetailError) {
      return apiError(error.message, error.status);
    }

    console.error('[COURSE_DETAIL_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseIdOrSlug: string }> },
): Promise<Response> {
  try {
    const body: Prisma.CourseUpdateInput = await req.json();
    const { courseIdOrSlug } = await params;

    const course: Course = await prisma.course.update({
      where: { slug: courseIdOrSlug },
      data: body,
    });

    return Response.json(course);
  } catch (_error) {
    return new Response('Update failed or course not found', { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ courseIdOrSlug: string }> },
): Promise<NextResponse> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError('Unauthorized', 401);
    }

    const { courseIdOrSlug } = await params;

    const result = await archiveCourseUseCase({
      courseIdOrSlug,
      user: { id: session.user.id, role: session.user.role },
    });

    return apiSuccess(result, 'Course archived successfully');
  } catch (error) {
    if (
      error instanceof ArchiveCourseError ||
      error instanceof CourseAuthorizationError
    ) {
      return apiError(error.message, error.status);
    }

    console.error('[COURSE_ARCHIVE_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
