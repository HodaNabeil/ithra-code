'use client';

import React from 'react';
import { VideoPlayer } from '@/components/shared/video-player';
import { LectureNavigationButtons } from './lecture-navigation-buttons';

interface LectureNavigation {
  prevLectureId?: string | null;
  prevLectureTitle?: string | null;
  prevLecturePosition?: number | null;
  nextLectureId?: string | null;
  nextLectureTitle?: string | null;
  nextLecturePosition?: number | null;
}

interface LectureVideoPlayerProps {
  videoSrc: string;
  lectureId: string;
  courseSlug: string;
  lectureNavigation: LectureNavigation | null;
  onProgress?: (incrementSeconds: number) => void;
  onEnded?: (incrementSeconds: number) => void;
}

export function LectureVideoPlayer({
  videoSrc,
  lectureId,
  courseSlug,
  lectureNavigation,
  onProgress,
  onEnded,
}: LectureVideoPlayerProps) {
  return (
    <div className="w-full bg-black/5">
      <div className="w-full">
        <div className="w-full relative group">
          <div className="h-[88vh] w-full bg-black overflow-hidden relative border-b border-white/5">
            <VideoPlayer
              src={videoSrc}
              instanceKey={lectureId}
              autoPlay
              className="h-full w-full [&>div]:h-full [&>div]:aspect-auto"
              onProgress={onProgress}
              onEnded={onEnded}
            />
          </div>
          <LectureNavigationButtons
            previousLectureId={lectureNavigation?.prevLectureId}
            previousLectureTitle={lectureNavigation?.prevLectureTitle}
            previousLecturePosition={lectureNavigation?.prevLecturePosition}
            nextLectureId={lectureNavigation?.nextLectureId}
            nextLectureTitle={lectureNavigation?.nextLectureTitle}
            nextLecturePosition={lectureNavigation?.nextLecturePosition}
            courseSlug={courseSlug}
          />
        </div>
      </div>
    </div>
  );
}
