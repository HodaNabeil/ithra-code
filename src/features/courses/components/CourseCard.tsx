import { APP_ROUTES } from '@/constants/enums';
import { formatDuration, formatPrice } from '@/lib/formatters';
import Image from 'next/image';
import Link from 'next/link';

import { CourseCardProps } from '@/types/course/course.types';

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <li className="list-none">
      <Link
        href={`${APP_ROUTES.COURSES}/${course.slug}`}
        className="group block h-full overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      >
        <div className="relative aspect-video w-full overflow-hidden">
          {course.thumbnailUrl && (
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
            />
          )}
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="mb-2 leading-6 text-foreground font-semibold text-lg flex-1 truncate ">
              {course.title}
            </h3>
            {course.duration ? (
              <div className="inline-flex shrink-0 items-center justify-center rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
                {formatDuration(course.duration, 'ar', true)}
              </div>
            ) : null}
          </div>

          <div className="h-16">
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground truncate">
              {course.description}
            </p>
          </div>

          <div className="mt-auto flex items-center justify-between pt-2">
            <p className="text-xl font-extrabold text-primary">
              {formatPrice(Number(course.price), course.currency)}
            </p>
            <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
              عرض الدورة ←
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
