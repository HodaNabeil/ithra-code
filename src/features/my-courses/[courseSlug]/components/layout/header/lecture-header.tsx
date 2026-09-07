'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Logo } from '@/components/shared/header/Logo';
import { ErrorRetry } from '@/components/shared';
import { PUBLIC_ROUTES } from '@/constants/routes';
import {
  useCourseProgressQuery,
  useLectureDetailQuery,
} from '@/features/my-courses/hooks/use-my-courses-queries';
import { HeaderCourseProgress } from './header-course-progress';
import { LectureHeaderSkeleton } from './lecture-header-skeleton';
import LectureShare from '@/features/my-courses/[courseSlug]/components/lecture-share';

export function LectureHeader() {
  const { courseSlug, lectureId } = useParams<{
    courseSlug: string;
    lectureId: string;
  }>();
  const {
    data,
    isLoading: isLectureLoading,
    isError,
    refetch,
  } = useLectureDetailQuery(lectureId);
  const { isLoading: isProgressLoading } = useCourseProgressQuery(courseSlug);

  const courseTitle = data?.course.title ?? '';
  const isHeaderLoading = isLectureLoading || isProgressLoading;

  if (isHeaderLoading) {
    return <LectureHeaderSkeleton />;
  }

  return (
    <header className="site-header sticky top-0 z-50 w-full">
      <div className="container flex h-20 items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Logo />
          {isError && (
            <ErrorRetry
              onRetry={() => refetch()}
              className="flex-1 items-start py-0"
            />
          )}
          {!isError && courseSlug && (
            <Link
              href={PUBLIC_ROUTES.COURSE_DETAILS.replace(
                ':courseSlug',
                courseSlug,
              )}
              className="text-sm md:text-base text-foreground font-normal hover:text-foreground/80 transition-colors line-clamp-1 min-w-0"
            >
              {courseTitle}
            </Link>
          )}
          {!isError && !courseSlug && (
            <h1 className="text-sm md:text-base text-foreground font-normal line-clamp-1 min-w-0">
              {courseTitle}
            </h1>
          )}
        </div>

        {!isHeaderLoading && !isError && (
          <div className="flex items-center gap-1 md:gap-4">
            <HeaderCourseProgress courseSlug={courseSlug} />
            <LectureShare courseTitle={courseTitle} />
          </div>
        )}
      </div>
    </header>
  );
}
