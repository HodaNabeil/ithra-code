'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { FREE_ENROLL_QUERY } from '@/constants/enrollments';
import { isAuthenticatedStatus } from '@/constants/states';
import { enrollInFreeCourseAction } from '@/features/enrollments/actions/enrollments';
import { buildLearnHref } from '@/features/courses/lib/build-learn-href';

interface CourseEnrollOnReturnProps {
  courseSlug: string;
}

export function CourseEnrollOnReturn({ courseSlug }: CourseEnrollOnReturnProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    if (searchParams.get(FREE_ENROLL_QUERY) !== '1') return;
    if (!isAuthenticatedStatus(status)) return;
    if (hasAttemptedRef.current) return;

    hasAttemptedRef.current = true;

    void (async () => {
      const result = await enrollInFreeCourseAction(courseSlug);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete(FREE_ENROLL_QUERY);
      const query = nextParams.toString();
      const cleanUrl = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

      router.replace(cleanUrl);

      if (result.success) {
        toast.success(result.message ?? 'تم التسجيل في الدورة بنجاح');
        router.push(buildLearnHref(result.data));
        router.refresh();
        return;
      }

      toast.error(result.error);
    })();
  }, [courseSlug, router, searchParams, status]);

  return null;
}
