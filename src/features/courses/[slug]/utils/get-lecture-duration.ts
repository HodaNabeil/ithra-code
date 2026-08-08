import type { Course } from '@/types/course/course.types';

type CurriculumLecture = Course['sections'][number]['lectures'][number];

/** Video duration in seconds (`video.duration` from the API). */
export function getLectureDurationSeconds(lecture: CurriculumLecture): number {
  const duration = lecture.video?.duration;
  return typeof duration === 'number' && duration > 0 ? duration : 0;
}
