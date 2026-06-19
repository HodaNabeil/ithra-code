import Image from 'next/image';
import { Star, Check } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/formatters';
import Link from 'next/link';
import { APP_ROUTES } from '@/constant/enums';
import { buttonVariants } from '@/components/ui/button';
import { CourseCardWrapper } from '@/components/shared/course-card-wrapper';
import { formatCourseLevel } from '@/features/courses/lib/course-formatters';
import { AddToCartButton } from '@/features/courses/components/add-to-cart-button';
import type { CourseCardProps } from '@/types/course/course.types';
import type { CourseLevel } from '@/types/course/course.types';

interface CourseHoverCardProps {
  objectives: CourseCardProps['course']['objectives'];
}

function CourseHoverCard({ objectives }: CourseHoverCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <h4 className="text-right text-lg font-bold">ما ستتعلمه</h4>

      <ul className="custom-scrollbar max-h-96 space-y-3 overflow-y-auto">
        {objectives.map((objective, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="text-sm leading-snug text-muted-foreground">
              {objective}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CourseCard({ course }: CourseCardProps) {
  const learnHref = course.firstLectureId
    ? `${APP_ROUTES.MY_COURSES}/${course.slug}/${APP_ROUTES.LEARN}/${APP_ROUTES.LECTURE}/${course.firstLectureId}`
    : `${APP_ROUTES.MY_COURSES}/${course.slug}`;

  return (
    <CourseCardWrapper
      className="[&:nth-child(3n)_.course-hover-card]:lg:right-auto [&:nth-child(3n)_.course-hover-card]:lg:left-[calc(100%+0.8rem)] [&:nth-child(3n)_.course-hover-card]:lg:slide-in-from-left-2"
      hoverCard={<CourseHoverCard objectives={course.objectives} />}
    >
      <Card className="flex h-full flex-col gap-5 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-md">
        <Link
          href={`${APP_ROUTES.COURSES}/${course.slug}`}
          className="flex min-h-0 flex-1 flex-col gap-5"
        >
          <div className="relative aspect-video w-full overflow-hidden">
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          <CardContent className="flex flex-1 flex-col gap-2">
            <div className="mb-6 space-y-2">
              <h3 className="line-clamp-2 truncate text-lg font-bold leading-tight">
                {course.title}
              </h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {course.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(course.rating > 0 || course.ratingCount > 0) && (
                <>
                  <Badge
                    variant="outline"
                    className="gap-1 text-xs font-normal"
                  >
                    <Star className="size-3 fill-[rgb(246,156,8)] text-[rgb(246,156,8)]" />
                    {course.rating}
                  </Badge>

                  <Badge variant="outline" className="text-xs font-normal">
                    {course.ratingCount} من التقييمات
                  </Badge>
                </>
              )}

              {course.hours != null && course.hours > 0 && (
                <Badge variant="outline" className="text-xs font-normal">
                  إجمالي الساعات {course.hours}
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
          </CardContent>
        </Link>

        <CardFooter className="flex items-center justify-between p-4 pt-0">
          {course.isPurchased ? (
            <span className="flex items-center gap-1 text-sm font-medium text-success">
              <Check className="size-4" />
              تم الشراء
            </span>
          ) : (
            <span className="text-lg font-bold">
              {formatPrice(course.price, course.currency)}
            </span>
          )}

          {course.isPurchased ? (
            <Link
              href={learnHref}
              className={buttonVariants({ variant: 'default' })}
            >
              شاهد الدورة
            </Link>
          ) : (
            <AddToCartButton course={course} />
          )}
        </CardFooter>
      </Card>
    </CourseCardWrapper>
  );
}
