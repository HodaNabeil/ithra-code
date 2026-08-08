import type { Course } from '@/types/course/course.types';
import type { PreviewVideo } from '../stores/course-preview-store';
import { getLectureDurationSeconds } from '@/features/courses/[slug]/utils/get-lecture-duration';

const COURSE_PREVIEW_ID = 'course-preview';

interface BuildOptions {
  /** Direct course preview video URL (mp4 etc.), prepended as first entry. */
  previewVideoUrl?: string | null;
  /** Title used for the course preview entry. */
  courseTitle?: string;
  /** Poster used for the course preview entry. */
  courseThumbnailUrl?: string | null;
}

/**
 * Build the preview playlist:
 *   1) the course's own `previewVideo` (direct media URL) when present;
 *   2) free preview lectures with an HLS (.m3u8) URL, in curriculum order.
 */
export function buildFreePreviewVideosFromSections(
  sections: Course['sections'],
  options: BuildOptions = {},
): PreviewVideo[] {
  const videos: PreviewVideo[] = [];

  if (options.previewVideoUrl) {
    videos.push({
      id: COURSE_PREVIEW_ID,
      title: options.courseTitle ?? 'معاينة الدورة',
      kind: 'video',
      url: options.previewVideoUrl,
      thumbnailUrl: options.courseThumbnailUrl ?? null,
    });
  }

  for (const section of sections) {
    for (const lecture of section.lectures) {
      if (!lecture.isFree) continue;
      const hlsUrl = lecture.video?.hlsUrl;
      if (!hlsUrl) continue;
      videos.push({
        id: lecture.id,
        title: lecture.title,
        kind: 'embed',
        url: hlsUrl,
        thumbnailUrl: lecture.video?.thumbnailUrl ?? null,
        duration: getLectureDurationSeconds(lecture) || null,
      });
    }
  }
  return videos;
}
