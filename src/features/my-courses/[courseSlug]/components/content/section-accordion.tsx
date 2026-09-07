'use client';

import React from 'react';
import { ChevronDown, FileText, FolderOpen } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Link } from '@/components/shared/link';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import {
  DIRECTIONS,
  LANGUAGES,
  type Direction,
} from '@/constants/i18n';
import { STUDENT_ROUTES } from '@/constants/routes';
import { formatDurationFromSeconds } from '@/features/courses/lib/formatters';
import type { Locale } from '@/features/courses/lib/formatters';
import type {
  MyCourseLectureAttachmentDTO,
  MyCourseLectureDTO,
  MyCourseSectionDTO,
} from '@/features/my-courses/dto/my-courses.dto';
import { useToggleLectureCompletion } from '@/features/my-courses/hooks/use-my-courses-mutations';
import { useCourseSections } from '@/features/my-courses/hooks/use-my-courses-queries';
import { useDocumentDirection } from '@/hooks/use-document-direction';
import { SectionAccordionSkeleton } from './section-accordion-skeleton';

type SectionLecture = MyCourseLectureDTO;

function getSectionStatistics(lectures: SectionLecture[]) {
  return {
    completedLectures: lectures.filter((lecture) => lecture.isCompleted).length,
    totalLectures: lectures.length,
    totalDuration: lectures.reduce(
      (total, lecture) => total + (lecture.duration || 0),
      0,
    ),
  };
}

interface AttachmentDropdownProps {
  attachments: MyCourseLectureAttachmentDTO[];
}

function AttachmentDropdown({ attachments }: AttachmentDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-transparent px-3 py-1 text-xs text-primary transition-colors hover:border-primary/30 hover:text-primary/80"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span>المرفقات ({attachments.length})</span>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {attachments.map((attachment) => (
          <DropdownMenuItem key={attachment.id} className="p-0" asChild>
            <a
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center gap-2 px-2 py-1.5 hover:no-underline"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                window.open(attachment.url, '_blank', 'noopener,noreferrer');
              }}
            >
              <FileText className="h-4 w-4" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {attachment.name}
              </span>
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface LectureProps {
  lecture: SectionLecture;
  courseSlug: string;
  searchParams: URLSearchParams;
  pathname: string;
  direction: Direction;
}

