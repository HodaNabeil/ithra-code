'use client';

import {
  Infinity,
  BarChart3,
  List,
  Code,
  Clock,
  PlayCircle,
} from 'lucide-react';
import { formatDuration, formatPrice } from '@/lib/formatters';
import { getCourseLevelsOptions } from '@/features/courses/lib/course-formatters';
import type { Course, CourseOverview } from '@/types/course/course.types';

import { AddToCartButton } from '@/features/courses/components/add-to-cart-button';
import { CourseVideoPreview } from './course-video-preview';

interface CoursePricingCardProps {
  course: Course;

  overview: {
    totalHours: CourseOverview['totalHours'];
    lecturesCount: CourseOverview['lecturesCount'];
  };
}

export function CoursePricingCard({
  course,
  overview,
}: CoursePricingCardProps) {
  const originalPrice = course.compareAtPrice ?? undefined;
  const discount =
    originalPrice && originalPrice > course.price
      ? Math.round(((originalPrice - course.price) / originalPrice) * 100)
      : null;

  const skillLevelLabel = getCourseLevelsOptions().find(
    (option) => option.value === course.level,
  )?.label;

  const durationLabel = `${formatDuration((overview.totalHours ?? 0) * 60, 'ar', true)} (HD video)`;

  return (
    <>
      <div className="flex flex-col gap-4 bg-sidebar-background border border-sidebar-border rounded-lg overflow-hidden shadow-sm h-fit lg:sticky lg:top-24">
        {/* Video Preview Section (Only on desktop inside the card) */}
        <div className="hidden lg:block">
          <CourseVideoPreview
            title={course.title}
            thumbnailUrl={course.thumbnailUrl}
            sections={course.sections}
            previewVideoUrl={course.previewVideo}
            mode="dialog"
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Price Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl font-bold text-foreground">
                {formatPrice(course.price, course.currency)}
              </span>
              {originalPrice && originalPrice > course.price && (
                <span className="text-muted-foreground line-through text-lg">
                  {formatPrice(originalPrice, course.currency)}
                </span>
              )}
            </div>

            {discount && (
              <div className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                <span>خصم بنسبة {discount}%</span>
              </div>
            )}
          </div>

          {/* Action Buttons (Visible on desktop only in the card) */}
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <AddToCartButton course={course} size="xl" className="w-full" />
              </div>
              {/* <Button variant="outline" size="xl" className="rounded-lg shrink-0">
                <Heart className="w-5 h-5" />
              </Button> */}
            </div>

            <p className="text-center text-xs text-muted-foreground mt-2">
              ضمان استرداد الأموال لمدة 30 يومًا
            </p>
          </div>

          {/* Course Includes */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-foreground text-base">
              تتضمن هذه الدورة ما يأتي:
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{skillLevelLabel}</span>
              </li>

              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <PlayCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{durationLabel}</span>
              </li>

              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <List className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{overview.lecturesCount ?? 0} محاضرة</span>
              </li>

              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Code className="w-4 h-4 shrink-0 mt-0.5" />
                <span>التطبيقات العملية</span>
              </li>

              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Infinity className="w-4 h-4 shrink-0 mt-0.5" />
                <span>الوصول للدورة مدى الحياة</span>
              </li>

              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <span>تعلم بالسرعة التي تناسبك</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
