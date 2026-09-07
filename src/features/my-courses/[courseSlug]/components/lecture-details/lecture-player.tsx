'use client';

import React, { useEffect } from 'react';
import {
  useLectureDetailQuery,
  useLectureNavigation,
} from '@/features/my-courses/hooks/use-my-courses-queries';
import { useCourseLayoutStore } from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';
import { LectureVideoPlayer } from './lecture-video-player';
import { LectureContentTabs } from './lecture-content-tabs';
import { DEFAULT_MUX_PLAYBACK_ID } from '@/features/my-courses/lib/video';
import { Skeleton } from '@/components/ui/skeleton';

interface LecturePlayerProps {
  lectureId: string;
  courseSlug: string;
}

export function LecturePlayer({
  lectureId,
  courseSlug,
}: LecturePlayerProps) {
  const {
    data: lectureDetails,
    isLoading: isLectureDetailsLoading,
    isError: isLectureDetailsError,
  } = useLectureDetailQuery(lectureId);

  const { data: lectureNavigation, isLoading: isLectureNavigationLoading } =
    useLectureNavigation(lectureId, courseSlug);

  const setActiveLecture = useCourseLayoutStore(
    (state) => state.setActiveLecture,
  );

  const currentLecture = lectureDetails?.lecture;

  useEffect(() => {
    if (!currentLecture) {
      return;
    }

    setActiveLecture({
      lectureId,
      lectureTitle: currentLecture.title,
    });

    return () => {
      setActiveLecture(null);
    };
  }, [currentLecture, lectureId, setActiveLecture]);

  if (isLectureDetailsLoading || isLectureNavigationLoading) {
    return <LecturePlayerSkeleton />;
  }

  if (isLectureDetailsError || !currentLecture) {
    return <LectureNotFoundMessage />;
  }

  const nextLectureId = lectureNavigation?.nextLectureId ?? undefined;
  const muxPlaybackId = DEFAULT_MUX_PLAYBACK_ID;

  return (
    <div className="flex flex-col gap-8 pb-10">
      <LectureVideoPlayer
        playbackId={muxPlaybackId}
        title={currentLecture.title}
        lectureId={lectureId}
        nextLectureId={nextLectureId}
        courseSlug={courseSlug}
        lectureNavigation={lectureNavigation ?? null}
      />

      <div className="px-4">
        <LectureContentTabs />
      </div>
    </div>
  );
}

function LectureNotFoundMessage() {
  return (
    <div className="p-6 text-white text-center rounded-lg bg-destructive/10 border border-destructive/20">
      المحاضرة غير موجودة
    </div>
  );
}

function LecturePlayerSkeleton() {
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
