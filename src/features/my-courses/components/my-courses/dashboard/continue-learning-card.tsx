'use client';

import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { Link } from '@/components/shared/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { APP_ROUTES } from '@/constants/enums';
import type { StudentCourseItem } from '@/types/course/course.types';

type ContinueLearningCardProps = {
  course: StudentCourseItem;
};

export function ContinueLearningCard({ course }: ContinueLearningCardProps) {
  const watchUrl = course.lastLectureId
    ? `${APP_ROUTES.MY_COURSES}/${course.slug}/lecture/${course.lastLectureId}`
    : `${APP_ROUTES.MY_COURSES}/${course.slug}`;

  return (
    <Card className="flex flex-col gap-4 rounded-xl border border-border bg-content-surface p-4 shadow-sm ring-0 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative size-[72px] shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image
            src={course.thumbnailUrl || '/placeholder-course.jpg'}
            alt={course.title}
            fill
            sizes="72px"
            className="object-cover"
            priority
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-base font-bold text-foreground sm:text-lg">
            {course.title}
          </h3>
          <p className="flex items-center gap-2 text-sm font-medium text-progress-indicator">
            <span
              className="size-2.5 shrink-0 rounded-full bg-progress-indicator"
              aria-hidden
            />
            الدورة الدراسية
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:w-44 sm:flex-none lg:w-52">
          <Progress
            value={course.progressPercentage}
            className="h-2 flex-1 bg-muted"
          />
          <span className="w-10 shrink-0 text-end text-sm font-semibold tabular-nums text-muted-foreground">
            {course.progressPercentage}%
          </span>
        </div>

        <Button asChild className="shrink-0">
          <Link href={watchUrl}>
            استئناف
            <PlayCircle className="size-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
