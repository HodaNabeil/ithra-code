import { ExpandableContent } from '@/components/shared/expandable-content';
import type { Course, CourseOverview } from '@/types/course/course.types';
import CourseBreadCrumbs from '@/features/courses/components/course-bread-crumbs';
import RatingLinkButton from './rating-link-button';
import { Info, Star } from 'lucide-react';

interface CourseHeroProps {
  title: Course['title'];
  slug: Course['slug'];
  rating: CourseOverview['rating'];
  ratingsCount: CourseOverview['ratingsCount'];
  totalStudents: CourseOverview['totalStudents'];
  lastUpdated: CourseOverview['lastUpdated'];
  shortDescription: Course['shortDescription'];
}

export default function CourseHero({
  title,
  slug,
  rating,
  ratingsCount,
  shortDescription,
  totalStudents,
  lastUpdated,
}: CourseHeroProps) {
  const lastUpdatedLabel = (() => {
    const date = new Date(lastUpdated);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ar-EG-u-nu-arab', {
      month: 'numeric',
      year: 'numeric',
    }).format(date);
  })();

  return (
    <section className="space-y-4">
      <div className="hidden lg:block">
        <CourseBreadCrumbs courseTitle={title} courseSlug={slug} />
      </div>
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight line-clamp-2">
        {title}
      </h1>
      <div className="flex flex-col text-sm space-y-4">
        {/* Rating Section */}
        {rating > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-star text-sm">
              {rating.toFixed(1)}
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= Math.round(rating);
                const partialFill =
                  star === Math.ceil(rating) && rating % 1 !== 0;

                return (
                  <Star
                    key={star}
                    size={12}
                    className={
                      filled
                        ? 'fill-star text-star'
                        : partialFill
                          ? 'fill-star/50 text-star'
                          : 'text-star'
                    }
                  />
                );
              })}
            </div>
            {ratingsCount > 0 && (
              <RatingLinkButton ratingsCount={ratingsCount} />
            )}
            {totalStudents > 0 && (
              <span className="text-muted-foreground">
                {totalStudents.toLocaleString('en-EG')} من الطلاب
              </span>
            )}
          </div>
        )}

        {/* Last Updated */}
        {lastUpdatedLabel && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <Info className="w-4 h-4" />
            <span>تاريخ آخر تحديث {lastUpdatedLabel}</span>
          </div>
        )}
      </div>

      <ExpandableContent
        initialHeight={200}
        expandLabel="عرض المزيد"
        collapseLabel="عرض أقل"
      >
        <p className="text-base md:text-lg text-muted-foreground whitespace-pre-line leading-relaxed">
          {shortDescription}
        </p>
      </ExpandableContent>
    </section>
  );
}
