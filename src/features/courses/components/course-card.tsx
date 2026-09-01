import Image from 'next/image';
import { Star, Check } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CourseListDTO } from '@/types/course/course.dto';
import type { CourseLevel } from '@/types/course/course.types';
import { formatPrice } from '@/lib/formatters';
import { formatCourseLevel } from '@/features/courses/lib/course-formatters';
import Link from 'next/link';
import { AddToCartButton } from '@/features/courses/components/add-to-cart-button';
import { PUBLIC_ROUTES, STUDENT_ROUTES } from '@/constants/routes';
import { buttonVariants } from '@/components/ui/button';
import { CourseCardWrapper } from '@/components/shared/course-card-wrapper';
// Hover Card Component
interface CourseHoverCardProps {
  objectives: CourseListDTO['objectives'];
}

function CourseHoverCard({ objectives }: CourseHoverCardProps) {
  return (
    <>
      <div className="flex flex-col gap-4">
        <h4 className="font-bold text-lg text-right">ما ستتعلمه</h4>

        <ul className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
          {objectives.map((objective: string, index: number) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="size-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground leading-snug">
                {objective}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

interface CourseCardProps {
  course: CourseListDTO;
}

export function CourseCard({ course }: CourseCardProps) {
  const firstLectureId = course.firstLectureId;

  const learnHref = firstLectureId
    ? STUDENT_ROUTES.LEARN.replace(':courseSlug', course.slug).replace(
        ':lectureId',
        firstLectureId,
      )
    : `${PUBLIC_ROUTES.COURSES}/${course.slug}`;
  return (
    <CourseCardWrapper
      className="[&:nth-child(3n)_.course-hover-card]:lg:right-auto [&:nth-child(3n)_.course-hover-card]:lg:left-[calc(100%+0.8rem)] [&:nth-child(3n)_.course-hover-card]:lg:slide-in-from-left-2"
      hoverCard={<CourseHoverCard objectives={course.objectives} />}
    >
      {/* Card is a flex column — Link covers everything except the footer button */}
      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 hover:border-primary/30 flex flex-col h-full gap-5">
        <Link
          href={`${PUBLIC_ROUTES.COURSES}/${course.slug}`}
          className="flex flex-col flex-1 gap-5 min-h-0"
        >
          <div className="relative w-full aspect-video overflow-hidden">
            <Image
              src={course.thumbnailUrl}
              alt={course.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>

          <CardContent className="flex flex-col flex-1 gap-2">
            <div className="space-y-2 mb-6">
              <h3 className="font-bold text-lg leading-tight line-clamp-2 truncate">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {course.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Rating & Ratings Count — hidden when both are 0 */}
              {(course.rating > 0 || course.ratingCount > 0) && (
                <>
                  <Badge
                    variant="outline"
                    className="text-xs font-normal gap-1"
                  >
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
          </CardContent>
        </Link>

        {/* Footer lives outside the Link so the button click doesn't navigate */}
        <CardFooter className="flex items-center justify-between p-4 pt-0">
          {course.isPurchased ? (
            <span className="text-sm font-medium text-success flex items-center gap-1">
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
              className={buttonVariants({ variant: 'course' })}
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
