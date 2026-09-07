import Image from 'next/image';
import Link from 'next/link';
import type { CourseListDTO } from '@/types/course/course.dto';
import { formatPrice } from '@/lib/formatters';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { CourseCardWrapper } from '@/components/shared/course-card-wrapper';
import { CourseMetadataBadges } from '@/features/courses/components/course-metadata-badges';
import { FEATURED_COURSE_THUMBNAIL_SIZES } from '@/features/home/constants/image-sizes';
import { HomeHoverCard } from './home-hover-card';

interface HomeCourseCardProps {
  course: CourseListDTO;
}

export function HomeCourseCard({ course }: HomeCourseCardProps) {
  return (
    <CourseCardWrapper
      hoverCard={
        <HomeHoverCard objectives={course.objectives} course={course} />
      }
    >
      <Link
        href={`${PUBLIC_ROUTES.COURSES}/${course.slug}`}
        className="rounded-xl border border-border bg-card hover:border-primary/50 duration-200 transition-all h-full flex flex-col overflow-hidden"
      >
        <div className="relative w-full aspect-video overflow-hidden">
          <Image
            src={course.thumbnailUrl}
            alt={course.title}
            fill
            className="object-cover"
            sizes={FEATURED_COURSE_THUMBNAIL_SIZES}
          />
        </div>
        <div className="flex flex-col gap-4 p-6 flex-1">
          <h3 className="leading-6 text-accent-foreground font-semibold text-lg line-clamp-2">
            {course.title}
          </h3>

          <div className="min-h-12">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {course.description}
            </p>
          </div>

          <CourseMetadataBadges course={course} />

          <div className="mt-auto pt-2">
            {course.price > 0 ? (
              <p className="font-bold text-accent-foreground text-lg flex items-center gap-2">
                {formatPrice(course.price, course.currency)}
                {course.compareAtPrice &&
                  course.compareAtPrice > course.price && (
                    <span className="line-through font-normal text-muted-foreground text-sm">
                      {formatPrice(course.compareAtPrice, course.currency)}
                    </span>
                  )}
              </p>
            ) : (
              <p className="font-bold text-primary text-lg">مجانا</p>
            )}
          </div>
        </div>
      </Link>
    </CourseCardWrapper>
  );
}
