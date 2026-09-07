'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LectureNavigationButtonsProps {
  previousLectureId?: string | null;
  previousLectureTitle?: string | null;
  previousLecturePosition?: number | null;
  nextLectureId?: string | null;
  nextLectureTitle?: string | null;
  nextLecturePosition?: number | null;
  courseSlug: string;
}

export function LectureNavigationButtons({
  previousLectureId,
  previousLectureTitle,
  previousLecturePosition,
  nextLectureId,
  nextLectureTitle,
  nextLecturePosition,
  courseSlug,
}: LectureNavigationButtonsProps) {
  const router = useRouter();

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between items-center px-1 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div className="relative flex items-center group/nav">
        <Button
          disabled={!previousLectureId}
          variant="default"
          size="icon"
          onClick={() =>
            router.push(
              `/my-courses/${courseSlug}/lecture/${previousLectureId}`,
            )
          }
          className="pointer-events-auto h-11 w-11 shadow-2xl disabled:opacity-0 transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
        {previousLectureId && (
          <div className="absolute right-full mr-3 px-3 py-2 bg-popover/95 backdrop-blur-sm text-popover-foreground text-[13px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-all duration-300 translate-x-2 group-hover/nav:translate-x-0 pointer-events-none border border-border shadow-2xl">
            {previousLectureTitle}{' '}
            {previousLecturePosition && `.${previousLecturePosition}`}
          </div>
        )}
      </div>

      <div className="relative flex items-center group/nav">
        <Button
          disabled={!nextLectureId}
          variant="default"
          size="icon"
          onClick={() =>
            router.push(`/my-courses/${courseSlug}/lecture/${nextLectureId}`)
          }
          className="pointer-events-auto h-11 w-11 shadow-2xl disabled:opacity-0 transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        {nextLectureId && (
          <div className="absolute left-full ml-3 px-3 py-2 bg-popover/95 backdrop-blur-sm text-popover-foreground text-[13px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-all duration-300 -translate-x-2 group-hover/nav:translate-x-0 pointer-events-none border border-border shadow-2xl">
            {nextLectureTitle}{' '}
            {nextLecturePosition && `.${nextLecturePosition}`}
          </div>
        )}
      </div>
    </div>
  );
}
