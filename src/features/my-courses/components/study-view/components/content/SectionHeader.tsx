import React from 'react';
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

interface SectionHeaderProps {
  position: number;
  title: string;
  lectures: MyCourseLectureDTO[];
}

export function SectionHeader({
  position,
  title,
  lectures,
}: SectionHeaderProps) {
  const summary = getSectionLectureSummary(lectures);
  // Remove "Section X:" prefix if it exists in the title string
  const cleanTitle = title.replace(/^Section \d+[:\s-]*/i, '');

  return (
    <span className="flex flex-col items-start gap-1 text-start">
      <span className="text-sm font-bold flex items-center gap-1.5">
        <span className="text-primary whitespace-nowrap">
          القسم {position}:
        </span>
        <span className="text-foreground/90 font-medium">{cleanTitle}</span>
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
  );
}
