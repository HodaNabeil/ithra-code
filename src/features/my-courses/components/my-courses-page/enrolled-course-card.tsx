'use client';

import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { Link } from '@/components/shared/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { STUDENT_ROUTES } from '@/constants/routes';
import type { EnrollmentItem } from '@/types/course/course.types';
import { CourseProgress } from './course-progress';

interface EnrolledCourseCardProps {
  enrollment: EnrollmentItem;
}

export const EnrolledCourseCard = ({
  enrollment,
}: EnrolledCourseCardProps) => {
  const learnHref = enrollment.lastLectureId
    ? STUDENT_ROUTES.LEARN.replace(':courseSlug', enrollment.slug).replace(
        ':lectureId',
        enrollment.lastLectureId,
      )
    : STUDENT_ROUTES.COURSE_DETAILS.replace(':courseSlug', enrollment.slug);

  const progress = enrollment.progressPercentage || 0;

  return (
    <Card className="flex h-full flex-col gap-5 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-md">
      <Link href={learnHref} className="flex min-h-0 flex-1 flex-col gap-5">
        <div className="relative aspect-video w-full overflow-hidden">
          <Image
            src={enrollment.thumbnailUrl || '/placeholder-course.jpg'}
            alt={enrollment.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>

        <CardContent className="flex flex-1 flex-col gap-2">
          <div className="mb-6">
            <h3 className="line-clamp-2 truncate text-lg font-bold leading-tight">
              {enrollment.title}
            </h3>
          </div>

          <CourseProgress progress={progress} />
        </CardContent>
      </Link>

      <CardFooter className="w-full p-4 pt-0">
        <Button asChild className="w-full">
          <Link href={learnHref}>
            {progress > 0 ? 'استئناف' : 'ابدأ الدورة'}
            <PlayCircle className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
