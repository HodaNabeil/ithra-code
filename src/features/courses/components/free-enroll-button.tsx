'use client';

import { useCallback, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { AUTH_ENDPOINTS } from '@/constants/auth';
import { FREE_ENROLL_QUERY } from '@/constants/enrollments';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { isAuthenticatedStatus } from '@/constants/states';
import { enrollInFreeCourseAction } from '@/features/enrollments/actions/enrollments';
import { buildLearnHref } from '@/features/courses/lib/build-learn-href';
import type { ActionResponse } from '@/types/action';
import type { EnrollInFreeCourseOutputDTO } from '@/features/enrollments/application/dto/enroll-free-course.dto';
import type { AddToCartCourse } from './add-to-cart-button';
import { LearnCourseButton } from './learn-course-button';

interface FreeEnrollButtonProps {
  course: AddToCartCourse;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl';
}

function buildLoginCallbackUrl(slug: string): string {
  const courseUrl = `${PUBLIC_ROUTES.COURSES}/${slug}?${FREE_ENROLL_QUERY}=1`;
  return `${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${encodeURIComponent(courseUrl)}`;
}

export function FreeEnrollButton({
  course,
  className,
  size,
}: FreeEnrollButtonProps) {
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = isAuthenticatedStatus(status);

  const enrollAction = useCallback(
    async (_prev: ActionResponse<EnrollInFreeCourseOutputDTO> | null) =>
      enrollInFreeCourseAction(course.slug),
    [course.slug],
  );

  const [state, formAction, isPending] = useActionState<
    ActionResponse<EnrollInFreeCourseOutputDTO> | null,
    FormData
  >(enrollAction, null);

  useEffect(() => {
    if (!state) return;

    if (state.success) {
      toast.success(state.message ?? 'تم التسجيل في الدورة بنجاح');
      router.push(buildLearnHref(state.data));
      router.refresh();
      return;
    }

    toast.error(state.error);
  }, [state, router]);

  if (course.isPurchased) {
    return (
      <LearnCourseButton course={course} className={className} size={size} />
    );
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isAuthed) {
      e.preventDefault();
      router.push(buildLoginCallbackUrl(course.slug));
    }
  };

  return (
    <form action={formAction} className="contents">
      <Button
        type="submit"
        variant="course"
        onClick={handleClick}
        disabled={isPending}
        className={className}
        size={size}
      >
        {isPending ? 'جاري التسجيل...' : 'سجّل مجاناً'}
      </Button>
    </form>
  );
}
