import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { CourseLevel } from '@/generated/prisma/enums';
import type { CourseListDTO } from '@/types/course/course.dto';
import { formatPrice } from '@/lib/formatters';
import { formatCourseLevel } from '@/features/courses/lib/course-formatters';
import { PUBLIC_ROUTES } from '@/constants/routes';
import { CourseCardWrapper } from '@/components/shared/course-card-wrapper';
import { Badge } from '@/components/ui/badge';
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
        className="rounded-lg border border-border bg-card hover:border-primary/50 duration-200 transition-all h-full flex flex-col"
      >
        <div className="relative w-full aspect-video overflow-hidden rounded-t-lg">
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

          <div className="flex flex-wrap gap-2">
            {/* Rating & Ratings Count — hidden when both are 0 */}
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

            {/* Lectures */}
            {course.lecturesCount > 0 && (
              <Badge variant="outline" className="text-xs font-normal">
                {course.lecturesCount} من المحاضرات
              </Badge>
            )}

            {/* Level */}
            <Badge variant="outline" className="text-xs font-normal">
              {formatCourseLevel(course.level as CourseLevel)}
            </Badge>
          </div>

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
