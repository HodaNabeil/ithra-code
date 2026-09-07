import type { EnrollmentListItemDTO } from '@/features/enrollments';
import type { EnrollmentItem } from '@/types/course/course.types';

export function mapEnrollmentListItem(
  item: EnrollmentListItemDTO,
): EnrollmentItem {
  const firstLectureId = item.course.firstLectureId;

  return {
    id: item.course.id,
    title: item.course.title,
    slug: item.course.slug,
    description: item.course.description,
    thumbnailUrl: item.course.thumbnailUrl,
    trackId: item.course.pathId ?? null,
    instructorId: item.course.instructorId,
    progressPercentage: item.progress.completionPercentage,
    completedLectures: item.progress.completedLectures,
    totalLectures: item.progress.totalLectures,
    totalTimeSpent: item.progress.totalTimeSpent,
    enrolledAt: new Date(item.enrollment.enrolledAt),
    lastActivity: item.progress.lastAccessedAt
      ? new Date(item.progress.lastAccessedAt)
      : new Date(item.enrollment.updatedAt),
    firstLectureId,
    // Use the actual last-accessed lecture if available, fall back to first lecture for new enrolments.
    lastLectureId: item.progress.lastLectureId ?? firstLectureId,
    lastLectureTitle: undefined,
  };
}
