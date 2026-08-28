import { PROGRESS_FILTERS } from '@/constants/my-courses';
import { StudentCourseItem, StudentFilters } from '@/types/course/course.types';

export const filterStudentCourses = (
  courses: StudentCourseItem[],
  searchQuery: string,
  filters: StudentFilters,
): StudentCourseItem[] => {
  const query = searchQuery.toLowerCase().trim();

  return courses.filter((course) => {
    const matchesSearch =
      !query || course.title.toLowerCase().includes(query);

    const matchesCategory =
      filters.category === 'all' || course.trackId === filters.category;

    const matchesInstructor =
      filters.instructor === 'all' ||
      course.instructorId === filters.instructor;

    let matchesProgress = true;
    const progress = course.progressPercentage || 0;

    if (filters.progress === PROGRESS_FILTERS.COMPLETED) {
      matchesProgress = progress === 100;
    } else if (filters.progress === PROGRESS_FILTERS.IN_PROGRESS) {
      matchesProgress = progress > 0 && progress < 100;
    } else if (filters.progress === PROGRESS_FILTERS.NOT_STARTED) {
      matchesProgress = progress === 0;
    }

    return (
      matchesSearch && matchesCategory && matchesInstructor && matchesProgress
    );
  });
};
export const sortStudentCourses = (
  courses: StudentCourseItem[],
  sortBy: string,
): StudentCourseItem[] => {
  return [...courses].sort((a, b) => {
    switch (sortBy) {
      case 'recent_access':
        return (
          new Date(b.lastActivity || 0).getTime() -
          new Date(a.lastActivity || 0).getTime()
        );

      case 'recent_enroll':
        return (
          new Date(b.enrolledAt || 0).getTime() -
          new Date(a.enrolledAt || 0).getTime()
        );

      case 'title_asc':
        return a.title.localeCompare(b.title, 'ar');

      case 'title_desc':
        return b.title.localeCompare(a.title, 'ar');

      default:
        return 0;
    }
  });
};
