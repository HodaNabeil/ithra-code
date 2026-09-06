'use client';

import React, { useEffect } from 'react';
import {
  useLectureDetails,
  useLectureNavigation,
} from '@/features/my-courses/hooks/use-my-courses-queries';
import { useCourseLayoutStore } from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';
import { LectureVideoSection } from './LectureVideoSection';
import { LectureContentTabs } from './index';
import { DEFAULT_MUX_PLAYBACK_ID } from '@/features/my-courses/lib/video';
import { Skeleton } from '@/components/ui/skeleton';

interface LectureViewProps {
  lectureId: string;
  courseSlug: string;
  aiTutorEnabled?: boolean;
}

export function LectureView({
  lectureId,
  courseSlug,
  aiTutorEnabled = false,
}: LectureViewProps) {
  const {
    data: details,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
  } = useLectureDetails(lectureId, courseSlug);

  const { data: navigation, isLoading: isNavLoading } = useLectureNavigation(
    lectureId,
    courseSlug,
  );
  const setCurrentLecture = useCourseLayoutStore((s) => s.setCurrentLecture);

  useEffect(() => {
    if (!details?.lecture) {
      return;
    }

    setCurrentLecture({
      lectureId,
      lectureTitle: details.lecture.title,
    });

    return () => {
      setCurrentLecture(null);
    };
  }, [details?.lecture, lectureId, setCurrentLecture]);

  if (isDetailsLoading || isNavLoading) {
    return <LectureViewSkeleton />;
  }

  if (isDetailsError || !details?.lecture) {
    return (
      <div className="p-6 text-white text-center rounded-lg bg-destructive/10 border border-destructive/20">
        المحاضرة غير موجودة
      </div>
    );
  }

  const { lecture, nextLectureId } = details;
  const playbackId = DEFAULT_MUX_PLAYBACK_ID;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <LectureVideoSection
        playbackId={playbackId}
        title={lecture.title}
        lectureId={lectureId}
        nextLectureId={nextLectureId ?? undefined}
        courseSlug={courseSlug}
        navigation={navigation || null}
      />

      <div className="px-4">
        <LectureContentTabs
          description={lecture.description || undefined}
          updatedAt={lecture.updatedAt}
          aiTutorEnabled={aiTutorEnabled}
          courseSlug={courseSlug}
          lectureId={lectureId}
          lectureTitle={lecture.title}
        />
      </div>
    </div>
  );
}

function LectureViewSkeleton() {
  return (
    <div className="flex flex-col gap-8 pb-10 animate-pulse">
      <div className="w-full aspect-video bg-muted/20 rounded-xl" />
      <div className="px-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <div className="flex gap-4 border-b border-border/40 pb-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </div>
    </div>
  );
}
