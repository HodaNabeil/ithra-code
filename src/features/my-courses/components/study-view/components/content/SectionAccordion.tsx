'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { LectureItem } from './LectureItem';

import { useCourseSections } from '@/features/my-courses/hooks/useMyCoursesQueries';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import { SectionAccordionSkeleton } from './SectionAccordionSkeleton';
import { MyCourseLectureDTO } from '@/types/my-courses/my-courses.dto';

function getSectionLectureSummary(lectures: MyCourseLectureDTO[]): {
  durationLabel: string;
  completedCount: number;
  lectureCount: number;
} {
  let totalSeconds = 0;
  let completedCount = 0;

  for (const lecture of lectures) {
    totalSeconds += lecture.duration || 0;
    if (lecture.isCompleted) completedCount++;
  }

  return {
    durationLabel: `${Math.floor(totalSeconds / 60)} د`,
    completedCount,
    lectureCount: lectures.length,
  };
}

interface SectionAccordionProps {
  courseSlug: string;
}

export function SectionAccordion({ courseSlug }: SectionAccordionProps) {
  const {
    data: DataSections,
    isLoading: isLoadingSections,
    isError: isErrorSections,
    refetch,
  } = useCourseSections(courseSlug);

  if (isLoadingSections) {
    return <SectionAccordionSkeleton />;
  }

  if (isErrorSections || !DataSections) {
    return <ErrorRetry onRetry={() => refetch()} />;
  }

  const sections = DataSections.sections;

  return (
    <Accordion type="multiple" className="w-full" dir="rtl">
      {sections.map((section) => {
        const summary = getSectionLectureSummary(section.lectures);
        return (
          <AccordionItem
            key={section.id}
            value={section.id}
            className="border-b border-border/30 last:border-0 overflow-hidden"
            dir="rtl"
          >
            <AccordionTrigger className="px-4 py-4 hover:bg-muted/20 hover:no-underline transition-colors **:data-[slot=accordion-trigger-icon]:text-sidebar-primary/70">
              <span className="flex flex-col items-start gap-1 text-start">
                <span className="text-sm font-bold flex items-center gap-1.5">
                  <span className="text-sidebar-primary whitespace-nowrap">
                    القسم {section.position}:
                  </span>
                  <span className="text-foreground/90 font-medium">
                    {section.title.replace(/^Section \d+[:\s-]*/i, '')}
                  </span>
                </span>
                <span
                  className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium"
                  dir="ltr"
                >
                  <span>{summary.durationLabel}</span>
                  <span className="size-1 rounded-full bg-border" />
                  <span>
                    {summary.completedCount} / {summary.lectureCount}
                  </span>
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pt-2 px-0">
              <div className="flex flex-col">
                {section.lectures.map((lecture) => (
                  <LectureItem
                    key={lecture.id}
                    id={lecture.id}
                    title={lecture.title}
                    duration={lecture.duration}
                    isCompleted={lecture.isCompleted}
                    attachmentsCount={lecture.attachmentsCount}
                    courseSlug={courseSlug}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
