import { courseDetailCache } from '@/features/courses/course-detail/cache/course-detail.cache';
import { courseOverviewCache } from '@/features/courses/course-overview/cache/course-overview.cache';
import { courseSectionsCache } from '@/features/courses/course-sections/cache/course-sections.cache';
import { invalidateCourseListCache } from '@/features/courses/course-creation/cache/course-creation.cache';

export const courseCacheService = {
  async invalidateCourse(slug: string): Promise<void> {
    await Promise.all([
      courseDetailCache.invalidate(slug),
      courseOverviewCache.invalidate(slug),
      courseSectionsCache.invalidate(slug),
    ]);
  },

  async invalidateCourseList(): Promise<void> {
    await invalidateCourseListCache();
  },

  async invalidateAfterArchive(slug: string): Promise<void> {
    await Promise.all([
      this.invalidateCourse(slug),
      this.invalidateCourseList(),
    ]);
  },
};
