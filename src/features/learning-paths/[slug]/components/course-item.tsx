import Link from 'next/link';
import { APP_ROUTES } from '@/constants/enums';
import { formatCourseLevel } from '@/features/courses/lib/course-formatters';
import { formatDuration } from '@/lib/formatters';
import { CourseDetailDTO } from '@/types/path/path.dto';

interface CourseItemProps {
  course: CourseDetailDTO;
  isLast: boolean;
}

export function CourseItem({ course, isLast }: CourseItemProps) {
  return (
    <li className={`flex ${isLast ? 'items-start' : 'items-stretch'} gap-7`}>
      {/* Timeline connector with primary color */}
      <div className="flex flex-col items-center bg-primary/80 h-auto w-[2px] translate-y-3 relative after:content-[''] after:w-3 after:h-3 after:bg-primary after:rounded-full after:absolute after:left-1/2 after:-translate-x-1/2 after:-top-1 after:shadow-[0_0_10px] after:shadow-primary/50"></div>

      {/* Course content */}
      <div className="pb-7 flex-1">
        <h3 className="text-xl font-medium my-0">
          <Link
            className="text-foreground hover:text-primary transition-colors duration-300 border-b-2 border-transparent hover:border-primary inline-block"
            href={`${APP_ROUTES.COURSES}/${course.slug}`}
          >
            {course.title}
          </Link>
        </h3>
        <p className="text-muted-foreground text-sm">
          {formatCourseLevel(course.level)}
          {course.hours && ` • ${formatDuration(course.hours * 60, 'ar')}`}
        </p>
      </div>
    </li>
  );
}
