'use client';

import { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Link from 'next/link';
import { MonitorPlay, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { STUDENT_ROUTES } from '@/constant/routes';
import type { Course, CourseOverview } from '@/types/course/course.types';
import {
  formatDuration,
  formatDurationFromSeconds,
  formatVideoTimestamp,
} from '@/features/courses/lib/formatters';
import { useCoursePreviewStore } from '../../stores/course-preview-store';
import { buildFreePreviewVideosFromSections } from '@/features/courses/[slug]/utils/build-free-preview-videos';
import { getLectureDurationSeconds } from '@/features/courses/[slug]/utils/get-lecture-duration';

export default function CourseContent({
  sections,
  lecturesCount,
  courseTitle,
  courseSlug,
  isPurchased,
}: {
  sections: Course['sections'];
  lecturesCount: CourseOverview['lecturesCount'];
  courseTitle?: string;
  courseSlug: string;
  isPurchased: boolean;
}) {
  const { openPreview } = useCoursePreviewStore();

  const previewVideos = useMemo(
    () => buildFreePreviewVideosFromSections(sections),
    [sections],
  );

  const allSectionValues = useMemo(
    () => sections.map((section) => `section-${section.id}`),
    [sections],
  );

  const firstSection = sections.at(0);
  const [openSections, setOpenSections] = useState<string[]>(
    firstSection ? [`section-${firstSection.id}`] : [],
  );

  const isAllExpanded =
    allSectionValues.length > 0 &&
    openSections.length === allSectionValues.length;

  const totalHours = useMemo(() => {
    return (
      sections.reduce((total, section) => {
        return (
          total +
          section.lectures.reduce(
            (lectureTotal, lecture) =>
              lectureTotal + (lecture.video?.duration ?? 0),
            0,
          )
        );
      }, 0) / 60
    );
  }, [sections]);

  return (
    <div className="w-full space-y-4 font-sans mb-10">
      {/* Header */}
      <div className="space-y-4 mb-4">
        <h2 className="text-2xl font-bold text-sidebar-foreground text-right">
          محتوى الدورة
        </h2>

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="text-sidebar-foreground/70">
            {sections.length} من الأقسام • {lecturesCount} من المحاضرات
            {totalHours > 0 ? (
              <> • إجمالي المدة {formatDuration(totalHours)}</>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              setOpenSections(isAllExpanded ? [] : allSectionValues);
            }}
          >
            {isAllExpanded ? 'طي جميع الأقسام' : 'توسيع جميع الأقسام'}
          </Button>
        </div>
      </div>

      {/* Content Accordion */}
      <div className="border border-sidebar-border rounded-lg overflow-hidden bg-sidebar-background">
        {sections.length === 0 ? (
          <div className="p-8 text-center text-sidebar-foreground/70">
            لا توجد أقسام متاحة لهذه الدورة بعد
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={setOpenSections}
          >
            {sections.map((section) => {
              const sectionDurationSeconds = section.lectures.reduce(
                (total, lecture) => total + getLectureDurationSeconds(lecture),
                0,
              );

              return (
                <AccordionItem
                  key={section.id}
                  value={`section-${section.id}`}
                  className="border-b border-sidebar-border last:border-b-0"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-sidebar-accent hover:no-underline transition-colors [&>svg]:order-first [&>svg]:ml-2">
                    <div className="flex items-center justify-between w-full text-right">
                      <span className="font-semibold text-sm md:text-base text-sidebar-foreground">
                        {section.title}
                      </span>
                      <span className="text-sm text-sidebar-foreground/70 hidden sm:inline-block">
                        {section.lectures.length} من المحاضرات
                        {sectionDurationSeconds > 0 ? (
                          <>
                            {' '}
                            •{' '}
                            {formatDurationFromSeconds(sectionDurationSeconds)}
                          </>
                        ) : null}
                      </span>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="p-0">
                    <div className="bg-gray-alpha-50">
                      {section.lectures.length > 0 ? (
                        section.lectures.map((lecture) => {
                          const lectureDurationSeconds =
                            getLectureDurationSeconds(lecture);
                          const learnHref = STUDENT_ROUTES.LEARN.replace(
                            ':courseSlug',
                            courseSlug,
                          ).replace(':lectureId', lecture.id);

                          return (
                            <div
                              key={lecture.id}
                              className="border-b border-sidebar-border last:border-b-0"
                            >
                              <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-alpha-100 transition-colors group">
                                {/* Right Side: Title & Icon */}
                                <div className="flex items-start gap-3 flex-1">
                                  <MonitorPlay className="w-4 h-4 text-sidebar-foreground/70 shrink-0 mt-1" />
                                  <span className="text-xs md:text-sm text-sidebar-foreground font-normal leading-relaxed group-hover:text-sidebar-foreground transition-colors">
                                    {lecture.title}
                                  </span>
                                </div>

                                {/* Left Side: Watch / Preview & Duration */}
                                <div className="flex items-center shrink-0 mt-0.5">
                                  {isPurchased ? (
                                    <Link
                                      href={learnHref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs md:text-sm font-medium text-primary underline hover:opacity-80 transition-opacity"
                                    >
                                      مشاهدة
                                    </Link>
                                  ) : (
                                    <>
                                      {lecture.isFree &&
                                      lecture.video?.hlsUrl ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openPreview(
                                              courseTitle ?? '',
                                              previewVideos,
                                              lecture.id,
                                            )
                                          }
                                          className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                                        >
                                          <span className="bg-primary rounded-full w-4 h-4 element-center">
                                            <Play className="w-2.5 h-2.5 text-primary fill-accent stroke-0" />
                                          </span>
                                          <span className="text-foreground text-xs md:text-sm font-medium underline">
                                            معاينة
                                          </span>
                                        </button>
                                      ) : null}
                                      {!isPurchased &&
                                      lectureDurationSeconds > 0 ? (
                                        <span className="text-sm text-sidebar-foreground/70 tabular-nums min-w-12 text-left">
                                          {formatVideoTimestamp(
                                            lectureDurationSeconds,
                                          )}
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-sidebar-foreground/70 text-xs md:text-sm">
                          لا توجد محاضرات في هذا القسم
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </div>
  );
}
