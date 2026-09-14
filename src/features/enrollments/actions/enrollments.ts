'use server';

import { revalidatePath } from 'next/cache';

import { ENROLLMENT_ENDPOINTS } from '@/constants/enrollments';
import { HttpError } from '@/lib/http-error';
import { httpServer } from '@/lib/http-server';
import { extractErrorMessage } from '@/lib/error-extractor';
import type { ActionResponse } from '@/types/action';
import type { EnrollInFreeCourseOutputDTO } from '../application/dto/enroll-free-course.dto';

type EnrollApiResponse = {
  success: true;
  message: string;
  data: EnrollInFreeCourseOutputDTO;
};

function mapEnrollError(error: unknown, fallback: string): ActionResponse<never> {
  if (error instanceof HttpError) {
    if (error.status === 401) {
      return {
        success: false,
        error: 'يجب تسجيل الدخول للتسجيل في الدورة',
      };
    }

    return {
      success: false,
      error: extractErrorMessage(error, fallback),
    };
  }

  return {
    success: false,
    error: extractErrorMessage(error, fallback),
  };
}

export async function enrollInFreeCourseAction(
  courseIdOrSlug: string,
): Promise<ActionResponse<EnrollInFreeCourseOutputDTO>> {
  try {
    const response = await httpServer.post<EnrollApiResponse>(
      ENROLLMENT_ENDPOINTS.ENROLL(courseIdOrSlug),
      {},
    );

    revalidatePath('/courses', 'layout');
    revalidatePath('/my-courses');

    return {
      success: true,
      data: response.data,
      message: response.message ?? 'تم التسجيل في الدورة بنجاح',
    };
  } catch (error) {
    console.error('[ENROLL_IN_FREE_COURSE_ACTION]', error);
    return mapEnrollError(error, 'فشل التسجيل في الدورة');
  }
}
