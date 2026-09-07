'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  useLectureDetailQuery,
  useLectureNavigation,
} from '@/features/my-courses/hooks/use-my-courses-queries';
import { useUpdateLectureWatchProgress } from '@/features/my-courses/hooks/use-my-courses-mutations';
import { useCourseLayoutStore } from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';
import { LectureVideoPlayer } from './lecture-video-player';
import { LectureContentTabs } from './lecture-content-tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/constants/enums';

interface LecturePlayerProps {
  lectureId: string;
  courseSlug: string;
}

function getHttpStatus(error: unknown): number | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: { status?: number } }).response?.status ===
      'number'
  ) {
    return (error as { response: { status: number } }).response.status;
  }
  return undefined;
}

export function LecturePlayer({
  lectureId,
  courseSlug,
}: LecturePlayerProps) {
  const router = useRouter();
  const stoppedRef = useRef(false);
  const {
    data: lectureDetails,
    isLoading: isLectureDetailsLoading,
    isError: isLectureDetailsError,
  } = useLectureDetailQuery(lectureId);

  const { data: lectureNavigation, isLoading: isLectureNavigationLoading } =
    useLectureNavigation(lectureId, courseSlug);

  const updateProgress = useUpdateLectureWatchProgress(courseSlug);

  const setActiveLecture = useCourseLayoutStore(
    (state) => state.setActiveLecture,
  );

  const currentLecture = lectureDetails?.lecture;

  useEffect(() => {
    stoppedRef.current = false;
  }, [lectureId]);

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

  const handleVideoProgress = useCallback(
    (incrementSeconds: number) => {
      if (stoppedRef.current || incrementSeconds < 1) return;

      updateProgress.mutate(
        { lectureId, incrementTime: incrementSeconds },
        {
          onError: (error) => {
            if (getHttpStatus(error) === 409) {
              stoppedRef.current = true;
            }
          },
        },
      );
    },
    [lectureId, updateProgress],
  );

  const handleVideoEnded = useCallback(
    async (incrementSeconds: number) => {
      if (stoppedRef.current) return;

      const nextLectureId = lectureNavigation?.nextLectureId ?? undefined;

      try {
        await updateProgress.mutateAsync({
          lectureId,
          incrementTime: incrementSeconds >= 1 ? incrementSeconds : undefined,
          isCompleted: true,
        });
        stoppedRef.current = true;

        toast.success('تم إكمال المحاضرة بنجاح');

        if (nextLectureId) {
          toast.info('جاري الانتقال للدرس التالي...');
          setTimeout(() => {
            router.push(
              `/${APP_ROUTES.MY_COURSES}/${courseSlug}/${APP_ROUTES.LEARN}/${APP_ROUTES.LECTURE}/${nextLectureId}`,
            );
          }, 2000);
        } else {
          toast('مبروك! لقد أتممت هذا القسم.');
        }
      } catch (error) {
        if (getHttpStatus(error) === 409) {
          stoppedRef.current = true;
          return;
        }

        console.error('Error marking lecture as completed:', error);
        toast.error('فشل في تحديث حالة المحاضرة');
      }
    },
    [courseSlug, lectureId, lectureNavigation?.nextLectureId, router, updateProgress],
  );

  if (isLectureDetailsLoading || isLectureNavigationLoading) {
    return <LecturePlayerSkeleton />;
  }

  if (isLectureDetailsError || !currentLecture) {
    return <LectureNotFoundMessage />;
  }

  const videoSrc = currentLecture.videoHlsUrl;

  if (!videoSrc) {
    return <LectureVideoUnavailableMessage />;
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <LectureVideoPlayer
        videoSrc={videoSrc}
        lectureId={lectureId}
        courseSlug={courseSlug}
        lectureNavigation={lectureNavigation ?? null}
        onProgress={handleVideoProgress}
        onEnded={handleVideoEnded}
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

function LectureVideoUnavailableMessage() {
  return (
    <div className="flex h-[88vh] w-full items-center justify-center bg-black border-b border-white/5">
      <p className="px-6 text-center text-white/80">
        لا يتوفر مصدر تشغيل لهذه المحاضرة
      </p>
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
