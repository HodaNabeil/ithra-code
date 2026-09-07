import React from 'react';
import { MuxVideoPlayer } from '../video/MuxVideoPlayer';
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
  playbackId: string;
  title: string;
  lectureId: string;
  courseSlug: string;
  nextLectureId?: string;
  lectureNavigation: LectureNavigation | null;
}

export function LectureVideoPlayer({
  playbackId,
  title,
  lectureId,
  courseSlug,
  nextLectureId,
  lectureNavigation,
}: LectureVideoPlayerProps) {
  return (
    <div className="w-full bg-black/5">
      <div className="w-full">
        <div className="w-full relative group">
          <MuxVideoPlayer
            playbackId={playbackId}
            title={title}
            lectureId={lectureId}
            nextLectureId={nextLectureId}
            courseSlug={courseSlug}
          />
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
