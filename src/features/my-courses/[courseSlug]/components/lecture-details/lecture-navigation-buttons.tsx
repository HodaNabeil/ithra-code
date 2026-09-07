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

  const navButtonClassName =
    'pointer-events-auto h-12 w-7 min-w-8 rounded-lg border border-white/25 p-0 shadow-lg hover:bg-primary/90 focus-visible:ring-0 disabled:opacity-0 transition-all duration-300';

  return (
    <div className="pointer-events-none absolute inset-y-0 inset-s-0 inset-e-0 z-10 flex items-center justify-between opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      <div className="relative flex items-center group/nav">
        <Button
          disabled={!previousLectureId}
          variant="default"
          onClick={() =>
            router.push(
              `/my-courses/${courseSlug}/lecture/${previousLectureId}`,
            )
          }
          className={navButtonClassName}
          aria-label="المحاضرة السابقة"
        >
          <ChevronRight className="size-4" strokeWidth={2.5} />
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
          onClick={() =>
            router.push(`/my-courses/${courseSlug}/lecture/${nextLectureId}`)
          }
          className={navButtonClassName}
          aria-label="المحاضرة التالية"
        >
          <ChevronLeft className="size-4" strokeWidth={2.5} />
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