function Lecture({
  lecture,
  courseSlug,
  searchParams,
  pathname,
  direction,
}: LectureProps) {
  const toggleMutation = useToggleLectureCompletion(courseSlug);
  const basePath = STUDENT_ROUTES.LEARN.replace(
    ':courseSlug',
    courseSlug,
  ).replace(':lectureId', lecture.id);
  const searchString = searchParams.toString();
  const href = searchString ? `${basePath}?${searchString}` : basePath;
  const isActive = pathname === basePath;

  return (
    <Link
      href={href}
      dir={direction}
      className={`block border-b border-sidebar-border last:border-b-0 no-underline ${
        isActive ? 'bg-primary/10' : ''
      }`}
    >
      <div
        className={`flex items-start gap-3 px-2 py-2 transition-colors md:px-4 md:py-3 ${
          isActive
            ? 'bg-primary/10 hover:bg-primary/15'
            : 'hover:bg-gray-alpha-100'
        }`}
      >
        <div
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center"
          onClick={(event) => event.stopPropagation()}
        >
          <Checkbox
            checked={lecture.isCompleted}
            disabled={toggleMutation.isPending}
            onCheckedChange={(checked) => {
              toggleMutation.mutate({
                lectureId: lecture.id,
                isCompleted: checked === true,
              });
            }}
            className="h-5 w-5 border"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`m-0 text-start text-xs leading-relaxed text-sidebar-foreground lg:text-sm ${
                isActive ? 'font-semibold' : 'font-normal'
              }`}
            >
              <span
                dir="ltr"
                className="tabular-nums [unicode-bidi:isolate]"
              >
                {lecture.position}.
              </span>{' '}
              {lecture.title}
            </h4>
          </div>

          {lecture.attachments.length > 0 && (
            <div className="mt-2 flex items-center justify-start gap-4">
              <AttachmentDropdown attachments={lecture.attachments} />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

interface SectionProps {
  section: MyCourseSectionDTO;
  courseSlug: string;
  searchParams: URLSearchParams;
  pathname: string;
  direction: Direction;
  locale: Locale;
}

function Section({
  section,
  courseSlug,
  searchParams,
  pathname,
  direction,
  locale,
}: SectionProps) {
  const statistics = getSectionStatistics(section.lectures);

  return (
    <AccordionItem
      value={`section-${section.id}`}
      className="border-b border-sidebar-border"
    >
      <AccordionTrigger
        dir={direction}
        className="min-w-0 flex-1 items-start px-6 py-4 text-start transition-colors hover:bg-sidebar-accent hover:no-underline"
      >
        <div className="min-w-0 flex-1 text-start">
          <h3 className="m-0 mb-1.5 text-start text-sm font-semibold leading-tight text-sidebar-foreground md:text-sm lg:text-base">
            {direction === DIRECTIONS.RTL ? 'القسم ' : 'Section '}
            <span dir="ltr" className="tabular-nums [unicode-bidi:isolate]">
              {section.position}
            </span>
            : {section.title}
          </h3>
          <p className="text-start text-xs text-sidebar-foreground/70 md:text-sm">
            <span dir="ltr" className="tabular-nums [unicode-bidi:isolate]">
              {statistics.completedLectures} / {statistics.totalLectures}
            </span>
            {' | '}
            <span dir="ltr" className="tabular-nums [unicode-bidi:isolate]">
              {formatDurationFromSeconds(
                statistics.totalDuration,
                locale,
              )}
            </span>
          </p>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-0 pb-0">
        <div className="bg-gray-alpha-50">
          {section.lectures.map((lecture) => (
            <Lecture
              key={lecture.id}
              lecture={lecture}
              courseSlug={courseSlug}
              searchParams={searchParams}
              pathname={pathname}
              direction={direction}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

interface SectionAccordionProps {
  courseSlug: string;
}

export function SectionAccordion({ courseSlug }: SectionAccordionProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const direction = useDocumentDirection();
  const locale =
    direction === DIRECTIONS.RTL ? LANGUAGES.ARABIC : LANGUAGES.ENGLISH;
  const {
    data: sectionsData,
    isLoading: sectionsLoading,
    isError: sectionsError,
    error,
    refetch,
  } = useCourseSections(courseSlug);

  const activeSectionId = React.useMemo(() => {
    if (!pathname || !sectionsData) return null;

    const pathParts = pathname.split('/').filter(Boolean);
    const lectureId = pathParts[pathParts.length - 1];
    if (!lectureId) return null;

    for (const section of sectionsData.sections) {
      if (section.lectures.some((lecture) => lecture.id === lectureId)) {
        return `section-${section.id}`;
      }
    }

    return null;
  }, [pathname, sectionsData]);

  if (sectionsLoading && !sectionsError) {
    return <SectionAccordionSkeleton />;
  }

  if (sectionsError) {
    return (
      <ErrorRetry
        onRetry={() => refetch()}
        message={error instanceof Error ? error.message : undefined}
      />
    );
  }

  if (!sectionsData || sectionsData.sections.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        لا يوجد محتوى لهذه الدورة بعد
      </p>
    );
  }

  return (
    <Accordion
      dir={direction}
      type="multiple"
      className="w-full"
      defaultValue={activeSectionId ? [activeSectionId] : undefined}
    >
      {sectionsData.sections.map((section) => (
        <Section
          key={section.id}
          section={section}
          courseSlug={courseSlug}
          searchParams={searchParams}
          pathname={pathname}
          direction={direction}
          locale={locale}
        />
      ))}
    </Accordion>
  );
}
