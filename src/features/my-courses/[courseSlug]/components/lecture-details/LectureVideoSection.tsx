import React from 'react';
import { MuxVideoPlayer } from '../video/MuxVideoPlayer';
import { NavigationButtons } from './NavigationButtons';

interface LectureVideoSectionProps {
  playbackId: string;
  title: string;
  lectureId: string;
  courseSlug: string;
  nextLectureId?: string;
  navigation: {
    prevLectureId?: string | null;
    prevLectureTitle?: string | null;
    prevLecturePosition?: number | null;
    nextLectureId?: string | null;
    nextLectureTitle?: string | null;
    nextLecturePosition?: number | null;
  } | null;
}

/**
 * SRP: Composes the video player and navigation buttons into a single section.
 * This encapsulates the video-area layout and logic.
 */
export function LectureVideoSection({
  playbackId,
  title,
  lectureId,
  courseSlug,
  nextLectureId,
  navigation,
}: LectureVideoSectionProps) {
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
          <NavigationButtons
            prevId={navigation?.prevLectureId}
            prevTitle={navigation?.prevLectureTitle}
            prevPosition={navigation?.prevLecturePosition}
            nextId={navigation?.nextLectureId}
            nextTitle={navigation?.nextLectureTitle}
            nextPosition={navigation?.nextLecturePosition}
            slug={courseSlug}
          />
        </div>
      </div>
    </div>
  );
}
