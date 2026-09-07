import { Clock, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatCourseLevel } from '@/features/courses/lib/course-formatters';
import {
  formatDuration,
  formatTotalHours,
} from '@/features/courses/lib/formatters';
import type { CourseListDTO } from '@/types/course/course.dto';
import type { CourseLevel } from '@/types/course/course.types';

type CourseMetadataBadgesProps = {
  course: Pick<
    CourseListDTO,
    'rating' | 'ratingCount' | 'lecturesCount' | 'hours' | 'duration' | 'level'
  >;
};

function getDurationLabel(
  course: CourseMetadataBadgesProps['course'],
): string | null {
  if (course.hours && course.hours > 0) {
    return formatTotalHours(course.hours, 'ar', true);
  }

  if (course.duration && course.duration > 0) {
    return formatDuration(course.duration, 'ar', true);
  }

  return null;
}

export function CourseMetadataBadges({ course }: CourseMetadataBadgesProps) {
  const durationLabel = getDurationLabel(course);

  return (
    <div className="flex flex-wrap gap-2">
      {(course.rating > 0 || course.ratingCount > 0) && (
        <>
          <Badge variant="outline" className="text-xs font-normal gap-1">
            <Star className="size-3 fill-[rgb(246,156,8)] text-[rgb(246,156,8)]" />
            {course.rating}
          </Badge>

          <Badge variant="outline" className="text-xs font-normal">
            {course.ratingCount} من التقييمات
          </Badge>
        </>
      )}

      {durationLabel && (
        <Badge variant="outline" className="text-xs font-normal gap-1">
          <Clock className="size-3" />
          {durationLabel}
        </Badge>
      )}

      {course.lecturesCount > 0 && (
        <Badge variant="outline" className="text-xs font-normal">
          {course.lecturesCount} من المحاضرات
        </Badge>
      )}

      <Badge variant="outline" className="text-xs font-normal">
        {formatCourseLevel(course.level as CourseLevel)}
      </Badge>
    </div>
  );
}
