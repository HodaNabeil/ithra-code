import React from 'react';
import { formatDuration } from '@/lib/formatters';
import {
  BarChart2,
  PlayCircle,
  Layout,
  Code,
  Infinity,
  Clock,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { AddToCartButton } from './add-to-cart-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { APP_ROUTES } from '@/constant/enums';
import type { CourseDetailDTO } from '@/types/course/course.dto';
import type { CourseLevel } from '@/types/course/course.types';
import {
  buildAddToCartCourse,
  resolveCourseEnrollmentState,
} from '@/features/courses/lib/course-cart-context';
import { formatCourseLevel } from '@/features/courses/lib/course-formatters';

interface CourseHeroProps {
  course: CourseDetailDTO;
}

export const CourseHero = async ({ course }: CourseHeroProps) => {
  const {
    title,
    description,
    level,
    duration,
    lecturesCount,
    id: courseId,
    slug: courseSlug,
    firstLectureId,
  } = course;

  const levelLabel = formatCourseLevel(level as CourseLevel);
  const durationLabel = duration ? formatDuration(duration, 'ar', true) : '';
  const overviewItems = [
    { icon: BarChart2, label: `مستوى ${levelLabel}:` },
    ...(durationLabel
      ? [
          {
            icon: PlayCircle,
            label: `${durationLabel} (HD video)`,
          },
        ]
      : []),
    { icon: Layout, label: `${lecturesCount} محاضرة` },
    { icon: Code, label: 'التطبيقات العملية' },
    { icon: Infinity, label: 'الوصول للدورة مدى الحياة' },
    { icon: Clock, label: 'تعلم بالسرعة التي تناسبك' },
  ] as const;

  const session = await auth();
  const enrollmentState = await resolveCourseEnrollmentState(
    courseId,
    session?.user?.id,
  );
  const { isEnrolled } = enrollmentState;

  const learnLink = firstLectureId
    ? `${APP_ROUTES.MY_COURSES}/${courseSlug}/${APP_ROUTES.LEARN}/${APP_ROUTES.LECTURE}/${firstLectureId}`
    : `${APP_ROUTES.MY_COURSES}/${courseSlug}`;

  const courseForCart = buildAddToCartCourse(course, enrollmentState);

  return (
    <section className=" section-gap">
      <div
        className="container items-center md:items-start 
      flex flex-col lg:flex-row justify-between xl:justify-around gap-2 
      relative"
      >
        <div className="text-center md:text-right max-w-xl! pt-5 lg:pt-24">
          <div>
            <h1
              className="text-3xl md:text-4xl xl:text-5xl font-bold 
                 text-primary tracking-tight  leading-tight "
            >
              {title}
            </h1>

            <p className="text-xl md:text-2xl leading-7 md:leading-9 my-5 text-muted-foreground">
              {description}
            </p>
          </div>

          {isEnrolled ? (
            <Button
              asChild
              className="px-6 h-11 w-full md:w-fit rounded-xl text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-95"
            >
              <Link href={learnLink}>
                <span>ابدأ التعلم الآن</span>
                <PlayCircle className="w-5 h-5" />
              </Link>
            </Button>
          ) : (
            <AddToCartButton
              course={courseForCart}
              className="px-6 h-11 w-full md:w-fit rounded-xl text-base"
            />
          )}
        </div>

        <div className="mt-7 w-full lg:w-[300px] rounded-md border border-border bg-card text-card-foreground">
          <div className="p-6 md:p-10 lg:p-12 whitespace-nowrap">
            <h2 className="font-semibold text-xl text-primary tracking-wide">
              نظرة عامة على الدورة
            </h2>
            <div className="h-[5px] bg-linear-to-r from-primary to-primary w-16 mt-4 mb-10"></div>

            <ul className="space-y-4 font-normal text-foreground">
              {overviewItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-4 text-base">
                  <item.icon className="size-5 text-primary shrink-0" />
                  <span className="text-base font-medium">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};
