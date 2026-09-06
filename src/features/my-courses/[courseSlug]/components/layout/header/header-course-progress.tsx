'use client';

import { useCourseProgressQuery } from '@/features/my-courses/hooks/use-my-courses-queries';
import { ProgressDropdown } from '../../lecture-details/ProgressDropdown';

interface HeaderCourseProgressProps {
  courseSlug: string;
}

export function HeaderCourseProgress({
  courseSlug,
}: HeaderCourseProgressProps) {
  const { data } = useCourseProgressQuery(courseSlug);

  return (
    <ProgressDropdown
      completedCount={data?.completedLectures ?? 0}
      totalCount={data?.totalLectures ?? 0}
    />
  );
}
