import { APP_ROUTES } from '@/constant/enums';
import type { CourseListDTO } from '@/types/course/course.dto';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface CourseBreadCrumbsProps {
  courseTitle: CourseListDTO['title'];
  courseSlug: CourseListDTO['slug'];
}

export default function CourseBreadCrumbs({
  courseTitle,
  courseSlug,
}: CourseBreadCrumbsProps) {
  const breadcrumbs = [
    { label: 'الدورات', href: APP_ROUTES.COURSES },
    { label: courseTitle, href: `${APP_ROUTES.COURSES}/${courseSlug}` },
  ];

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center gap-2 text-sm font-medium text-foreground">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center gap-2 min-w-0">
            {index > 0 && (
              <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <Link
              href={crumb.href}
              className={`hover:underline hover:opacity-80 transition-opacity block ${
                index === breadcrumbs.length - 1
                  ? 'font-bold text-foreground flex-1 min-w-0 truncate max-w-full md:max-w-none'
                  : 'text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap'
              }`}
            >
              {crumb.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
